"use client";
import { useAuth } from "@/hooks";
import { usePublicClient } from "wagmi";
import type { Address, Hex } from "viem";
import {
  getCoreAddresses,
  LockedGold_getTotalLockedGold,
  LockedGold_getAccountNonvotingLockedGold,
  LockedGold_getAccountTotalLockedGold,
  LockedGold_getTotalPendingWithdrawals,
  LockedGold_unlockingPeriod,
  Election_getTotalVotesForEligibleValidatorGroups,
  Election_getTotalVotesForGroupByAccount,
  Election_getActiveVotesForGroupByAccount,
  Election_getPendingVotesForGroupByAccount,
  Election_getGroupEligibility,
  Election_getActiveVotesForGroup,
  Election_getEpochNumber,
  Validators_getRegisteredValidators,
  Validators_getValidator,
  useElectionWrites,
  Staking_getBalance,
  useStakingManagerWrites,
} from "@/hooks/contracts/CeloStaking/celo_staking";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

function toBigInt(v: bigint | number | string): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(v);
  return BigInt(v);
}

function isValidAddress(addr?: Address | null) {
  return !!addr && addr !== ZERO_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function useCeloStaking() {
  const { chainId, userAddress } = useAuth();
  const { lockedGold, election, validators } = getCoreAddresses(chainId);
  const lgAddr = lockedGold as Address;
  const elAddr = election as Address;
  const vaAddr = validators as Address;
  const userAddr = (userAddress ?? ZERO_ADDRESS) as Address;
  const publicClient = usePublicClient();

  const totalLockedGoldQuery = LockedGold_getTotalLockedGold(
    lgAddr,
    isValidAddress(lgAddr)
  );
  const accountNonVotingQuery = LockedGold_getAccountNonvotingLockedGold(
    lgAddr,
    isValidAddress(lgAddr)
  );
  const accountTotalLockedQuery = LockedGold_getAccountTotalLockedGold(
    lgAddr,
    isValidAddress(lgAddr)
  );
  const totalPendingWithdrawalsQuery = LockedGold_getTotalPendingWithdrawals(
    lgAddr,
    isValidAddress(lgAddr)
  );
  const unlockingPeriodQuery = LockedGold_unlockingPeriod(
    lgAddr,
    isValidAddress(lgAddr)
  );

  const eligibleVotesQuery = Election_getTotalVotesForEligibleValidatorGroups(
    elAddr,
    isValidAddress(elAddr)
  );
  const epochNumberQuery = Election_getEpochNumber(
    elAddr,
    isValidAddress(elAddr)
  );

  const registeredValidatorsQuery = Validators_getRegisteredValidators(
    vaAddr,
    isValidAddress(vaAddr)
  );

  const electionWrites = useElectionWrites(elAddr);
  const stakingWrites = useStakingManagerWrites();

  async function wait(hash?: Hex) {
    if (!hash || !publicClient) return undefined as any;
    return publicClient.waitForTransactionReceipt({ hash });
  }

  function computeStakePositions(targetGroup: Address, addValue: bigint) {
    const data = eligibleVotesQuery?.data;
    const groups = (data?.[0] ?? []) as Address[];
    const totals = (data?.[1] ?? []) as bigint[];
    const map: Record<string, bigint> = {};
    for (let i = 0; i < groups.length; i++)
      map[groups[i].toLowerCase()] = totals[i] ?? 0n;
    const current = map[targetGroup.toLowerCase()] ?? 0n;
    const newVotes = current + toBigInt(addValue);
    let lesser: Address = ZERO_ADDRESS;
    let greater: Address = ZERO_ADDRESS;
    let lesserDiff = -1n;
    let greaterDiff = -1n;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const v = totals[i] ?? 0n;
      if (v <= newVotes) {
        const d = newVotes - v;
        if (lesserDiff === -1n || d < lesserDiff) {
          lesser = g;
          lesserDiff = d;
        }
      }
      if (v >= newVotes) {
        const d = v - newVotes;
        if (greaterDiff === -1n || d < greaterDiff) {
          greater = g;
          greaterDiff = d;
        }
      }
    }
    if (lesser.toLowerCase() === targetGroup.toLowerCase())
      lesser = ZERO_ADDRESS;
    if (greater.toLowerCase() === targetGroup.toLowerCase())
      greater = ZERO_ADDRESS;
    return { lesser, greater };
  }

  async function fastlock(
    reLockAmount: bigint | number,
    valueWei?: bigint | number
  ) {
    const hash = await stakingWrites.fastlock(
      toBigInt(reLockAmount),
      typeof valueWei !== "undefined" ? toBigInt(valueWei) : undefined
    );
    const receipt = await wait(hash);
    return { hash, receipt };
  }

  async function stake(group: Address, valueWei: bigint | number) {
    const { lesser, greater } = computeStakePositions(
      group,
      toBigInt(valueWei)
    );
    const hash = await stakingWrites.stake(
      group,
      toBigInt(valueWei),
      lesser,
      greater
    );
    const receipt = await wait(hash);
    return { hash, receipt };
  }

  async function unlock(amountWei: bigint | number) {
    const hash = await stakingWrites.unlock(toBigInt(amountWei));
    const receipt = await wait(hash);
    return { hash, receipt };
  }

  async function unstake(
    group: Address,
    valueWei: bigint | number,
    lesser: Address,
    greater: Address,
    index: bigint | number
  ) {
    const hash = await stakingWrites.unstake(
      group,
      toBigInt(valueWei),
      lesser,
      greater,
      toBigInt(index)
    );
    const receipt = await wait(hash);
    return { hash, receipt };
  }

  async function withdraw(amountWei: bigint | number) {
    const hash = await stakingWrites.withdraw(toBigInt(amountWei));
    const receipt = await wait(hash);
    return { hash, receipt };
  }

  async function withdrawAllToOwner() {
    const hash = await stakingWrites.withdrawAllToOwner();
    const receipt = await wait(hash);
    return { hash, receipt };
  }

  async function activateForAccount(group: Address) {
    const hash = await electionWrites.activateForAccount(group);
    const receipt = await wait(hash);
    return { hash, receipt };
  }

  const stakingBalanceQuery = Staking_getBalance(
    userAddr,
    isValidAddress(userAddr)
  );

  return {
    chainId,
    lockedGold: lgAddr,
    election: elAddr,
    validators: vaAddr,
    userAddress: userAddr,
    totalLockedGoldQuery,
    accountNonVotingQuery,
    accountTotalLockedQuery,
    totalPendingWithdrawalsQuery,
    unlockingPeriodQuery,
    eligibleVotesQuery,
    epochNumberQuery,
    registeredValidatorsQuery,
    stakingBalanceQuery,
    fastlock,
    stake,
    unlock,
    unstake,
    withdraw,
    withdrawAllToOwner,
    activateForAccount,
    computeStakePositions,
  };
}
