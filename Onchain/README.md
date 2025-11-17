# AhorroJGM Onchain (Hardhat)

## Deployed Contract Addresses
- Celo mainnet (42220): `0x69E974fD8FE0016CCDB059f6e1De302Ff690A3A5` — Token `cCOP`: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
- Celo Sepolia (11142220): `0x250438285600A93d6224B95Ae39f32df63f11059` — Token `cCOP`: `0x5F8d55c3627d2dc0a2B4afa798f877242F382F67`
- Shibuya testnet (Astar, 81): `0x54E1C268D37751Ea0a65b9E58dC3430CA8676575` — Token `USDC`: `0x0000000000000000000000000000000000000000`
- Astar mainnet (592): not recorded in this repository yet
- Base mainnet (8453): not deployed yet — Token `USDC`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia (84532): `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa` — Token `USDC`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Arbitrum One (42161): not deployed yet — Token `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Arbitrum Sepolia (421614): `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa` — Token `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

## Purpose

- Digitize and manage savings funds (Voluntary Pension and University Savings) on EVM‑compatible chains.
- Operate on Celo (deposits with ERC‑20 cCOP) and Astar (deposits with native ASTR).
- Establish maturity rules, privileged roles, and beneficiary wallets for safe withdrawals.
- Provide internal accounting‑style staking on Astar; configurable penalty via `penaltyDuration`.
- Offer Hardhat scripts to compile, test, and deploy reproducibly across multiple networks.

## Useful Commands

- Compile: `npm run compile`
- Test: `npm run test`
- Deploy EVM mainnets (Celo, Base, Arbitrum): `npm run deploy:evm-mainnet`
- Deploy EVM Sepolia (Celo, Base, Arbitrum): `npm run deploy:evm-sepolia`
- Deploy on Astar mainnet: `npm run deploy:astar-mainnet`
- Deploy on Shibuya testnet: `npm run deploy:shibuya`
- Operate on EVM mainnets (work scripts): `npm run work:evm`
- Operate on EVM Sepolia: `npm run work:evm-sepolia`
- Operate on Astar mainnet: `npm run work:astar`
- Operate on Shibuya testnet: `npm run work:shibuya`

## Key Features

Includes `contracts/SavesJVN.sol` with the following capabilities:

- Create funds of type Voluntary Pension or University Savings, with a minimum duration of 5 years for Voluntary Pension.
- Define up to 4 privileged wallets (can perform staking and withdraw upon maturity).
- Define up to 4 beneficiary wallets (withdrawal destination).
- Deposits:
  - On Celo (cCOP ERC‑20): `depositToken(fundId, amount)` with prior token approval.
  - On Astar (native ASTR): `depositNative(fundId)` sending `msg.value`.
- Accounting‑style staking on Astar: `stakeASTR(fundId, amount)` and `endStake(fundId, amount)`.
  - Configure target dApp for staking: `setDappTarget(fundId, dapp)`.
  - Configurable penalty based on `penaltyDuration` (seconds). Currently, no additional penalty is applied in `endStake`.
- Withdrawals upon fund maturity: `withdrawToBeneficiary(fundId, amount, to)`.
- Utilities and queries:
  - `getFundsByUser(user)` returns the IDs of funds the user participates in.
  - `isUserInFund(user, fundId)` indicates whether a user is in a fund.
  - `getFund(fundId)` returns fund details (type, times, balances, states).

## Notes

- Ensure you have funds in accounts on each network (CELO and ASTR) to cover gas on mainnets.
- On Celo, you must approve the contract to move cCOP before depositing: `cCOP.approve(SavesJVN, amount)`.
- This contract does not interact with Astar’s dApp staking system; staking is internal accounting.
- Verify official RPC endpoints and corresponding faucets before deploying on testnets.

## Tokens by Network

- Celo mainnet (42220) `cCOP`: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
- Celo Sepolia (11142220) `cCOP`: `0x5F8d55c3627d2dc0a2B4afa798f877242F382F67`
- Base mainnet (8453) `USDC`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia (84532) `USDC`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Arbitrum One (42161) `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Arbitrum Sepolia (421614) `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
