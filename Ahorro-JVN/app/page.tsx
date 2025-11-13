"use client";

import { useAuth } from "@/hooks";
import { Navbar } from "@/components/navbar";
import { LoadingScreen } from "@/components/loading-screen";
import Image from "next/image";

export default function LandingPage() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <LoadingScreen />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A103D] to-[#0A0A0B] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <section className="text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-6 py-6 border border-white/10 shadow-lg">
            <Image src="/logo.png" alt="Ahorro JVN" width={120} height={120} />
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">Ahorro JVN</h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Plataforma de ahorro juvenil multi-chain con apoyo familiar y recompensas DeFi.
          </p>
          <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
            Crea tu plan, deposita cuando quieras y potencia tu ahorro con fondos de inversiones.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
            <h2 className="text-lg font-semibold">Creación de fondo</h2>
            <p className="mt-2 text-sm text-gray-300">Define tu objetivo: pensión voluntaria o ahorro universitario.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
            <h2 className="text-lg font-semibold">Depositar fondos</h2>
            <p className="mt-2 text-sm text-gray-300">Aporta libremente en cualquier momento para hacer crecer tu fondo.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
            <h2 className="text-lg font-semibold">Fondos de inversiones</h2>
            <p className="mt-2 text-sm text-gray-300">Destina parte del saldo a estrategias que buscan rentabilidad.</p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-fuchsia-900/40 p-8 shadow-lg">
          <h3 className="text-xl font-bold">Microaportes con nuestros partners</h3>
          <p className="mt-2 text-gray-200">Por cada compra que realices con algunos de nuestros partners, puedes activar microaportes automáticos a tus fondos de ahorro.</p>
          <p className="mt-1 text-gray-400 text-sm">Integra tus hábitos de consumo con tu ahorro sin fricciones.</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-white/70">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">★</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">◆</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">●</span>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Redes y activos</h3>
            <p className="mt-2 text-sm text-gray-300">cCOP (ERC-20) en Celo</p>
            <p className="text-sm text-gray-300">ASTR (nativa) en Astar</p>
            <p className="mt-2 text-xs text-gray-400">Operamos de forma segura y eficiente en entornos multi-chain.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Acompañamiento familiar</h3>
            <p className="mt-2 text-sm text-gray-300">Invita a familiares a apoyar tu objetivo y administrar beneficiarios.</p>
            <p className="mt-2 text-xs text-gray-400">Transparencia y control de privilegios para staking y retiros.</p>
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="text-gray-300">Conecta tu wallet y/o correo desde la barra superior para comenzar.</p>
        </section>
      </main>
    </div>
  );
}