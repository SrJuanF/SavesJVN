# Ahorro JVN — DApp de Ahorro Juvenil Web3

Ahorro JVN es una plataforma descentralizada de ahorro juvenil construida sobre Next.js, TailwindCSS, y redes Web3 como Astar y Celo, que permite a jóvenes, familiares e instituciones crear, gestionar y hacer crecer fondos de ahorro con impacto social.

## 🚀 Visión

Promover la inclusión financiera juvenil mediante una aplicación sencilla y transparente que combine ahorro, microaportes automáticos y staking, impulsando la educación y el futuro económico de las nuevas generaciones.

## 🎯 Objetivos del Proyecto

- Democratizar el acceso al ahorro y la inversión desde edades tempranas.
- Fomentar la colaboración familiar y comunitaria en metas financieras de largo plazo.
- Integrar ecosistemas Web3 con propósitos reales, usando ASTR y cCOP como monedas base.
- Simular y luego desplegar flujos financieros: seguro → ahorro → inversión → rendimiento.

## 🧱 Arquitectura General

**Frontend**
- ⚙️ Framework: Next.js 14+ (App Router)
- 🎨 Estilos: Tailwind CSS + shadcn/ui
- 💎 Animaciones: Framer Motion
- 📈 Gráficos: Recharts

**Integraciones Web3**
- 🔗 Redes: Astar (ASTR) y Celo (cCOP)
- 💼 Wallets: Conexión vía Privy (email + social login)
- 💸 Contratos inteligentes (en desarrollo):
  - Microaportes automáticos
  - Staking con reglas y penalizaciones
 - 🔀 Bridge de tokens entre blockchains (simulado en UI): selección de red origen/destino, activos nativos o ERC20 (cCOP/USDC), y opción de ejecutar Depósito o Inversión al llegar. Respeta el ambiente (mainnet/testnet) de la red de origen.

## 🧭 Flujo del Usuario

1. Crear un Fondo de Ahorro
   - Elegir tipo: universitario, pensional, voluntario
   - Definir duración y beneficiarios
2. Depositar Fondos
   - Usar ASTR (Astar) o cCOP (Celo)
   - Visualizar conversión entre redes
3. Activar Microaportes
   - Configurar redondeo, porcentaje o monto fijo
   - Simular eventos de pago o integrar PSP
4. Hacer Staking
   - Stakear parte del fondo para obtener rendimientos
   - Penalización por retiro anticipado (< 5 años)
5. Bridge entre redes
   - Seleccionar red origen y destino dentro del mismo ambiente (mainnet/testnet)
   - Elegir activo nativo o ERC20 (cCOP/USDC)
   - Definir acción al llegar: Depositar en fondos o Invertir
   - Disponible desde el dropdown de la wallet o el switch de redes

## 🧩 Estructura del Proyecto

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

## 📜 Contratos Desplegados

Las direcciones actuales del contrato principal y tokens están en `hooks/contracts/contracts.json`.

- Chain ID `42220` (Celo Mainnet)
  - Contrato: `0x69E974fD8FE0016CCDB059f6e1De302Ff690A3A5`
  - cCOP: `0x8A567e2aE79CA692Bd748aB832081C45de4041eA`
- Chain ID `11142220`
  - Contrato: `0x250438285600A93d6224B95Ae39f32df63f11059`
  - cCOP: `0x5F8d55c3627d2dc0a2B4afa798f877242F382F67`
- Chain ID `81` (Astar Shibuya Testnet)
  - Contrato: `0x54E1C268D37751Ea0a65b9E58dC3430CA8676575`
- Chain ID `8453` (Base Mainnet)
  - USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Chain ID `84532` (Base Sepolia)
  - Contrato: `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa`
  - USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Chain ID `42161` (Arbitrum One)
  - USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Chain ID `421614` (Arbitrum Sepolia)
  - Contrato: `0x2a13F021E8E0622977eF209148e02e5A2eA768Fa`
  - USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

Nota: Verifica el archivo `hooks/contracts/contracts.json` para actualizaciones y ambientes adicionales.

## 🧠 Roadmap — Fase 1 (App & UX)

- Base Next.js + Tailwind y patrones UI
- Formularios y detalle de Fondos (crear, listar, métricas)
- Depósitos a fondos (nativo/erc20) y aprobación de tokens
- Microaportes automáticos (mock + configuración de reglas)
- Identidad y conexión: Privy + Wagmi
- Dashboard con KPIs y resumen financiero
- QR de compras y flujo de aporte

## 🧠 Roadmap — Fase 2 (On‑chain & Infra)

- Staking en blockchain (Astar/Celo)
  - Diseño de reglas, tiempos de maduración y penalizaciones
  - Eventos on-chain y lectura de estado para métricas
  - Integración de retiro y beneficiarios
- Bridge de tokens entre redes
  - UI: catálogo de activos (nativas y ERC20: cCOP/USDC)
  - Validación de ambientes (mainnet/testnet) y selección de redes
  - Acción al llegar: depósito en fondos o inversión
  - Integración con Relayers para ejecución real
- Relayers Nodes en Celo y Astar
  - Topología, colas de mensajes y garantías de entrega
  - Observabilidad (logs, alertas) y seguridad
  - Pruebas de carga y resiliencia
- Indexación y datos
  - Subgraphs (The Graph) para fondos, depósitos, staking y bridges
  - Métricas para dashboard e informes
- Seguridad y auditoría
  - Uso de OpenZeppelin y patrones de acceso
  - Tests unitarios e integración (Hardhat/Foundry)

## 📦 Onchain

El detalle de contratos, tokens y despliegues on-chain vive en `Onchain/README.md` (contratos, redes soportadas, direcciones y guías de pruebas). Refiere también a `hooks/contracts/contracts.json` para el mapa de direcciones usado por el frontend.

## 🌍 Impacto y Comunidad

Ahorro JVN busca ser una herramienta Web3 educativa y social, ideal para:

- Familias que desean apoyar metas de ahorro de jóvenes.
- Escuelas y programas de educación financiera.
- Inversionistas con enfoque de impacto y sostenibilidad.
- Desarrolladores interesados en DeFi con propósito social.

## 🤝 Contribuir

1. Forkea este repositorio
2. Crea una nueva rama (`feature/nueva-funcionalidad`)
3. Haz tus cambios y envía un Pull Request 🚀

## 🧾 Licencia

Este proyecto está bajo licencia MIT — libre para usar, mejorar y compartir.

## 📬 Contacto

- Desarrollador: Daniel Vargas Hermosa
- 🔗 GitHub: `github.com/daniel5312`
- 🔗 LinkedIn: `linkedin.com/in/daniel-vargas-hermosa`