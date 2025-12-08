import type { Address, Hex } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import {
  LockedGoldAbi,
  ElectionAbi,
  ValidatorsAbi,
  StakingCeloAbi,
} from "./abi";

type AddressMap = {
  lockedGold: Address;
  election: Address;
  validators: Address;
};

const CELO_ADDRESSES: Record<number, AddressMap> = {
  42220: {
    lockedGold: "0x6cC083Aed9e3ebe302A6336dBC7c921C9f03349E" as Address,
    election: "0x8D6677192144292870907E3Fa8A5527fE55A7ff6" as Address,
    validators: "0xaEb865bCa93DdC8F47b8e29F40C5399cE34d0C58" as Address,
  },
  11142220: {
    lockedGold: "0x3DB0F0850c5b5f42fe30d68778C8958fC5EE7951" as Address,
    election: "0xeB8B626f3A76174f4576bb47429c47EfDED7C211" as Address,
    validators: "0x5E7b295bd8D80625e2cCac97C98123aaEB5E7Ea5" as Address,
  },
};
const MANAGER_STAKING = "0x0d2622497c5752054165810A4Fcb3eaFa528CC1a" as Address;
export const ELECTION_GROUP_MAINNET = "0xd42Bb7FE32cDf68045f49553c6f851fD2c58B6a9" as Address;

export function getCoreAddresses(chainId: number) {
  const cfg = CELO_ADDRESSES[chainId];
  if (!cfg) throw new Error(`chainId ${chainId} not supported`);
  return cfg;
}

//CELO LOCKED_GOLD

export function LockedGold_getTotalLockedGold(
  lockedGold: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: lockedGold,
    abi: LockedGoldAbi,
    functionName: "getTotalLockedGold",
    args: [],
    query: { enabled },
  }) as { data: bigint | undefined } & ReturnType<typeof useReadContract>;
}

export function LockedGold_unlockingPeriod(
  lockedGold: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: lockedGold,
    abi: LockedGoldAbi,
    functionName: "unlockingPeriod",
    args: [],
    query: { enabled },
  }) as { data: bigint | undefined } & ReturnType<typeof useReadContract>;
}

//CELO ELECTION

export function Election_getTotalVotesForEligibleValidatorGroups(
  election: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: election,
    abi: ElectionAbi,
    functionName: "getTotalVotesForEligibleValidatorGroups",
    args: [],
    query: { enabled },
  }) as { data: [Address[], bigint[]] | undefined } & ReturnType<
    typeof useReadContract
  >;
}

export function Election_getGroupEligibility(
  election: Address,
  group: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: election,
    abi: ElectionAbi,
    functionName: "getGroupEligibility",
    args: [group],
    query: { enabled },
  }) as { data: boolean | undefined } & ReturnType<typeof useReadContract>;
}

export function Election_getActiveVotesForGroup(
  election: Address,
  group: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: election,
    abi: ElectionAbi,
    functionName: "getActiveVotesForGroup",
    args: [group],
    query: { enabled },
  }) as { data: bigint } & ReturnType<typeof useReadContract>;
}

export function Election_getEpochNumber(
  election: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: election,
    abi: ElectionAbi,
    functionName: "getEpochNumber",
    args: [],
    query: { enabled },
  }) as { data: bigint | undefined } & ReturnType<typeof useReadContract>;
}

export const useElectionWrites = (election: Address) => {
  const { writeContractAsync, data, isPending, error } = useWriteContract();
  return {
    data,
    isPending,
    error,
    activateForAccount: async (group: Address): Promise<Hex> => {
      return writeContractAsync({
        address: election,
        abi: ElectionAbi,
        functionName: "activateForAccount",
        args: [group, MANAGER_STAKING],
      });
    },
  };
};

export type ValidatorDetails = {
  ecdsaPublicKey: Hex;
  blsPublicKey: Hex;
  affiliation: Address;
  score: bigint;
  signer: Address;
};

export function Validators_getRegisteredValidators(
  validators: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: validators,
    abi: ValidatorsAbi,
    functionName: "getRegisteredValidators",
    args: [],
    query: { enabled },
  }) as { data: Address[] | undefined } & ReturnType<typeof useReadContract>;
}

export function Validators_getValidator(
  validators: Address,
  validator: Address,
  enabled: boolean = true
) {
  return useReadContract({
    address: validators,
    abi: ValidatorsAbi,
    functionName: "getValidator",
    args: [validator],
    query: { enabled },
  }) as { data: ValidatorDetails | undefined } & ReturnType<typeof useReadContract>;
}

// STAKING MANAGER

export interface StakingBalance {
  locked: bigint;
  unlocking: bigint;
  staked: bigint;
  withdrawed: bigint;
}

export function Staking_getBalance(user: Address, enabled: boolean = true) {
  return useReadContract({
    address: MANAGER_STAKING,
    abi: StakingCeloAbi,
    functionName: "getBalance",
    args: [user],
    query: { enabled },
  }) as { data: StakingBalance | undefined } & ReturnType<
    typeof useReadContract
  >;
}

export const useStakingManagerWrites = () => {
  const { writeContractAsync, data, isPending, error } = useWriteContract();
  const address = MANAGER_STAKING;
  return {
    data,
    isPending,
    error,
    fastlock: async (reLockAmount: bigint, valueWei?: bigint): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi: StakingCeloAbi,
        functionName: "Fastlock",
        args: [reLockAmount],
        value: valueWei,
      });
    },
    unlock: async (amountWei: bigint): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi: StakingCeloAbi,
        functionName: "unlock",
        args: [amountWei],
      });
    },
    withdraw: async (amountWei: bigint): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi: StakingCeloAbi,
        functionName: "withdraw",
        args: [amountWei],
      });
    },
    stake: async (
      group: Address,
      valueWei: bigint,
      lesser: Address,
      greater: Address
    ): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi: StakingCeloAbi,
        functionName: "stake",
        args: [group, valueWei, lesser, greater],
      });
    },
    unstake: async (
      group: Address,
      valueWei: bigint,
      lesser: Address,
      greater: Address,
      index: bigint
    ): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi: StakingCeloAbi,
        functionName: "unstake",
        args: [group, valueWei, lesser, greater, index],
      });
    },
    activableBalance: async (group: Address): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi: StakingCeloAbi,
        functionName: "activableBalance",
        args: [group],
      });
    },
  };
};
