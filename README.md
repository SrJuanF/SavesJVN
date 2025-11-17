## 🚀 Live Demo

Explore the application in action:

[![View Demo](https://img.shields.io/badge/View%20Demo-Vercel-00D9FF?style=for-the-badge&logo=vercel)](https://saves-jvn.vercel.app/)

> **[https://saves-jvn.vercel.app/](https://saves-jvn.vercel.app/)** - Access the production version and discover all available features.

---

## Inspiration

- New, dynamic ways to fund savings and investment, turning everyday activity into impact.
- Two current rails: micro‑contributions from domestic fiat purchases and participation in partner campaigns.
- Empower families and communities to co‑fund education and retirement with transparent rules and beneficiary‑first flows.
- Bridge traditional habits with programmable finance (approvals, staking accounting, role‑based governance) on Astar and Celo.

## What it does

- Creates governed savings funds (university or voluntary pension) with clear maturity rules and up to four privileged and beneficiary wallets.
- Accepts on‑chain deposits: native `ASTR` on Astar, ERC‑20 `cCOP` on Celo with token approval safety and `USDC` on the others networks.
- Captures dynamic contributions off‑chain and routes them on‑chain:
  - Micro‑contributions from national fiat purchases (round‑up/fixed rules; currently mocked with configurable logic).
  - Partner campaign participation, attributing incentives directly to youth funds.
- Provides staking accounting on Astar with configurable `penaltyDuration` for disciplined growth.
- Simulates cross‑network flows (Base, Arbitrum) for future asset routing and bridge integrations.
- Surfaces KPIs and fund metrics in a friendly dashboard; onboarding via Privy.

## How we built it

- Frontend: Next.js 14 (App Router), TailwindCSS, `shadcn/ui`, Framer Motion, and Recharts.
- Identity & wallets: Privy for email/social login; Web3 libraries for seamless connections.
- Smart contracts: Hardhat with `SavesJVN.sol` for funds, deposits, staking accounting, roles, and beneficiaries.
- Dynamic rails architecture: contribution adapters that ingest fiat purchase events or partner campaign signals and queue on‑chain fund top‑ups.
- Networks: Celo (mainnet/Sepolia) for `cCOP`; Astar (Shibuya and mainnet roadmap) for `ASTR`; Base/Arbitrum mapped for USDC.
- Ops: reproducible scripts for compile/test/deploy across environments; addresses sourced from `hooks/contracts/contracts.json`.

## Challenges we ran into

- Designing a simple UX for dynamic contributions while explaining approvals and multi‑chain context.
- Mapping fiat purchase events to fund rules and ensuring compliant, auditable attribution for partner campaigns.
- Keeping staking accounting minimal yet extensible for future on‑chain staking integrations.
- Handling RPC reliability, faucets, and rate limits across testnets and networks.
- Securing beneficiary flows and role privileges against misuse.

## Accomplishments that we're proud of

- Live demo showcasing two dynamic funding rails (fiat purchase micro‑contributions and partner campaigns) alongside on‑chain deposits.
- Deployed contracts and address mappings across Celo mainnet/Sepolia and Shibuya testnet; Base/Arbitrum cataloging for USDC.
- Modular separation of on‑chain logic, off‑chain contribution services, and UI.
- Clear fund lifecycle: create, deposit, dynamic top‑ups, staking accounting, and beneficiary withdrawals at maturity.

## What we learned

- Low‑friction onboarding (Privy) is critical for mainstream adoption of dynamic savings.
- Network specifics matter: approvals, gas, and user mental models differ for native assets and ERC‑20s.
- Event‑driven pipelines and indexing are essential to measure impact and attribute dynamic contributions.
- Consistency across environments requires configuration discipline and rigorous testing.

## What's next for Saves JVN

- Add more dynamic rails: payroll hooks, e‑commerce plugins, PSP round‑ups, loyalty points conversion, and event‑based matching.
- Implement real staking hooks and penalty enforcement on Astar with secure, audited patterns.
- Integrate bridge relayers to turn simulated flows into production cross‑chain deposits/investments.
- Launch subgraphs (The Graph) for funds, deposits, dynamic contributions, staking, and cross‑network analytics.
- Expand deployments: Astar mainnet plus Base/Arbitrum production paths for USDC.
- Strengthen security: OpenZeppelin hardening, audits, and comprehensive unit/integration tests.
- Ship mobile‑first flows and partner toolkits for community campaigns and micro‑contribution programs.


## Milestone 2 Plan — Dynamic Savings Rails (30 Days)

- Headline: Launch dynamic funding rails v1 to turn everyday actions into savings.

- Why: Dynamic rails are the core business lever—micro‑contributions and partner campaigns reduce friction, boost frequency, and grow youth funds sustainably.

- Scope (3–5 core features):
  - Micro‑Contributions (Fiat Purchases) v1: rule engine (round‑up/fixed), event ingestion adapter, attribution to target funds, UI configuration and status.
  - Partner Campaigns v1: campaign registry, participation tracking, incentive attribution rules, KPIs per campaign.
  - Fund Ops Enhancements: privileged roles and beneficiary flows clarity, event emissions for deposits/top‑ups/withdrawals, baseline penalty accounting alignment.
  - Dashboard KPIs v1: surface contributions, deposits, balances, and maturity; seed indexing hooks to evolve into subgraphs later.
  - Wallet & Network Guardrails: Privy + wallet connections hardened; environment‑aware network switching and token approvals UX.

- Weekly Breakdown:
  - Week 1: Design adapters (fiat events, partner signals), define contribution schemas, implement rule engine; add fund events for attribution; UX drafts.
  - Week 2: Build fiat micro‑contribution pipeline (mock PSP hook), link to funds, UI to configure and monitor; partner campaign registry and attribution rules.
  - Week 3: Harden wallet/network UX, approvals flow; expand dashboard KPIs; emit and consume events for contributions and fund ops; integration testing across Celo Sepolia and Shibuya.
  - Week 4: Stabilize, instrument metrics, write docs; demo scenarios (fiat purchase simulation, partner campaign run); prepare rollout plan and backlog for new rails (payroll, e‑commerce plugins).

- Deliverables:
  - Working demo: micro‑contributions and partner campaigns flowing into funds with visible KPIs.
  - Docs: usage guide and adapter specs; environment configuration with `hooks/contracts/contracts.json`.
  - Tests: unit tests for rule engine and attribution; integration tests across supported networks.

- Risks & Mitigations:
  - PSP/API delays: keep mock adapters and local event simulators, abstract via contribution adapters to swap real sources when available.
  - RPC instability: multiple providers, retry/backoff, health checks per environment.
  - Compliance/KYC concerns: non‑custodial model; off‑chain rails attribute value without custody; consult partners before enabling real flows.
  - Partner onboarding lag: run internal test campaigns; publish toolkit and templates to accelerate onboarding.

- Support Needed:
  - Technical: PSP API documentation, partner data access, dedicated RPC endpoints (relayers).
  - Expert advice: compliance guidance for fiat‑to‑on‑chain attribution, campaign incentive design.

- Success Metrics:
  - ≥ 3 funds created and funded via dynamic rails.
  - ≥ 100 micro‑contribution events processed in demo environments.
  - ≥ 2 partner campaign scenarios with visible KPIs and correct attribution.
  - Dashboard shows balances, contributions, and maturity status across environments.

- Prioritized backlog (post‑Milestone):
  - New rails: payroll hooks, e‑commerce plugins, PSP round‑ups, loyalty points conversion, event‑based matching.
  - Subgraphs: funds, deposits, dynamic contributions, staking; expand analytics.
  - Staking: real hooks and penalty enforcement on Astar with audited patterns.



