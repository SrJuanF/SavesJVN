# AhorroJGM Onchain (Hardhat)

## Direcciones de contratos desplegados
- Celo mainnet (42220): `0x69E974fD8FE0016CCDB059f6e1De302Ff690A3A5` — Token `cCOP`: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
- Celo Sepolia (11142220): `0x250438285600A93d6224B95Ae39f32df63f11059` — Token `cCOP`: `0x5F8d55c3627d2dc0a2B4afa798f877242F382F67`
- Shibuya testnet (Astar, 81): `0x54E1C268D37751Ea0a65b9E58dC3430CA8676575` — Token `USDC`: `0x0000000000000000000000000000000000000000`
- Astar mainnet (592): no registrado en este repositorio aún
- Base mainnet (8453): no desplegado aún — Token `USDC`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia (84532): `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa` — Token `USDC`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Arbitrum One (42161): no desplegado aún — Token `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Arbitrum Sepolia (421614): `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa` — Token `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

## Propósito

- Digitalizar y administrar fondos de ahorro (Pensión Voluntaria y Ahorro Universitario) en cadenas compatibles con EVM.
- Operar en Celo (depósitos con token ERC20 cCOP) y Astar (depósitos con moneda nativa ASTR).
- Establecer reglas de madurez, roles con privilegios y wallets beneficiarias para retiros seguros.
- Ofrecer un flujo de staking contable interno en Astar; penalización configurable mediante `penaltyDuration`.
- Proveer scripts Hardhat para compilar, testear y desplegar de forma reproducible en múltiples redes.


 

## Comandos útiles

- Compilar: `npm run compile`
- Test: `npm run test`
- Desplegar EVM mainnets (Celo, Base, Arbitrum): `npm run deploy:evm-mainnet`
- Desplegar EVM Sepolia (Celo, Base, Arbitrum): `npm run deploy:evm-sepolia`
- Desplegar en Astar mainnet: `npm run deploy:astar-mainnet`
- Desplegar en Shibuya testnet: `npm run deploy:shibuya`
- Operar en EVM mainnets (scripts de trabajo): `npm run work:evm`
- Operar en EVM Sepolia: `npm run work:evm-sepolia`
- Operar en Astar mainnet: `npm run work:astar`
- Operar en Shibuya testnet: `npm run work:shibuya`


## Funcionalidades clave

Se incluye `contracts/SavesJVN.sol` con las siguientes capacidades:

- Crear fondos de tipo Pensión Voluntaria o Ahorro Universitario, con duración mínima de 5 años para Pensión Voluntaria.
- Definir hasta 4 wallets con privilegio (pueden hacer staking y retirar al cumplir el tiempo).
- Definir hasta 4 wallets beneficiarias (destino de los retiros).
- Depósitos:
  - En Celo (cCOP ERC20): `depositToken(fundId, amount)` con aprobación previa del token.
  - En Astar (ASTR nativo): `depositNative(fundId)` enviando `msg.value`.
- Staking contable en Astar: `stakeASTR(fundId, amount)` y `endStake(fundId, amount)`.
  - Configurar dApp objetivo para staking: `setDappTarget(fundId, dapp)`.
  - Penalización configurable basada en `penaltyDuration` (segundos). Actualmente no se aplica penalización adicional en `endStake`.
- Retiros al madurar el fondo: `withdrawToBeneficiary(fundId, amount, to)`.
 - Utilidades y consultas:
   - `getFundsByUser(user)` devuelve los IDs de fondos donde participa.
   - `isUserInFund(user, fundId)` indica si el usuario está en un fondo.
   - `getFund(fundId)` retorna detalle del fondo (tipo, tiempos, saldos, estados).

## Notas

- Asegúrate de tener fondos en las cuentas de cada red (CELO y ASTR) para cubrir el gas en mainnets.
- En Celo, debes aprobar el contrato para mover cCOP antes de depositar: `cCOP.approve(SavesJVN, amount)`.
- Este contrato no interactúa con el sistema de dApp staking de Astar; el staking es contable interno.
- Verifica los endpoints RPC oficiales y faucets correspondientes antes de desplegar en testnets.

## Tokens por red

- Celo mainnet (42220) `cCOP`: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
- Celo Sepolia (11142220) `cCOP`: `0x5F8d55c3627d2dc0a2B4afa798f877242F382F67`
- Base mainnet (8453) `USDC`: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia (84532) `USDC`: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Arbitrum One (42161) `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Arbitrum Sepolia (421614) `USDC`: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
