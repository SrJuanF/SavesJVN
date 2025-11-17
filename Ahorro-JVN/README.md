# Ahorro JVN — Web3 Youth Savings DApp

Ahorro JVN is a decentralized youth savings platform built on Next.js, TailwindCSS, and Web3 networks like Astar and Celo. It enables youth, families, and institutions to create, manage, and grow savings funds with social impact.

## 🚀 Vision

Promote youth financial inclusion through a simple and transparent application that combines savings, automatic micro‑contributions, and staking—empowering education and the economic future of new generations.

## 🎯 Project Objectives

- Democratize access to savings and investment from an early age.
- Encourage family and community collaboration around long‑term financial goals.
- Integrate Web3 ecosystems for real‑world purposes, using ASTR and cCOP as base currencies.
- Simulate and then deploy financial flows: insurance → savings → investment → returns.

## 🧱 General Architecture

**Frontend**
- Framework: Next.js 14+ (App Router)
- Styles: Tailwind CSS + shadcn/ui
- Animations: Framer Motion
- Charts: Recharts

**Web3 Integrations**
- Networks: Astar (ASTR) and Celo (cCOP)
- Wallets: Connection via Privy (email + social login)
- Smart contracts (in development):
  - Automatic micro‑contributions
  - Staking with rules and penalties
- Token bridge between blockchains (simulated in the UI): select source/destination network, native or ERC‑20 assets (cCOP/USDC), and choose whether to Deposit or Invest upon arrival. Respects the environment (mainnet/testnet) of the source network.

## 🧭 User Flow

1. Create a Savings Fund
   - Choose type: university, pension, voluntary
   - Define duration and beneficiaries
2. Deposit Funds
   - Use ASTR (Astar) or cCOP (Celo)
   - Visualize cross‑network conversion
3. Activate Micro‑Contributions
   - Configure round‑up, percentage, or fixed amount
   - Simulate payment events or integrate a PSP
4. Staking
   - Stake part of the fund to obtain returns
   - Penalty for early withdrawal (< 5 years)
5. Cross‑network Bridge
   - Select source and destination networks within the same environment (mainnet/testnet)
   - Choose native asset or ERC‑20 (cCOP/USDC)
   - Define action upon arrival: Deposit into funds or Invest
   - Available from the wallet dropdown or network switch

## 🧩 Project Structure

```
components/
  funds/
    CreateFundForm.tsx
    FundCard.tsx
    FundList.tsx
  deposits/
    DepositFlow.tsx
    SelectCurrency.tsx
  microaporte/
    MicroAporteSettings.tsx
    MicroAporteStatus.tsx
  staking/
    StakingManager.tsx
    StakeModal.tsx
    UnstakeModal.tsx

app/
  dashboard/
    page.tsx
  dashboard/funds/
    page.tsx
  dashboard/deposit/
    page.tsx
  dashboard/staking/
    page.tsx
  dashboard/microaporte/
    page.tsx
```

## 📜 Deployed Contracts

Current addresses for the main contract and tokens are in `hooks/contracts/contracts.json`.

- Chain ID `42220` (Celo Mainnet)
  - Contract: `0x69E974fD8FE0016CCDB059f6e1De302Ff690A3A5`
  - cCOP: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
- Chain ID `11142220`
  - Contract: `0x250438285600A93d6224B95Ae39f32df63f11059`
  - cCOP: `0x5F8d55c3627d2dc0a2B4afa798f877242F382F67`
- Chain ID `81` (Astar Shibuya Testnet)
  - Contract: `0x54E1C268D37751Ea0a65b9E58dC3430CA8676575`
- Chain ID `8453` (Base Mainnet)
  - USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Chain ID `84532` (Base Sepolia)
  - Contract: `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa`
  - USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Chain ID `42161` (Arbitrum One)
  - USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Chain ID `421614` (Arbitrum Sepolia)
  - Contract: `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa`
  - USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

Note: Check the `hooks/contracts/contracts.json` file for updates and additional environments.

## 🧠 Roadmap — Phase 1 (App & UX)

- Next.js + Tailwind base and UI patterns
- Fund forms and details (create, list, metrics)
- Deposits to funds (native/ERC‑20) and token approval
- Automatic micro‑contributions (mock + rule configuration)
- Identity and connection: Privy + Wagmi
- Dashboard with KPIs and financial summary
- Purchase QR and contribution flow

## 🧠 Roadmap — Phase 2 (On‑chain & Infra)

- Blockchain staking (Astar/Celo)
  - Design rules, maturity times, and penalties
  - On‑chain events and state reading for metrics
  - Integration of withdrawals and beneficiaries
- Token bridge between networks
  - UI: asset catalog (native and ERC‑20: cCOP/USDC)
  - Environment validation (mainnet/testnet) and network selection
  - Action on arrival: deposit into funds or investment
  - Integration with relayers for real execution
- Relayer nodes on Celo and Astar
  - Topology, message queues, and delivery guarantees
  - Observability (logs, alerts) and security
  - Load testing and resilience
- Indexing and data
  - Subgraphs (The Graph) for funds, deposits, staking, and bridges
  - Metrics for dashboard and reports
- Security and audit
  - Use of OpenZeppelin and access patterns
  - Unit and integration tests (Hardhat/Foundry)

## 📦 Onchain

Details of contracts, tokens, and on‑chain deployments live in `Onchain/README.md` (contracts, supported networks, addresses, and test guides). Also refer to `hooks/contracts/contracts.json` for the address map used by the frontend.

## 🌍 Impact & Community

Ahorro JVN aims to be an educational and social Web3 tool, ideal for:

- Families who want to support youth savings goals.
- Schools and financial education programs.
- Impact‑focused and sustainability‑minded investors.
- Developers interested in purpose‑driven DeFi.

## 🤝 Contributing

1. Fork this repository
2. Create a new branch (`feature/new-functionality`)
3. Make your changes and submit a Pull Request 🚀

## 🧾 License

This project is under the MIT license — free to use, improve, and share.

## 📬 Contact

- Developer: Daniel Vargas Hermosa
- GitHub: `github.com/daniel5312`
- LinkedIn: `linkedin.com/in/daniel-vargas-hermosa`