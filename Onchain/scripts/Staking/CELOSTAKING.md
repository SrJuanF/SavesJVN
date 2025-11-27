# CELO Staking Protocol– Script `CeloStake.js`

Guía detallada, paso a paso, para entender e integrar el script `scripts/Staking/CeloStake.js` que consume el contrato `contracts/Staking/StakingCelo.sol`. Para la documentación del contrato y sus funcionalidades, consulta `CELOSTAKINGMANAGER.md`.

## Propósito

- Proveer acciones de alto nivel sobre el contrato: lock/relock/unlock/withdraw/stake/unstake.
- Calcular `lesser/greater` y decodificar eventos para integrar con frontends/backends.
- Instanciar y consultar contratos del protocolo Celo necesarios.

## Guía de Integración

1. Configura redes y direcciones en `helper-hardhat-config.js`.
2. Despliega `StakingCelo` y asegúrate de tener su address en `deployments`.
3. Ejecuta el script en la red objetivo y construye la información de los grupos validadores con `fetchValidatorGroupInfo()`.
4. Calcula `lesser/greater` con `findLesserAndGreaterAfterVote()` usando el ranking actual.
5. Ejecuta acciones:
   - `fastlock(relockAmountWei, ethToLockWei)`.
   - `unlock(amountWei)` y posteriormente `withdraw(amountWei)` cuando venza el periodo.
   - `activableBalance(group)` si deseas forzar activación previa (opcional; `stake` ya invoca internamente).
   - `stake(targetGroup, valueWei, groups)` y `unstake(targetGroup, valueWei, index, groups)`.
6. Decodifica eventos con `handleTx` para estados confiables en UI/backend.

## Parámetros `lesser`/`greater` => ("Greater" - TargetGroup - "Lesser")

- Requeridos por `Election` para mantener el ranking.
- El script los calcula considerando el voto hipotético (positivo en stake, negativo en unstake) y los pasa al contrato.

## Buenas prácticas

- Refresca `groups` justo antes de calcular `lesser/greater`.
- Usa `activableBalance(group)` cuando hay `pending` activables.
- Maneja errores con `handleTx` y registra `txHash` y eventos.
- Respeta `unlockingPeriod` antes de intentar `withdraw`.

## Referencias cruzadas

- Lógica completa del contrato y estados internos: ver `CELOSTAKINGMANAGER.md`.

## Dependencias y entorno

- Instancia `LockedGold`, `Election`, `Validators` según la red activa.
  - `LockedGold`: contrato del protocolo Celo que gestiona el CELO bloqueado, el periodo de desbloqueo (`unlockingPeriod`) y los retiros cuando el tiempo ha vencido. Se consulta para conocer cuánto del balance está en estado no-votante y para obtener el total de retiros pendientes.
  - `Election`: contrato del protocolo Celo que administra los votos por grupos de validadores, su elegibilidad y el ranking. Requiere parámetros `lesser/greater` para mantener el orden de la estructura de votos al votar o revocar. Distingue entre votos activos y pendientes que pueden activarse con el cambio de epoch.
  - `Validators`: contrato que expone validadores registrados y sus datos, incluida la afiliación al grupo. Se usa para construir el mapa de grupos y así calcular correctamente el ranking y los parámetros `lesser/greater`.
- ABIs mínimos definidos en el script para llamadas necesarias.

## Variables y eventos

- Variables globales: `LOCKED_GOLD`, `ELECTION`, `VALIDATORS`.
  - `LOCKED_GOLD`: instancia para lecturas de estado del bloqueo (non‑voting locked, total locking, retiros pendientes) que alimentan métricas y decisiones de negocio previas a las acciones.
  - `ELECTION`: instancia para lecturas de votos (activos/pendientes/total por grupo y cuenta), elegibilidad y `epochNumber`; necesaria para calcular `lesser/greater` y evitar errores al votar o revocar.
  - `VALIDATORS`: instancia para obtener validadores y su afiliación de grupo, construyendo un mapa completo de grupos usados por el script.
- Eventos decodificados del contrato: `Locked`, `Relocked`, `Unlocked`, `Withdraw`, `WithdrawnIndex`, `Staked`, `UnstakedPending`, `UnstakedActive`, `Activated`.

## Flujo LockedGold (desde el script)

- Fastlock: wrapper hacia `staking.Fastlock(relockAmountWei, { value })` que decodifica `Relocked` y `Locked`.
  - Para qué sirve: permite reutilizar retiros pendientes (relock) y añadir nuevo CELO bloqueado en una sola operación, optimizando el estado del staking.
  - Validaciones y por qué: el contrato valida que `relockAmountWei` no exceda los fondos en `unlocking` y que existan índices pendientes suficientes, evitando inconsistencias y revertiendo si no hay fondos.
- Unlock: wrapper hacia `staking.unlock(amountWei)` que decodifica `Unlocked`.
  - Para qué sirve: mueve fondos de bloqueado no‑votante a estado de desbloqueo, iniciando el contador de tiempo hacia el retiro.
  - Validaciones y por qué: el contrato valida que `amountWei` no supere el `nonvoting locked` y el disponible, protegiendo contra intentos de desbloquear más de lo que está realmente libre.
- Withdraw: wrapper hacia `staking.withdraw(amountWei)` que decodifica `Withdraw` y `WithdrawnIndex`.
  - Para qué sirve: consume índices de retiro vencidos y transfiere CELO al usuario; maneja retiros parciales acumulados.
  - Validaciones y por qué: el contrato asegura que el periodo haya vencido y que el balance del contrato aumente tras la operación con `LockedGold` antes de transferir al usuario, evitando retiros vacíos.

## Flujo Election (desde el script)

- Activación de votos pendientes: `activableBalance(group)` llama al contrato y decodifica `Activated`.
  - Para qué sirve: convierte votos pendientes activables en votos activos antes de votar de nuevo, manteniendo el ranking actualizado y reduciendo errores de ordenamiento.
  - Validaciones y por qué: el contrato verifica si existen pendientes activables y si ya se activó en el epoch actual para evitar repeticiones innecesarias.
- Stake: calcula `lesser/greater` con `findLesserAndGreaterAfterVote` y llama `staking.stake(...)`. Espera `Staked` y puede decodificar `Activated`.
  - Para qué sirve: asigna parte del CELO bloqueado al grupo objetivo incrementando su voto, manteniendo el orden mediante `lesser/greater`.
  - Validaciones y por qué: el contrato valida elegibilidad del grupo, que `valueWei` sea consistente con los fondos bloqueados y ejecuta `activableBalance` internamente para evitar desalineación.
- Unstake: calcula `lesser/greater` usando voto negativo y llama `staking.unstake(...)`. Espera `UnstakedPending` y/o `UnstakedActive`.
  - Para qué sirve: revoca votos del grupo devolviendo el monto a bloqueado no‑votante, primero consumiendo pendientes y luego activos.
  - Validaciones y por qué: el contrato valida que `valueWei` no exceda lo `staked` y que el ordenamiento se mantenga con `lesser/greater` al revocar.

## Getters y utilidades

- getBalance(user): normaliza a CELO (`ethers.formatEther`) los campos del struct.
  - Para qué sirve: muestra el estado del usuario en el contrato (bloqueado, desbloqueándose, `staked`, retirado) listo para UI o logs.
- printCeloStakingStats(account, group): métricas LockedGold y Election (nonVoting, totalLocked, pendingWithdrawals, epochNumber; votos por grupo/cuenta).
  - Para qué sirve: ofrece una visión operativa del estado del staking y del grupo para validar precondiciones antes de acciones.
- fetchValidatorGroupInfo(): arma mapa de grupos, elegibilidad y votos; ajusta votos activos en grupos inelegibles.
  - Para qué sirve: construye el insumo necesario para calcular `lesser/greater` con una imagen fiel del ranking, incluyendo casos en que grupos inelegibles conservan votos activos.
