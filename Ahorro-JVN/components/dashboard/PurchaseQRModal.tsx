"use client";

import { useState } from "react";
import type { FundStruct } from "@/hooks/contracts/savesJVN";
import { ZERO_ADDRESS } from "@/hooks/core/use-saves";

type PurchaseQRModalProps = {
  open: boolean;
  onClose: () => void;
  funds: { id: bigint; detail: FundStruct }[];
  tokenAddress?: string;
  depositNative: (fundId: bigint | number, value?: bigint | number) => Promise<any>;
  depositToken: (fundId: bigint | number, amount: bigint | number) => Promise<any>;
  onSuccess?: () => void;
};

export const PurchaseQRModal = ({ open, onClose, funds, tokenAddress, depositNative, depositToken, onSuccess }: PurchaseQRModalProps) => {
  const [processing, setProcessing] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState<bigint | null>(funds && funds.length > 0 ? funds[0].id : null);
  const [method, setMethod] = useState<"round" | "fixed" | "percent">("fixed");
  if (!open) return null;

  const checkoutUrl = "https://app.monabit.io/checkout?collection_id=CHt32TEa5B0OOQyXKQ7k54";
  const isCelo = Boolean(tokenAddress && tokenAddress !== ZERO_ADDRESS);
  const toWeiStr = (s: string, decimals: number = 18): bigint => {
    const [intPart, decPartRaw = ""] = s.split(".");
    const decPart = (decPartRaw + "0".repeat(decimals)).slice(0, decimals);
    const i = BigInt(intPart || "0") * BigInt("1" + "0".repeat(decimals));
    const d = BigInt(decPart || "0");
    return i + d;
  };
  const amountMap: Record<"round" | "fixed" | "percent", string> = { round: "0.01", fixed: "0.02", percent: "0.02" };

  const analyzeAndPay = async () => {
    window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    if (!funds || funds.length === 0) return;
    const fid = selectedFundId ?? funds[0].id;
    const amountWei = toWeiStr(amountMap[method]);
    setProcessing(true);
    try {
      if (isCelo) await depositToken(fid, amountWei);
      else await depositNative(fid, amountWei);
      onClose();
      onSuccess?.();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !processing && onClose()} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-bold">Compra con QR</h3>
            <button className="rounded-md px-2 py-1 text-sm border border-white/20 hover:bg-white/10" onClick={() => !processing && onClose()}>Cerrar</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">QR de pago - Comercio nacional</p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md px-3 h-9 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white font-semibold"
                    onClick={analyzeAndPay}
                    disabled={processing}
                  >
                    {processing ? "Procesando..." : "Analizar"}
                  </button>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutUrl)}`}
                  alt="QR de pago"
                  className="rounded-md border border-white/10"
                  width={220}
                  height={220}
                />
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold">Microaporte</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                  <label className="text-sm">Selecciona fondo</label>
                  <select
                    value={selectedFundId ? String(selectedFundId) : ""}
                    onChange={(e) => setSelectedFundId(e.target.value ? BigInt(e.target.value) : null)}
                    className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary p-2"
                  >
                    {funds.map((f) => (
                      <option key={String(f.id)} value={String(f.id)}>{`Fondo #${String(f.id)}`}</option>
                    ))}
                  </select>
                  </div>
                  <div>
                  <label className="text-sm">Método de aporte</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary p-2"
                  >
                    <option value="round">Redondeo al entero más cercano (0.01)</option>
                    <option value="fixed">Monto fijo (0.02)</option>
                    <option value="percent">Porcentaje de la transacción (0.02)</option>
                  </select>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};