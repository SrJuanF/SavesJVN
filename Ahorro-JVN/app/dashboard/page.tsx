"use client";

import { useMemo, useState } from "react";
import { useBalance } from "wagmi";
import { Navbar } from "@/components/navbar";
import { LoadingScreen } from "@/components/loading-screen";
import { useAuth } from "@/hooks";
import { useSaves, ZERO_ADDRESS } from "@/hooks/core/use-saves";
import { CreateFundForm } from "@/components/dashboard/CreateFundForm";
import { FundCard } from "@/components/dashboard/FundCard";
import { PurchaseQRModal } from "@/components/dashboard/PurchaseQRModal";
import type { FundStruct } from "@/hooks/contracts/savesJVN";
import { Users, ChevronDown } from "lucide-react";

export default function HomePage() {
  const { ready, userAddress } = useAuth();
  const { readsState, userFunds, userFundsDetailsData, totalBalanceStr, tokenAddress, depositNative, depositToken, currencySymbol, walletDisplayStr } = useSaves();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [showPurchaseQRModal, setShowPurchaseQRModal] = useState(false);

  

  

  const fundsData = useMemo(() => {
    const ids = (userFunds as bigint[] | undefined) || [];
    const details = (userFundsDetailsData as FundStruct[] | undefined) || [];
    const out: { id: bigint; detail: FundStruct }[] = [];
    for (let i = 0; i < ids.length; i++) {
      const d = details[i];
      if (d) out.push({ id: ids[i], detail: d });
    }
    return out;
  }, [userFunds, userFundsDetailsData, refreshKey]);

  

  const collaborators = useMemo(() => {
    const set = new Set<string>();
    for (const f of fundsData) {
      const d = f.detail as any;
      if (!d) continue;
      const ua = (userAddress ?? "").toLowerCase();
      const owner = String(d.owner || "");
      if (owner && owner !== ZERO_ADDRESS && owner.toLowerCase() !== ua) set.add(owner);
      const list = [
        ...(Array.isArray(d.privileged) ? d.privileged : []),
        ...(Array.isArray(d.beneficiaries) ? d.beneficiaries : []),
      ] as string[];
      for (const addr of list) {
        const a = String(addr || "");
        if (!a) continue;
        if (a === ZERO_ADDRESS) continue;
        if (ua && a.toLowerCase() === ua) continue;
        set.add(a);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [fundsData, userAddress]);

  if (!ready || readsState.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0A0A0B] via-[#1A103D] to-[#0A0A0B] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">Tu Dashboard</h1>
            <p className="mt-2 text-gray-200">Gestiona tus fondos, depósitos e inversiones en un solo lugar.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-glow">
              <p className="text-sm text-white/80">Fondos</p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{fundsData.length}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-glow">
              <p className="text-sm text-white/80">Saldo de fondos</p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">{`${totalBalanceStr} ${currencySymbol}`}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-glow">
              <p className="text-sm text-white/80">Saldo de tu wallet</p>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                {walletDisplayStr ? `${walletDisplayStr} ${currencySymbol}` : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-primary/20 to-pink-500/20 p-5 shadow-glow flex items-center justify-center">
              <button
                className="w-full h-10 rounded-md bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 font-semibold px-6 md:px-8 flex items-center justify-center whitespace-nowrap"
                onClick={() => setShowCreateModal(true)}
              >
                Crear Fondo
              </button>
            </div>
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-5 shadow-glow flex items-center justify-center">
              <button
                className="w-full h-10 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-semibold px-6 md:px-8 flex items-center justify-center whitespace-nowrap"
                onClick={() => setShowPurchaseQRModal(true)}
              >
                Leer QR de compra
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                Colaboradores
              </h2>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 border border-white/20 hover:bg-white/10 transition"
                onClick={() => setCollabOpen((x) => !x)}
              >
                <span className="text-sm">{collabOpen ? "Ocultar" : "Mostrar"}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${collabOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
            {collabOpen && (
              <ul className="mt-4 space-y-3">
                {collaborators.length === 0 ? (
                  <li className="text-white/70 text-sm">Sin colaboradores relacionados.</li>
                ) : (
                  collaborators.map((addr, idx) => (
                    <li key={addr} className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                        <div>
                          <p className="font-semibold">{`Colaborador ${idx + 1}`}</p>
                          <p className="text-xs text-white/70">{addr}</p>
                        </div>
                      </div>
                      <a href={`/dashboard?address=${addr}`} className="text-xs rounded-md px-3 py-1 border border-white/20 hover:bg-white/10">Ver relación</a>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Tus Fondos</h2>
            {(!fundsData || fundsData.length === 0) ? (
              <p className="text-gray-400">No hay fondos creados aún.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fundsData.map((f) => (
                  <FundCard
                    key={String(f.id)}
                    fundId={f.id}
                    detail={f.detail}
                    refresh={() => setRefreshKey((x) => x + 1)}
                    collaborators={collaborators}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <PurchaseQRModal
        open={showPurchaseQRModal}
        onClose={() => setShowPurchaseQRModal(false)}
        funds={fundsData}
        tokenAddress={tokenAddress as any}
        depositNative={depositNative}
        depositToken={depositToken}
        onSuccess={() => setRefreshKey((x) => x + 1)}
      />

      {showCreateModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-bold">Crear Fondo</h3>
                <button
                  className="rounded-md px-2 py-1 text-sm border border-white/20 hover:bg-white/10"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cerrar
                </button>
              </div>
              <div className="p-4">
                <CreateFundForm
                  collaborators={collaborators}
                  onSuccess={() => {
                    setShowCreateModal(false);
                    setRefreshKey((x) => x + 1);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

type FundListProps = {
  funds: { id: bigint; detail: FundStruct }[];
  refresh?: () => void;
  collaborators: string[];
};

const FundList = ({ funds, refresh, collaborators }: FundListProps) => {
  if (!funds || funds.length === 0) return <p className="text-gray-400">No hay fondos creados aún.</p>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {funds.map((f) => (
        <FundCard key={String(f.id)} fundId={f.id} detail={f.detail} refresh={refresh} collaborators={collaborators} />
      ))}
    </div>
  );
};
