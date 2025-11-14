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
  - Fondo de ahorro
  - Microaportes automáticos
  - Staking con reglas y penalizaciones

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

Las direcciones actuales del contrato principal están en `hooks/contracts/contracts.json`.

 - Chain ID `42220` (Celo Mainnet): `0x69E974fD8FE0016CCDB059f6e1De302Ff690A3A5`
 - Chain ID `11142220`: `0x250438285600A93d6224B95Ae39f32df63f11059`
- Chain ID `81` (Astar Shibuya Testnet): `0x54E1C268D37751Ea0a65b9E58dC3430CA8676575`

> Nota: Verifica el archivo `hooks/contracts/contracts.json` para actualizaciones y ambientes adicionales.

## 🧠 Roadmap (Fase 1 → MVP)

- Estructura base Next.js + Tailwind
- Componentes de fondos y formularios
- Flujo de depósitos con simulación on-chain
- Microaportes automáticos (mock + lógica real futura)
- Staking ASTR con contratos de prueba
- Integración de identidad Privy
- Dashboard con métricas y resumen financiero

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