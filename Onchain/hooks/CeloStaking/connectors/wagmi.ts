import type { Abi } from "viem";
import {
  LockedGoldAbi,
  ElectionAbi,
  ValidatorsAbi,
  StakingCeloAbi,
} from "./abis/celo";

type AddressMap = {
  lockedGold: string;
  election: string;
  validators: string;
};

const CELO_ADDRESSES: Record<number, AddressMap> = {
  42220: {
    lockedGold: "0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E",
    election: "0x8D6677192144292870907E3Fa8A5527fE55A7ff6",
    validators: "0xaEb865bCa93DdC8F47b8e29F40C5399cE34d0C58",
  },
  11142220: {
    lockedGold: "0x3DB0F0850c5b5f42fe30d68778C8958fC5EE7951",
    election: "0xeB8B626f3A76174f4576bb47429c47EfDED7C211",
    validators: "0x5E7b295bd8D80625e2cCac97C98123aaEB5E7Ea5",
  },
};
const MANAGER_STAKING = "0x0d2622497c5752054165810A4Fcb3eaFa528CC1a";
const ELECTION_GROUP_MAINNET = "0xd42Bb7FE32cDf68045f49553c6f851fD2c58B6a9";

function getCoreAddresses(chainId: number) {
  const cfg = CELO_ADDRESSES[chainId];
  if (!cfg) throw new Error(`chainId ${chainId} not supported`);
  return cfg;
}

//Celo LOCKED_GOLD

export function LockedGold_getTotalLockedGold(chainId: number) {
  const { lockedGold } = getCoreAddresses(chainId);
  return {
    address: lockedGold as `0x${string}`,
    abi: LockedGoldAbi,
    functionName: "getTotalLockedGold" as const,
    args: [] as const,
  };
}

export function LockedGold_getAccountNonvotingLockedGold(
  chainId: number,
  account: `0x${string}`
) {
  const { lockedGold } = getCoreAddresses(chainId);
  return {
    address: lockedGold as `0x${string}`,
    abi: LockedGoldAbi,
    functionName: "getAccountNonvotingLockedGold" as const,
    args: [account] as const,
  };
}

export function LockedGold_getAccountTotalLockedGold(
  chainId: number,
  account: `0x${string}`
) {
  const { lockedGold } = getCoreAddresses(chainId);
  return {
    address: lockedGold as `0x${string}`,
    abi: LockedGoldAbi,
    functionName: "getAccountTotalLockedGold" as const,
    args: [account] as const,
  };
}

export function LockedGold_getTotalPendingWithdrawals(
  chainId: number,
  account: `0x${string}`
) {
  const { lockedGold } = getCoreAddresses(chainId);
  return {
    address: lockedGold as `0x${string}`,
    abi: LockedGoldAbi,
    functionName: "getTotalPendingWithdrawals" as const,
    args: [account] as const,
  };
}

export function LockedGold_unlockingPeriod(chainId: number) {
  const { lockedGold } = getCoreAddresses(chainId);
  return {
    address: lockedGold as `0x${string}`,
    abi: LockedGoldAbi,
    functionName: "unlockingPeriod" as const,
    args: [] as const,
  };
}

//Celo ELECTION

export function Election_getTotalVotesForEligibleValidatorGroups(
  chainId: number
) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "getTotalVotesForEligibleValidatorGroups" as const,
    args: [] as const,
  };
}

export function Election_getTotalVotesForGroupByAccount(
  chainId: number,
  group: `0x${string}`,
  account: `0x${string}`
) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "getTotalVotesForGroupByAccount" as const,
    args: [group, account] as const,
  };
}

export function Election_getActiveVotesForGroupByAccount(
  chainId: number,
  group: `0x${string}`,
  account: `0x${string}`
) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "getActiveVotesForGroupByAccount" as const,
    args: [group, account] as const,
  };
}

export function Election_getPendingVotesForGroupByAccount(
  chainId: number,
  group: `0x${string}`,
  account: `0x${string}`
) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "getPendingVotesForGroupByAccount" as const,
    args: [group, account] as const,
  };
}

export function Election_getGroupEligibility(
  chainId: number,
  group: `0x${string}`
) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "getGroupEligibility" as const,
    args: [group] as const,
  };
}

export function Election_getActiveVotesForGroup(
  chainId: number,
  group: `0x${string}`
) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "getActiveVotesForGroup" as const,
    args: [group] as const,
  };
}

export function Election_getEpochNumber(chainId: number) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "getEpochNumber" as const,
    args: [] as const,
  };
}

export function Election_activateForAccount(
  chainId: number,
  group: `0x${string}`,
  account: `0x${string}`
) {
  const { election } = getCoreAddresses(chainId);
  return {
    address: election as `0x${string}`,
    abi: ElectionAbi,
    functionName: "activateForAccount" as const,
    args: [group, account] as const,
  };
}

//Celo VALIDATORS

export function Validators_getRegisteredValidators(chainId: number) {
  const { validators } = getCoreAddresses(chainId);
  return {
    address: validators as `0x${string}`,
    abi: ValidatorsAbi,
    functionName: "getRegisteredValidators" as const,
    args: [] as const,
  };
}

export function Validators_getValidator(
  chainId: number,
  account: `0x${string}`
) {
  const { validators } = getCoreAddresses(chainId);
  return {
    address: validators as `0x${string}`,
    abi: ValidatorsAbi,
    functionName: "getValidator" as const,
    args: [account] as const,
  };
}

//MANAGER

export function Staking_getBalance(
  user: `0x${string}`
) {
  return {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "getBalance" as const,
    args: [user] as const,
  };
}

export function Staking_activableBalance(
  group: `0x${string}`
) {
  return {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "activableBalance" as const,
    args: [group] as const,
  };
}

export function Staking_fastlock(
  reLockAmount: bigint,
  valueWei?: bigint
) {
  const p: any = {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "Fastlock" as const,
    args: [reLockAmount] as const,
  };
  if (typeof valueWei === "bigint") p.value = valueWei;
  return p;
}

export function Staking_unlock(
  amountWei: bigint
) {
  return {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "unlock" as const,
    args: [amountWei] as const,
  };
}

export function Staking_withdraw(
  amountWei: bigint
) {
  return {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "withdraw" as const,
    args: [amountWei] as const,
  };
}

export function Staking_stake(
  group: `0x${string}`,
  valueWei: bigint,
  lesser: `0x${string}`,
  greater: `0x${string}`
) {
  return {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "stake" as const,
    args: [group, valueWei, lesser, greater] as const,
  };
}

export function Staking_unstake(
  group: `0x${string}`,
  valueWei: bigint,
  lesser: `0x${string}`,
  greater: `0x${string}`,
  index: bigint
) {
  return {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "unstake" as const,
    args: [group, valueWei, lesser, greater, index] as const,
  };
}

export function Staking_withdrawAllToOwner() {
  return {
    address: MANAGER_STAKING as `0x${string}`,
    abi: StakingCeloAbi,
    functionName: "withdrawAllToOwner" as const,
    args: [] as const,
  };
}
