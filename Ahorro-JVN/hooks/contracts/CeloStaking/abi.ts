import type { Abi } from "viem";

export const LockedGoldAbi: Abi = [
  {
    name: "getTotalLockedGold",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "unlockingPeriod",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
];

export const ElectionAbi: Abi = [
  {
    name: "getTotalVotesForEligibleValidatorGroups",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }, { type: "uint256[]" }],
  },
  {
    name: "getGroupEligibility",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "group", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getActiveVotesForGroup",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "group", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getEpochNumber",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "activateForAccount",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "group", type: "address" },
      { name: "account", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
];

export const ValidatorsAbi: Abi = [
  {
    name: "getRegisteredValidators",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    name: "getValidator",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { type: "bytes" },
      { type: "bytes" },
      { type: "address" },
      { type: "uint256" },
      { type: "address" },
    ],
  },
];

export const StakingCeloAbi: Abi = [
  {
    name: "Fastlock",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_reLockAmount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "activableBalance",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "group", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    name: "getBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "locked", type: "uint256" },
          { name: "unlocking", type: "uint256" },
          { name: "staked", type: "uint256" },
          { name: "withdrawed", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "stake",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "group", type: "address" },
      { name: "value", type: "uint256" },
      { name: "lesser", type: "address" },
      { name: "greater", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "unlock",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "unstake",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "group", type: "address" },
      { name: "value", type: "uint256" },
      { name: "lesser", type: "address" },
      { name: "greater", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_withdrawAmount", type: "uint256" }],
    outputs: [],
  },
];

