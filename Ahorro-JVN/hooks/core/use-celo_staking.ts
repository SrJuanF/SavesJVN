"use client";
import { useAuth } from "@/hooks";
import { usePublicClient } from "wagmi";
import { useEffect, useState } from "react";
import type { Address, Hex } from "viem";
import { getAddress } from "viem";
import { utils as ethersUtils } from "ethers";
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
  const publicClient = usePublicClient();
  const isCeloNet = chainId === 42220 || chainId === 11142220;
  if (!isCeloNet) {
    return {
      state: {
        groups: [],
        addressToGroup: {},
        totalLocked: 0n,
        totalVotes: 0n,
      },
      Errors: null,
      userBalance: {
        locked: "0",
        unlocking: "0",
        staked: "0",
        withdrawed: "0",
      },
      epochNumber: undefined,
      unlockingPeriod: undefined,
      stake: async (_amount: bigint) => {
        throw new Error("Celo staking not available on current network");
      },
      unstake: async (_amount: bigint) => {
        throw new Error("Celo staking not available on current network");
      },
      txConfirmation: null,
    };
  }
  const { lockedGold, election, validators } = getCoreAddresses(chainId);
  // State Variables
  const [state, setState] = useState<{
    groups: Group[];
    addressToGroup: GroupMap;
    totalLocked: bigint;
    totalVotes: bigint;
  } | null>(null);
  const [userBalance, setUserBalance] = useState<{
    locked: string;
    unlocking: string;
    staked: string;
    withdrawed: string;
  } | null>(null);
  const [TargetGroup, setTargetGroup] = useState<Address | null>(null);
  const [Errors, setErrors] = useState<string | null>(null);

  // Fetch Validators Data
  const registeredValidators = Validators_getRegisteredValidators(
    validators,
    authenticated
  );
  const validatorsReady = Boolean(isCeloNet && validators && !registeredValidators?.isPending && Array.isArray(registeredValidators?.data));
  const validatorsIds: Address[] = validatorsReady ? ((registeredValidators?.data as Address[]) ?? []) : [];
  const fixedIds = Array.from({ length: 200 }, (_, i) => validatorsIds[i] ?? 0n);
  const validatorsDetailsAll = fixedIds.map((addr) => Validators_getValidator(validators, addr));
  const validatorsDetails = validatorsDetailsAll.slice(0, validatorsIds.length);
  const ValidatorDetailsData = validatorsDetails.map((q) => {
    const d = (q?.data as any);
    if (!d) return undefined;
    if (Array.isArray(d)) {
      return{
        affiliation: d[2],
        signer: d[4],
      }
    }
    return d;
  }).filter((v) => v !== undefined);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const addrs = registeredValidators.data;
      if (!addrs || addrs.length === 0 || !ValidatorDetailsData || ValidatorDetailsData.length === 0) {
        if (cancelled) return;
        setState({
          groups: [],
          addressToGroup: {},
          totalLocked: 0n,
          totalVotes: 0n,
        });
        setErrors(null);
        return;
      }
      
      try {
        if (addrs.length !== ValidatorDetailsData.length) {
          setErrors("Validator list size does not match details size");
          return;
        }
        const groups: GroupMap = {};
        for (let i = 0; i < addrs.length; i++) {
          const valAddr = addrs[i];
          const valDetails = ValidatorDetailsData[i];
          if(!valDetails.affiliation || !valDetails.signer) return;
          const groupAddr = valDetails.affiliation;
          if (!groups[groupAddr]) {
            groups[groupAddr] = {
              address: groupAddr,
              members: {},
              eligible: false,
              votes: 0n,
            };
          }
          const validator = {
            address: valAddr,
            signer: valDetails.signer,
          };
          groups[groupAddr].members[valAddr] = validator;
        }
        if (groups[ZERO_ADDRESS]) {
          delete groups[ZERO_ADDRESS];
        }
        
        const { eligibleGroups, groupVotes, totalLocked, totalVotes } =
          await fetchVotesAndTotalLocked();
        if (cancelled) return;
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
        if (cancelled) return;
        setState({
          groups: groupsWithIneligibleVotes,
          addressToGroup: groups,
          totalLocked,
          totalVotes,
        });
        const tg = chainId === 11142220 ? groupsWithIneligibleVotes[0].address : ELECTION_GROUP_MAINNET;
        setTargetGroup(tg);
        console.log(groupsWithIneligibleVotes)
      } catch (e: any) {
        if (cancelled) return;
        setErrors(e?.message || "Error fetching validator details");
        setState({
          groups: [],
          addressToGroup: {},
          totalLocked: 0n,
          totalVotes: 0n,
        });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [registeredValidators.data, ValidatorDetailsData]);
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
      throw new Error("Error fetching votes for eligible groups");
    }
    if (!Locked.data || Locked.status !== "success") {
      throw new Error("Error fetching total locked gold");
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
  const getBalanceUser = Staking_getBalance(
    userAddress as Address,
    authenticated
  );
  useEffect(() => {
    if (!getBalanceUser.data) return;
    const result = {
      locked: ethersUtils.formatEther(getBalanceUser.data.locked),
      unlocking: ethersUtils.formatEther(getBalanceUser.data.unlocking),
      staked: ethersUtils.formatEther(getBalanceUser.data.staked),
      withdrawed: ethersUtils.formatEther(getBalanceUser.data.withdrawed),
    };
    console.log(result);
    setUserBalance(result);
  }, [getBalanceUser.data]);

  const epochNumber = Election_getEpochNumber(election, authenticated);
  const unlockingPeriod = LockedGold_unlockingPeriod(lockedGold, authenticated);

  //Write Functions
  const {
    fastlock,
    withdraw,
    stake: stakeCelo,
    unstake: unstakeCelo,
  } = useStakingManagerWrites();

  const [txConfirmation, setTxConfirmation] = useState<{
    hash: Hex;
    status: "success" | "reverted";
  } | null>(null);

  const stake = async (amount: bigint) => {
    try {
      console.log("useCeloStaking.stake", { amount });
      if (!publicClient) throw new Error("Public client is undefined");
      if (!userBalance) throw new Error("User balance is undefined");
      if (!TargetGroup) throw new Error("Target group is undefined");
      if (!state) throw new Error("State is undefined");
      const locked = BigInt(userBalance.locked);
      console.log("userBalance.locked", userBalance.locked);
      console.log("locked", locked);

      if (locked < amount) {
        const unlocking = BigInt(userBalance.unlocking);
        const amountB = amount - locked;
        let auxAmount = amountB;
        let amountRelock = 0n;
        if (unlocking > 0n) {
          amountRelock = unlocking > amountB ? amountB : unlocking;
          auxAmount -= amountRelock;
        }

        const hash = await fastlock(amountRelock, auxAmount);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "reverted") {
          setErrors("Fastlock transaction reverted");
          return;
        }
        //setTxConfirmation({ hash, status: receipt.status });
        setErrors(null);
      }

      const { lesser, greater } = findLesserAndGreaterAfterVote(
        state.groups,
        TargetGroup,
        amount
      );

      const hashStake = await stakeCelo(TargetGroup, amount, lesser, greater);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hashStake,
      });
      if (receipt.status === "reverted") {
        setErrors("Stake transaction reverted");
        return;
      }
      setTxConfirmation({ hash: hashStake, status: receipt.status });
      setErrors(null);
    } catch (e: any) {
      console.error("useCeloStaking.stake error", e);
      setErrors(e?.message || "Transaction failed");
    }
  };
  const unstake = async (amount: bigint) => {
    try {
      console.log("useCeloStaking.unstake", { amount });
      if (!publicClient) throw new Error("Public client is undefined");
      if (!userBalance) throw new Error("User balance is undefined");
      if (!TargetGroup) throw new Error("Target group is undefined");
      if (!state) throw new Error("State is undefined");
      const staked = BigInt(userBalance.staked);

      if (staked < amount) {
        setErrors("Unstake transaction reverted — amount greater than staked");
        return;
      }

      const { lesser, greater } = findLesserAndGreaterAfterVote(
        state.groups,
        TargetGroup,
        amount * -1n
      );

      const hashUnstake = await unstakeCelo(
        TargetGroup,
        amount,
        lesser,
        greater,
        0n
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hashUnstake,
      });
      if (receipt.status === "reverted") {
        setErrors("Transaction unstake reverted");
        return;
      }
      setTxConfirmation({ hash: hashUnstake, status: receipt.status });
      setErrors(null);
    } catch (e: any) {
      console.error("useCeloStaking.unstake error", e);
      setErrors(e?.message || "Transaction failed");
    }
  };

  return {
    state,
    Errors,
    userBalance,
    epochNumber,
    unlockingPeriod,
    stake,
    unstake,
    txConfirmation,
  };
}
