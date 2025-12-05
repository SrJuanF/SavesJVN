"use client";

import { useAuth } from "@/hooks";
import { Navbar } from "@/components/navbar";
import { LoadingScreen } from "@/components/loading-screen";
import Image from "next/image";

export default function LandingPage() {
  const { ready } = useAuth();

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A103D] to-[#0A0A0B] text-white">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        <section className="text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-6 py-6 border border-white/10 shadow-lg">
            <Image src="/logo.png" alt="Saves JVN" width={120} height={120} />
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-extrabold tracking-tight">
            Saves JVN
          </h1>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">
            Multi-chain youth savings platform with family support and DeFi
            rewards.
          </p>
          <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
            Create your plan, deposit anytime, and boost your savings with
            investment funds.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
            <h2 className="text-lg font-semibold">Fund creation</h2>
            <p className="mt-2 text-sm text-gray-300">
              Define your goal: voluntary pension or university savings.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
            <h2 className="text-lg font-semibold">Deposit funds</h2>
            <p className="mt-2 text-sm text-gray-300">
              Contribute freely at any time to grow your fund.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-md">
            <h2 className="text-lg font-semibold">Investment funds</h2>
            <p className="mt-2 text-sm text-gray-300">
              Allocate part of the balance to strategies that seek returns.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-fuchsia-900/40 p-8 shadow-lg">
          <h3 className="text-xl font-bold">
            Micro-contributions with our partners
          </h3>
          <p className="mt-2 text-gray-200">
            For every purchase you make with some of our partners, you can
            enable automatic micro-contributions to your savings funds.
          </p>
          <p className="mt-1 text-gray-400 text-sm">
            Integrate your consumption habits with your savings frictionlessly.
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs text-white/70">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              ★
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              ◆
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              ●
            </span>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Networks and assets</h3>
            <p className="mt-2 text-sm text-gray-300">cCOP (ERC-20) on Celo</p>
            <p className="text-sm text-gray-300">ASTR (native) on Astar</p>
            <p className="mt-2 text-xs text-gray-400">
              We operate securely and efficiently in multi-chain environments.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold">Family support</h3>
            <p className="mt-2 text-sm text-gray-300">
              Invite family to support your goal and manage beneficiaries.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Transparency and privilege control for staking and withdrawals.
            </p>
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="text-gray-300">
            Connect your wallet and/or email from the top bar to get started.
          </p>
        </section>
      </main>
    </div>
  );
}
