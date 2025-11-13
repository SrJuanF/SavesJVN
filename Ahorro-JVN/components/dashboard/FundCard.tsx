"use client";

import { useState, useEffect } from "react";
import { utils as ethersUtils } from "ethers";
import type { FundStruct } from "@/hooks/contracts/savesJVN";
import { useSaves, ZERO_ADDRESS } from "@/hooks/core/use-saves";

type FundCardProps = {
  fundId: bigint;
  detail: FundStruct;
  refresh?: () => void;
  collaborators?: string[];
};

export const FundCard = ({ fundId, detail, refresh, collaborators = [] }: FundCardProps) => {
  const { depositNative, depositToken, stakeASTR, withdrawToBeneficiary, tokenAddress } = useSaves();
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("ASTR");
  const [loading, setLoading] = useState<"deposit" | "stake" | "withdraw" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const canWithdraw = Number(detail.endTime) * 1000 <= Date.now();
  const checkoutUrl = "https://app.monabit.io/checkout?collection_id=CHt32TEa5B0OOQyXKQ7k54";
  const isCelo = Boolean(tokenAddress && tokenAddress !== ZERO_ADDRESS);
  const nativeLabel = isCelo ? "CELO" : "ASTR";
  const beneficiariesList = (Array.isArray(detail.beneficiaries) ? detail.beneficiaries : []).filter((a) => String(a) !== ZERO_ADDRESS);
  const withdrawOptions = (collaborators && collaborators.length > 0 ? collaborators : beneficiariesList.map((a) => String(a)));
  const [withdrawToAddr, setWithdrawToAddr] = useState<string | null>(withdrawOptions[0] ? String(withdrawOptions[0]) : null);
  const labelForAddr = (addr: unknown) => {
    const a = String(addr || "");
    if (!a) return null;
    const idx = collaborators.findIndex((x) => x.toLowerCase() === a.toLowerCase());
    return idx >= 0 ? `Colaborador ${idx + 1}` : null;
  };
  useEffect(() => {
    const opts = (collaborators && collaborators.length > 0 ? collaborators : beneficiariesList.map((a) => String(a)));
    if (!withdrawToAddr || !opts.includes(withdrawToAddr)) setWithdrawToAddr(opts[0] ?? null);
  }, [collaborators, beneficiariesList]);

  const deposit = async () => {
    setLoading("deposit");
    try {
      const v = BigInt(ethersUtils.parseUnits((amount || "0").replace(/,/g, "."), 18).toString());
      if (currency === nativeLabel) await depositNative(fundId, v);
      else await depositToken(fundId, v);
      setAmount("");
      refresh?.();
    } finally {
      setLoading(null);
    }
  };

  const stake = async () => {
    setLoading("stake");
    try {
      const v = BigInt(ethersUtils.parseUnits((amount || "0").replace(/,/g, "."), 18).toString());
      if (v > detail.balance) throw new Error("El monto stakeado no puede ser mayor al monto del fondo");
      await stakeASTR(fundId, v);
      setAmount("");
      refresh?.();
    } finally {
      setLoading(null);
    }
  };

  const withdraw = async () => {
    setLoading("withdraw");
    try {
      if (!canWithdraw) throw new Error("El retiro solo es posible al finalizar el tiempo del fondo");
      const v = BigInt(ethersUtils.parseUnits((amount || "0").replace(/,/g, "."), 18).toString());
      if (!withdrawToAddr) throw new Error("Selecciona una wallet de retiro");
      await withdrawToBeneficiary(fundId, v, withdrawToAddr as any);
      setAmount("");
      refresh?.();
    } finally {
      setLoading(null);
    }
  };

  const balanceDisplay = (detail as any)?.balanceStr ?? String(detail?.balance ?? 0n);
  const stakeDisplay = (detail as any)?.stakedBalanceStr ?? String(detail?.stakedBalance ?? 0n);
  const formatTs = (ts?: unknown) => {
    let seconds = 0;
    if (typeof ts === "bigint") seconds = Number(ts);
    else if (typeof ts === "number") seconds = ts;
    else if (typeof ts === "string") {
      const s = ts.trim();
      if (s) {
        try { seconds = Number(BigInt(s)); } catch { const n = Number(s); seconds = Number.isFinite(n) ? n : 0; }
      }
    }
    if (seconds <= 0) return "-";
    const d = new Date(seconds * 1000);
    return isNaN(d.getTime())
      ? "-"
      : d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const startStr = formatTs(detail?.startTime);
  const endStr = formatTs(detail?.endTime);

  return (
    <>
      <div
        className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-glow hover:shadow-2xl transition-transform hover:scale-[1.02] cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg">Fondo #{String(fundId)}</h3>
          <span className="text-xs px-2 py-1 rounded-md border border-white/20 bg-white/10">
            {detail.fundType === 0 ? "Pensión" : "Universitario"}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-white/70">Saldo</p>
            <p className="text-lg font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">{balanceDisplay}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-white/70">Stake</p>
            <p className="text-lg font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">{stakeDisplay}</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-white/70 flex items-center gap-2">
          <span>{startStr}</span>
          <span>→</span>
          <span>{endStr}</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-lg font-bold">Fondo #{String(fundId)}</h3>
                <button className="rounded-md px-2 py-1 text-sm border border-white/20 hover:bg-white/10" onClick={() => setShowModal(false)}>Cerrar</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <FundDetailsPanel fundId={fundId} detail={detail} startStr={startStr} endStr={endStr} collaborators={collaborators} />
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Pago con QR</p>
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-md px-3 h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold"
                        onClick={() => setShowQR((x) => !x)}
                      >
                        {showQR ? "Ocultar QR" : "Mostrar QR"}
                      </button>
                      <a
                        href={checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md px-3 h-9 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white font-semibold flex items-center"
                      >
                        Analizar
                      </a>
                    </div>
                  </div>
                  {showQR && (
                    <div className="mt-3 flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutUrl)}`}
                        alt="QR de pago"
                        className="rounded-md border border-white/10"
                        width={220}
                        height={220}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm">Moneda de depósito</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary p-2">
                    {isCelo ? <option value="cCOP">cCOP</option> : null}
                    <option value={nativeLabel}>{nativeLabel}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm">Wallet para retiro</label>
                  <select
                    value={withdrawToAddr ?? ""}
                    onChange={(e) => setWithdrawToAddr(e.target.value || null)}
                    className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary p-2"
                  >
                    {withdrawOptions.length === 0 ? (
                      <option value="">Sin colaboradores</option>
                    ) : (
                      withdrawOptions.map((addr, i) => {
                        const label = labelForAddr(addr) ?? `Colaborador ${i + 1}`;
                        return (
                          <option key={`w-${i}`} value={String(addr)}>{`${label} - ${String(addr)}`}</option>
                        );
                      })
                    )}
                  </select>
                </div>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Monto"
                  step="any"
                  className="mt-2 w-full rounded-md bg-black/30 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary p-2"
                />
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button className="w-full h-10 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-glow disabled:opacity-60" onClick={deposit} disabled={loading !== null}>{loading === "deposit" ? "Depositando..." : "Depositar"}</button>
                  <button className="w-full h-10 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white font-semibold shadow-glow disabled:opacity-60" onClick={stake} disabled={loading !== null}>{loading === "stake" ? "Staking..." : "Stake"}</button>
                  <button className="w-full h-10 rounded-md bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white font-semibold shadow-glow disabled:opacity-60" onClick={withdraw} disabled={loading !== null || !canWithdraw || !withdrawToAddr}>{loading === "withdraw" ? "Retirando..." : "Retirar"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
type FundDetailsPanelProps = {
  fundId: bigint;
  detail: FundStruct;
  startStr: string;
  endStr: string;
  collaborators?: string[];
};

const FundDetailsPanel = ({ fundId, detail, startStr, endStr, collaborators = [] }: FundDetailsPanelProps) => {
  const balanceDisplay = (detail as any)?.balanceStr ?? String(detail?.balance ?? 0n);
  const stakeDisplay = (detail as any)?.stakedBalanceStr ?? String(detail?.stakedBalance ?? 0n);
  const privilegedList = (Array.isArray(detail.privileged) ? detail.privileged : []).filter((a) => String(a) !== ZERO_ADDRESS);
  const beneficiariesList = (Array.isArray(detail.beneficiaries) ? detail.beneficiaries : []).filter((a) => String(a) !== ZERO_ADDRESS);
  const labelForAddr = (addr: unknown) => {
    const a = String(addr || "");
    if (!a) return null;
    const idx = collaborators.findIndex((x) => x.toLowerCase() === a.toLowerCase());
    return idx >= 0 ? `Colaborador ${idx + 1}` : null;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-white/70 text-xs">Saldo</p>
          <p className="text-xl font-extrabold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">{balanceDisplay}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-white/70 text-xs">Stake</p>
          <p className="text-xl font-extrabold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">{stakeDisplay}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-white/70">Inicio</p>
          <p className="font-semibold">{startStr}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-white/70">Fin</p>
          <p className="font-semibold">{endStr}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-white/70">Propietario</p>
            <p className="font-semibold break-all">{String(detail.owner)}</p>
          </div>
          <div>
            <p className="text-white/70">Tipo</p>
            <p className="font-semibold">{detail.fundType === 0 ? "Pensión" : "Universitario"}</p>
          </div>
          <div>
            <p className="text-white/70">Estado</p>
            <p className="font-semibold">{detail.active ? "Activo" : "Inactivo"}</p>
          </div>
          <div>
            <p className="text-white/70">ID</p>
            <p className="font-semibold">{String(fundId)}</p>
          </div>
        </div>
        {privilegedList.length > 0 && (
          <div className="mt-3">
            <p className="text-white/70 text-xs mb-2">Con permisos</p>
            <div className="flex flex-wrap gap-2">
              {privilegedList.map((addr, i) => {
                const label = labelForAddr(addr);
                return (
                  <span key={`p-${i}`} className="text-[10px] rounded-md px-2 py-1 border border-white/20 bg-white/10 break-all">
                    {label ? `${label} - ${String(addr)}` : String(addr)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {beneficiariesList.length > 0 && (
          <div className="mt-3">
            <p className="text-white/70 text-xs mb-2">Conectados</p>
            <div className="flex flex-wrap gap-2">
              {beneficiariesList.map((addr, i) => {
                const label = labelForAddr(addr);
                return (
                  <span key={`b-${i}`} className="text-[10px] rounded-md px-2 py-1 border border-white/20 bg-white/10 break-all">
                    {label ? `${label} - ${String(addr)}` : String(addr)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
