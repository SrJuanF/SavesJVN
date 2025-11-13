# AhorroJGM Onchain (Hardhat)

## Direcciones de contratos desplegados
- Celo mainnet (42220): `0x8f321369df4778564180eC57B9548393353dEe2B`
- Celo Sepolia (11142220): `0x660cBF691952278bc54265Dfa0E8f1595A4473Ca`
- Shibuya testnet (Astar, 81): `0x466e5A5D22ac54804E92ce1AC4EeDdbff401d44b`
- Astar mainnet (592): no registrado en este repositorio aún

## Propósito

- Digitalizar y administrar fondos de ahorro (Pensión Voluntaria y Ahorro Universitario) en cadenas compatibles con EVM.
- Operar en Celo (depósitos con token ERC20 cCOP) y Astar (depósitos con moneda nativa ASTR).
- Establecer reglas de madurez, roles con privilegios y wallets beneficiarias para retiros seguros.
- Ofrecer un flujo de staking contable interno en Astar con penalización si se finaliza luego del `endTime`.
- Proveer scripts Hardhat para compilar, testear y desplegar de forma reproducible en múltiples redes.


```

## Comandos útiles

- Compilar: `npm run compile`
- Test: `npm run test`
- Desplegar en Celo mainnet: `npm run deploy:celo-mainnet`
- Desplegar en Celo Sepolia: `npm run deploy:celo-sepolia`
- Desplegar en Astar mainnet: `npm run deploy:astar-mainnet`
- Desplegar en Shibuya testnet: `npm run deploy:shibuya`


## Funcionalidades clave

Se incluye `contracts/SavesJVN.sol` con las siguientes capacidades:

- Crear fondos de tipo Pensión Voluntaria o Ahorro Universitario, con duración mínima de 5 años para Pensión Voluntaria.
- Definir hasta 4 wallets con privilegio (pueden hacer staking y retirar al cumplir el tiempo).
- Definir hasta 4 wallets beneficiarias (destino de los retiros).
- Depósitos:
  - En Celo (cCOP ERC20): `depositToken(fundId, amount)` con aprobación previa del token.
  - En Astar (ASTR nativo): `depositNative(fundId)` enviando `msg.value`.
- Staking contable en Astar: `stakeASTR(fundId, amount)` y `endStake(fundId, amount)`.
  - Si se finaliza el staking después del `endTime`, se aplica penalización (`PENALTY_BPS`).
- Retiros al madurar el fondo: `withdrawToBeneficiary(fundId, amount, to)`.

## Notas

- Asegúrate de tener fondos en las cuentas de cada red (CELO y ASTR) para cubrir el gas en mainnets.
- En Celo, debes aprobar el contrato para mover cCOP antes de depositar: `cCOP.approve(SavesJVN, amount)`.
- Este contrato no interactúa con el sistema de dApp staking de Astar; el staking es contable interno.
- Verifica los endpoints RPC oficiales y faucets correspondientes antes de desplegar en testnets.
