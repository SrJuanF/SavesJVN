"use client";
import { useAuth } from "@/hooks";
import { usePublicClient } from "wagmi";
import { useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import { getAddress } from "viem";
import ethers from "ethers";
import {
  ELECTION_GROUP_MAINNET,
  getCoreAddresses,
  LockedGold_getTotalLockedGold,
  LockedGold_unlockingPeriod,
  Election_getTotalVotesForEligibleValidatorGroups,
  Election_getGroupEligibility,
  Election_getActiveVotesForGroup,
  Election_getEpochNumber,
  Validators_getRegisteredValidators,
  Validators_getValidator,
  //useElectionWrites,
  Staking_getBalance,
  useStakingManagerWrites,
} from "@/hooks/contracts/CeloStaking/celo_staking";


type Validator = { address: Address; signer: Address };
type Group = {
  address: Address;
  members: Record<Address, Validator>;
  eligible: boolean;
  votes: bigint;
};
type GroupMap = Record<Address, Group>;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

function bigIntSum(a: readonly number[] | readonly bigint[]): bigint {
  return BigInt(
    a
      .reduce((acc, val) => acc.plus(val.toString()), new BigNumber(0))
      .toFixed(0)
  );
}
function eqAddress(a: Address, b: Address) {
  return getAddress(a) === getAddress(b);
}

export function useCeloStaking() {
  const { chainId, userAddress, authenticated } = useAuth();
  const { lockedGold, election, validators } = getCoreAddresses(chainId);
  // State Variables
  const [state, setState] = useState<{
    groups: Group[];
    addressToGroup: GroupMap;
    totalLocked: bigint;
    totalVotes: bigint;
  }>({
    groups: [],
    addressToGroup: {},
    totalLocked: 0n,
    totalVotes: 0n,
  });
  const [userBalance, setUserBalance] = useState<{
    locked: string;
    unlocking: string;
    staked: string;
    withdrawed: string;
  }>({
    locked: "0",
    unlocking: "0",
    staked: "0",
    withdrawed: "0",
  });
  const [Errors, setErrors] = useState<string | null>(null);

  // Fetch Validators Data
  const fetchValidatorDetails = async (addresses: Address[]) => {
    if (!addresses || addresses.length === 0) return [];
    const validatorDetailsRaw = await Promise.all(
      addresses.map(async (addr) => Validators_getValidator(validators, addr))
    );
    console.log("Validators Length", validatorDetailsRaw.length);
    return validatorDetailsRaw.map((d, i) => {
      if (!d.data) throw new Error(`Validator details missing for index ${i}`);
      const result = d.data;
      return {
        ecdsaPublicKey: result.ecdsaPublicKey,
        blsPublicKey: result.blsPublicKey,
        affiliation: result.affiliation,
        score: result.score,
        signer: result.signer,
      };
    });
  };
  const fetchVotesAndTotalLocked = async () => {
    const votes = await Election_getTotalVotesForEligibleValidatorGroups(
      election
    );
    const Locked = await LockedGold_getTotalLockedGold(lockedGold);

    if (
      !Array.isArray(votes.data) ||
      votes.data.length < 2 ||
      votes.status !== "success"
    ) {
      throw new Error("Error al obtener votos de grupos elegibles");
    }
    if (!Locked.data || Locked.status !== "success") {
      throw new Error("Error al obtener el total de gold bloqueado");
    }

    const eligibleGroups = votes.data[0];
    const groupVotes = votes.data[1];
    const totalVotes = bigIntSum(groupVotes);
    const totalLocked = Locked.data;
    return { eligibleGroups, groupVotes, totalLocked, totalVotes };
  };
  const setVotesForIneligibleGroups = async (groups: GroupMap) => {
    const groupsArray = Object.values(groups);
    const ineligibleGroups = groupsArray
      .filter((g) => g.votes === 0n)
      .filter((g) => g.eligible === false);

    if (ineligibleGroups.length === 0) {
      return groupsArray;
    }

    const votes = await Promise.all(
      ineligibleGroups.map((group) =>
        Election_getActiveVotesForGroup(election, group.address)
      )
    );
    const activeVotesIneligibleGroups = votes.map((entry) => entry.data);

    const modifiedGroups = mergeVotesWithGroups(
      ineligibleGroups,
      activeVotesIneligibleGroups,
      groups
    );

    return Object.values(modifiedGroups);
  };
  const mergeVotesWithGroups = (
    ineligibleGroupsWhichStillHaveElectedMembers: Group[],
    activeVotesIneligibleGroups: bigint[],
    groups: GroupMap
  ) => {
    if (
      ineligibleGroupsWhichStillHaveElectedMembers.length !==
      activeVotesIneligibleGroups.length
    ) {
      console.error("length mismatch between groups and active votes");
      return groups;
    }
    const groupsAfterUpdates = { ...groups };
    ineligibleGroupsWhichStillHaveElectedMembers.forEach((group, i) => {
      const votes = activeVotesIneligibleGroups[i];
      if (typeof votes === "bigint") {
        // add the votes for groups that are ineligible but still have votes
        // note this modifies the original groups object
        groupsAfterUpdates[group.address].votes = votes;
      }
    });
    return groupsAfterUpdates;
  };
  //Lesser and Greater
  const findLesserAndGreaterAfterVote = (
    groups: Group[],
    targetGroup: Address,
    voteWeight: bigint
  ) => {
    const sortedGroups = [...groups].sort((a, b) =>
      b.votes > a.votes ? 1 : -1
    );
    const selectedGroup = sortedGroups.find((g) =>
      eqAddress(targetGroup, g.address)
    );
    const voteTotal = (selectedGroup?.votes || 0n) + voteWeight;
    let greater = ZERO_ADDRESS;
    let lesser = ZERO_ADDRESS;

    // This requires sortedGroups be descending (greatest to lowest)
    for (const g of sortedGroups) {
      if (eqAddress(g.address, targetGroup)) continue;
      if (g.votes < voteTotal) {
        lesser = g.address;
        break;
      }
      greater = g.address;
    }

    return { lesser, greater };
  };

  //Read Functions
  const getBalanceUser = Staking_getBalance(userAddress as Address, authenticated);
  useEffect(() => {
    if (!getBalanceUser.data) return;
    const result = {
      locked: ethers.utils.formatEther(getBalanceUser.data.locked),
      unlocking: ethers.utils.formatEther(getBalanceUser.data.unlocking),
      staked: ethers.utils.formatEther(getBalanceUser.data.staked),
      withdrawed: ethers.utils.formatEther(getBalanceUser.data.withdrawed),
    }
    setUserBalance(result);
  }, [getBalanceUser.data]);

  const epochNumber = Election_getEpochNumber(election, authenticated);
  const unlockingPeriod = LockedGold_unlockingPeriod(lockedGold, authenticated);

  const registeredValidators = Validators_getRegisteredValidators(
    validators,
    authenticated
  );
  useEffect(() => {
    const addrs = registeredValidators.data;
    if (!addrs || addrs.length === 0) {
      setState({
        groups: [],
        addressToGroup: {},
        totalLocked: 0n,
        totalVotes: 0n,
      });
      setErrors(null);
      return;
    }
    let cancelled = false;
    setErrors(null);
    (async () => {
      try {
        const details = await fetchValidatorDetails(addrs as Address[]);
        if (cancelled) return;
        if (addrs.length !== details.length) {
          setErrors(
            "El tamaño de la lista de validadores y sus detalles no coincide"
          );
        }
        // Procesar lista de validadores para crear el mapa de grupos
        const groups: GroupMap = {};
        for (let i = 0; i < addrs.length; i++) {
          const valAddr = addrs[i];
          const valDetails = details[i];
          const groupAddr = valDetails.affiliation;
          // Crear grupo si no existe aún
          if (!groups[groupAddr]) {
            groups[groupAddr] = {
              address: groupAddr,
              members: {},
              eligible: false,
              votes: 0n,
            };
          }
          // Registrar miembro del grupo
          const validator = {
            address: valAddr,
            signer: valDetails.signer,
          };
          groups[groupAddr].members[valAddr] = validator;
        }

        // Remover el grupo "nulo" de validadores sin afiliación
        if (groups[ZERO_ADDRESS]) {
          delete groups[ZERO_ADDRESS];
        }

        const { eligibleGroups, groupVotes, totalLocked, totalVotes } =
          await fetchVotesAndTotalLocked();

        // Marcar los grupos elegibles y asignar sus votos
        for (let i = 0; i < eligibleGroups.length; i++) {
          const groupAddr = eligibleGroups[i];
          const group = groups[groupAddr];
          if (group) {
            group.votes = groupVotes[i];
            group.eligible = true;
          }
        }

        const groupsWithIneligibleVotes = await setVotesForIneligibleGroups(
          groups
        );

        //setState
        setState({
          groups: groupsWithIneligibleVotes,
          addressToGroup: groups,
          totalLocked,
          totalVotes,
        });
      } catch (e: any) {
        if (cancelled) return;
        setErrors(e?.message || "Error obteniendo detalles de validadores");
        setState({
          groups: [],
          addressToGroup: {},
          totalLocked: 0n,
          totalVotes: 0n,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [registeredValidators.data]);

  //Write Functions
  const { fastlock, unlock, withdraw, stake, unstake } = useStakingManagerWrites();
  

  return {
    state,
    Errors,
    userBalance,
    epochNumber,
    unlockingPeriod,
  };
}
