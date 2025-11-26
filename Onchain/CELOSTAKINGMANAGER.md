# CELO Staking Manager Protocol– Contrato `StakingCelo.sol`

Guía detallada, paso a paso, para entender e integrar el contrato `contracts/Staking/StakingCelo.sol` en dApps que gestionan bloqueo de CELO y votos en el sistema de validadores de Celo.

## Propósito

- Simplifica operaciones de staking sobre Celo: lock, relock, unlock, withdraw, vote, revoke y activación de votos pendientes.
- Expone eventos claros para consumo por frontend/backends.
- Encapsula interacción con contratos de protocolo: `Account`, `LockedGold`, `Election` y consulta a `Validators` mediante el script.

## Guía de integración

1. Preparar direcciones del protocolo Celo según la red (Mainnet/Sepolia) en tu configuración.
2. Desplegar `StakingCelo` pasando constructor: `celoAccount`, `celoLockedGold`, `celoElection`, `swapMento`, `cCOP`.
3. Flujos típicos:
   - Lock/relock: llamar `Fastlock(relockAmountWei)` con `value` opcional para nuevo lock.
   - Unlock: llamar `unlock(amountWei)`.
   - Withdraw: llamar `withdraw(amountWei)`; internamente consumirá índices vencidos.
   - Stake: calcular `lesser/greater` y llamar `stake(group, valueWei, lesser, greater)`; el contrato activará pending si aplica.
   - Unstake: calcular `lesser/greater` con voto negativo y llamar `unstake(group, valueWei, index, lesser, greater)`.
4. Consumir eventos para feedback de UI y auditoría.

## Parámetros `lesser`/`greater` => ("Greater" - TargetGroup - "Lesser")

- Requeridos por `Election` para mantener el orden del ranking de grupos.
- Se calculan en el script `CeloStake.js` con `findLesserAndGreaterAfterVote(...)` usando el estado actual de votos y el delta previsto (positivo en stake, negativo en unstake).

## Buenas prácticas implementadas

- Ejecutar `activableBalance(group)` (o confiar en la invocación interna de `stake`) para reducir errores de ordenamiento cuando hay pending activables.
- Respetar `unlockingPeriod` antes de esperar retiros.
- No usar índices de pending obsoletos; el contrato maneja recorrido y recursión.
- Consumir eventos y receipts para estados confiables en UI/backend.
- Mantener `nonReentrant` y checks `require` en flujos externos; no introducir llamadas externas no confiables.

## Ejemplos de uso

- Despliegue y uso con el script de apoyo:
  - `npx hardhat deploy --network celoSepolia --tags StakingCelo`
  - `npx hardhat run scripts/Staking/CeloStake.js --network celoSepolia`

## Referencias cruzadas

- Detalle del script consumidor y cálculo `lesser/greater`: ver `CELOSTAKING.md`.

## Dependencias y constructor

- Importa `Ownable`, `ReentrancyGuard` y las interfaces del protocolo Celo y `IERC20`.
- Constructor: recibe direcciones de `Account`, `LockedGold`, `Election`, `swapMento` y `cCOP` y crea la cuenta del contrato.
  - `Account`: interfaz requerida por el protocolo para que el contrato tenga identidad propia en operaciones de staking.
  - `LockedGold`: gestiona el bloqueo de CELO, el periodo de desbloqueo y retiros pendientes.
  - `Election`: administra votos por grupos de validadores, su elegibilidad y ranking; requiere `lesser/greater`.
  - `swapMento` y `cCOP`: referencias inmutables disponibles para integración con swaps y token del sistema cuando se necesite.
  - Creación de cuenta: `createAccount()` llama a `ACCOUNT.createAccount()` y requiere éxito para habilitar acciones posteriores.

## Variables y eventos

- `UserBalance { locked, unlocking, staked, withdrawed }` y `mapping(address => UserBalance) s_balances`.
- `s_withdrawsAvailable`: acumulador de retiros parciales disponibles tras `withdrawSource`.
- `s_lastEpochNumber[group]`: guarda el último epoch en el que se hizo stake para verificar que se activen los votos en un epoch posterior.
- Eventos: `Locked`, `Relocked`, `Unlocked`, `Withdraw`, `WithdrawnIndex`, `Staked`, `UnstakedPending`, `UnstakedActive`, `Activated`.

## Flujo LockedGold

- `Fastlock(uint256 _reLockAmount)` (payable):
  - Para qué sirve: re‑lock de fondos pendientes (si `_reLockAmount > 0`) y lock de nuevos fondos (`msg.value`) en una sola acción.
  - Validaciones y por qué: asegura que el monto a relock no exceda lo que está en `unlocking` y que existan índices pendientes suficientes.
  - Emite `Relocked` por índice y `Locked` por el total bloqueado.

- `relockSource(uint256 _reLockAmount)` (privada):
  - Para qué sirve: consume índices de retiros pendientes aún no vencidos para volver a bloquearlos.
  - Validaciones y por qué: recorre de más reciente hacia atrás y realiza relocks parciales, repitiendo si aún queda sobrante.
  - Recursiva: si queda `remainig > 0`, vuelve a intentar.

- `unlock(uint256 amount)`:
  - Para qué sirve: mueve fondos de `locked` no‑votante a `unlocking`, iniciando el periodo de espera para retirar.
  - Validaciones y por qué: requiere que `amount` sea menor o igual al `nonvoting locked` disponible para evitar estados inválidos.
  - Emite `Unlocked`.

- `withdraw(uint256 _withdrawAmount)`:
  - Para qué sirve: retira CELO cuyo periodo de desbloqueo ya venció, combinando consumos parciales si aplica.
  - Validaciones y por qué: verifica que haya saldo en `unlocking`, consolida parciales vía `s_withdrawsAvailable`, llama `withdrawSource` y asegura que el balance del contrato aumente antes de transferir al usuario.
  - Transfiere CELO al usuario y emite `Withdraw` + `WithdrawnIndex` por índices consumidos.

- `withdrawSource(uint256 _withdrawAmount)` (privada):
  - Para qué sirve: consume índices ya vencidos llamando `LOCKED_GOLD.withdraw(i)` y ajusta remanentes.
  - Validaciones y por qué: calcula `remainig` tras cada retiro y alimenta `s_withdrawsAvailable` para cubrir montos exactos; repite en forma recursiva.
  - Recursiva: maneja secuencias de varios índices vencidos.

## Flujo Election

- `activableBalance(address group)`:
  - Para qué sirve: convierte votos pendientes activables en activos antes de emitir nuevos votos.
  - Validaciones y por qué: comprueba si hay pendientes activables y evita activar más de una vez por epoch mediante `s_lastEpochNumber`.
  - Resultado: emite `Activated(group)` y devuelve `true` cuando activa.

- `stake(address group, uint256 value, address lesser, address greater)`:
  - Para qué sirve: asigna parte del CELO bloqueado al grupo objetivo incrementando su voto.
  - Validaciones y por qué: requiere grupo elegible y fondos suficientes.
  - Actualiza balances, guarda epoch actual y llama `ELECTION.vote(...)`. Emite `Staked`.
  - Invoca `activableBalance(group)` para activar votos pendientes stakeados anteriormente; aprovecha nuevos stakings para activar anteriores.

- `unstake(address group, uint256 value, address lesser, address greater, uint256 index)`:
  - Para qué sirve: revoca votos y devuelve el valor a bloqueado no‑votante.
  - Validaciones y por qué: exige grupo elegible y que el valor no exceda lo `staked`; revoca primero votos pendientes y luego activos, manteniendo el orden con `lesser/greater`.
  - Emite `UnstakedPending` y `UnstakedActive` según corresponda.

## Getters y utilidades

- `getBalance(address _user)`: devuelve struct con `locked`, `unlocking`, `staked`, `withdrawed`.
  - Para qué sirve: expone el estado del usuario para consumo de UI/backends y decisiones operativas.
- `withdrawAllToOwner()` (solo owner): retira todo el balance del contrato a `owner()`.
  - Para qué sirve: utilitario administrativo para recolectar fondos del contrato cuando se requiera.
