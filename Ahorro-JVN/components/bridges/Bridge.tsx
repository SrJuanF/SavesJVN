"use client";

import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import contracts from "@/hooks/contracts/contracts.json";
import { createPortal } from "react-dom";
import { Megaphone } from "lucide-react";

type BridgeModalProps = {
  open: boolean;
  onClose: () => void;
};

export const BridgeModal = ({ open, onClose }: BridgeModalProps) => {
  const { chain } = useAccount();
  const { chains } = useSwitchChain();
  const [processing, setProcessing] = useState(false);

  const [originChainId, setOriginChainId] = useState<number | null>(null);
  const [destChainId, setDestChainId] = useState<number | null>(null);

type AssetItem = { type: "native" | "erc20"; symbol: string; name: string; address?: string | null };
  type CatalogItem = { type: "native" | "erc20"; symbol: string; name: string; addressesByChain?: Record<number, string | null> };
  const [ASSETS_CATALOG] = useState<CatalogItem[]>(() => {
    const zero = "0x0000000000000000000000000000000000000000";
    const get = (obj: any, key: number, prop: string) => {
      const v = obj?.[String(key)]?.[prop];
      return v && v !== zero ? v : null;
    };
    const chainsKnown = [42220, 11142220, 81, 8453, 84532, 42161, 421614];
    const ccopByChain: Record<number, string | null> = {};
    const usdcByChain: Record<number, string | null> = {};
    chainsKnown.forEach((cid) => {
      ccopByChain[cid] = get(contracts, cid, "ccop");
      usdcByChain[cid] = get(contracts, cid, "usdc");
    });
    return [
      { type: "native", symbol: "CELO", name: "Celo" },
      { type: "native", symbol: "CELO", name: "Celo Sepolia" },
      { type: "native", symbol: "ETH", name: "Ethereum" },
      { type: "native", symbol: "ASTR", name: "Astar" },
      { type: "native", symbol: "SBY", name: "Shibuya" },
      { type: "erc20", symbol: "cCOP", name: "cCOP", addressesByChain: ccopByChain },
      { type: "erc20", symbol: "USDC", name: "USDC", addressesByChain: usdcByChain },
    ];
  });
  const [selectedAssetFrom, setSelectedAssetFrom] = useState<AssetItem | null>(null);
  const [selectedAssetTo, setSelectedAssetTo] = useState<AssetItem | null>(null);
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);

  const [keepSameAsset, setKeepSameAsset] = useState(true);

  const [amount, setAmount] = useState("");
  const [actionOnArrival, setActionOnArrival] = useState<"deposit" | "invest">("deposit");
  const [resultMsg, setResultMsg] = useState<string>("");

  const isTest = (id: number | null) => {
    if (!id) return false;
    const ch = chains.find((x) => x.id === id);
    const tn = (ch as any)?.testnet;
    if (typeof tn === "boolean") return tn;
    const nm = (ch?.name || "").toLowerCase();
    if (nm.includes("sepolia") || nm.includes("test")) return true;
    return [81, 84532, 421614, 11142220].includes(id);
  };

  useEffect(() => {
    if (!open) return;
    const initialOrigin = chain?.id ?? chains[0]?.id ?? null;
    setOriginChainId(initialOrigin);
    const envIsTestnet = isTest(initialOrigin);
    const candidates = chains.filter((c) => (isTest(c.id) === envIsTestnet) && c.id !== initialOrigin);
    const firstSameEnv = candidates[0]?.id ?? null;
    setDestChainId(firstSameEnv);
  }, [open, chain?.id, chains]);

  useEffect(() => {
    if (!originChainId) return;
    const originEnv = isTest(originChainId);
    const invalidDest = !destChainId || destChainId === originChainId || isTest(destChainId) !== originEnv;
    if (invalidDest) {
      const candidates = chains.filter((c) => (isTest(c.id) === originEnv) && c.id !== originChainId);
      setDestChainId(candidates[0]?.id ?? null);
    }
  }, [originChainId, destChainId, chains]);

  const pickDefaultNative = (cid: number | null): AssetItem | null => {
    if (!cid) return ASSETS_CATALOG.find((x) => x.type === "native") as any;
    const nm = (chains.find((c) => c.id === cid)?.name || "").toLowerCase();
    const symbol = nm.includes("shibuya") ? "SBY" : nm.includes("astar") ? "ASTR" : nm.includes("celo") ? "CELO" : nm.includes("ethereum") ? "ETH" : "CELO";
    const item = ASSETS_CATALOG.find((x) => x.type === "native" && x.symbol === symbol);
    return item ? ({ type: item.type, symbol: item.symbol, name: item.name, address: null }) : (ASSETS_CATALOG.find((x) => x.type === "native") as any);
  };

  useEffect(() => {
    const def = pickDefaultNative(originChainId);
    setSelectedAssetFrom(def);
  }, [originChainId]);

  useEffect(() => {
    const def = pickDefaultNative(destChainId);
    setSelectedAssetTo(def);
  }, [destChainId]);

  useEffect(() => {
    if (keepSameAsset) {
      setSelectedAssetTo(selectedAssetFrom);
    }
  }, [keepSameAsset, selectedAssetFrom]);

  if (!open) return null;

  const canBridge = () => {
    if (!originChainId || !destChainId) return false;
    if (originChainId === destChainId) return false;
    if (!amount || Number(amount) <= 0) return false;
    if (!selectedAssetFrom) return false;
    if (!keepSameAsset && !selectedAssetTo) return false;
    return true;
  };

  const simulateBridge = async () => {
    if (!canBridge()) return;
    setProcessing(true);
    setResultMsg("");
    await new Promise((r) => setTimeout(r, 1500));
    const originName = chains.find((c) => c.id === originChainId)?.name ?? String(originChainId);
    const destName = chains.find((c) => c.id === destChainId)?.name ?? String(destChainId);
    const assetFrom = selectedAssetFrom?.symbol || "-";
    const assetTo = (keepSameAsset ? assetFrom : selectedAssetTo?.symbol || "-");
    const actionStr = actionOnArrival === "deposit" ? "Depositar" : "Invertir";
    setResultMsg(
      `Simulated bridge: ${amount} ${assetFrom} from ${originName} to ${destName}. Destination asset: ${assetTo}. Action: ${actionStr}.`
    );
    setProcessing(false);
  };

  const content = (
    <div className="fixed inset-0 z-[1000]">
      <div className="fixed inset-0 bg-black/70" onClick={() => !processing && onClose()} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl text-white flex flex-col max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-bold">Asset Bridge</h3>
            <button
              className="rounded-md px-2 py-1 text-sm border border-white/20 hover:bg-white/10"
              onClick={() => !processing && onClose()}
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/15 via-pink-500/10 to-transparent p-4 text-sm shadow-glow">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-pink-400" />
                <div className="space-y-1">
                  <p className="font-extrabold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
                    Incoming Relayers Nodes on Astar and Celo
                  </p>
                  <p className="text-white/90">
                    Coming soon: advanced bridging across ecosystem networks.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-white/70 text-xs">Origin Network</p>
                <select
                  value={originChainId ?? ""}
                  onChange={(e) => setOriginChainId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary p-2"
                >
                  {chains.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-white/70 text-xs">Destination Network</p>
                <select
                  value={destChainId ?? ""}
                  onChange={(e) => setDestChainId(Number(e.target.value))}
                  className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary p-2"
                >
                  {chains
                    .filter((c) => {
                      const origin = originChainId;
                      const ch = chains.find((x) => x.id === c.id);
                      const tnC = (ch as any)?.testnet;
                      const tnO = (chains.find((x) => x.id === origin) as any)?.testnet;
                      const infer = (id: number) => {
                        const nm = (chains.find((x) => x.id === id)?.name || "").toLowerCase();
                        if (nm.includes("sepolia") || nm.includes("test")) return true;
                        return [81, 84532, 421614, 11142220].includes(id);
                      };
                      const isTestC = typeof tnC === "boolean" ? tnC : infer(c.id);
                      const isTestO = typeof tnO === "boolean" ? tnO : infer(origin || c.id);
                      return isTestC === isTestO && c.id !== origin;
                    })
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-semibold">Origin Asset</p>
              <div className="mt-2 relative">
                <button
                  onClick={() => setShowFromList((v) => !v)}
                  className="w-full flex items-center justify-between rounded-md bg-black/30 border border-white/10 text-white p-2"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-pink-500 text-[10px] flex items-center justify-center font-bold">
                      {selectedAssetFrom?.symbol?.slice(0, 2) ?? "-"}
                    </span>
                    <span className="text-sm">
                      {selectedAssetFrom?.name ?? "Select asset"}
                    </span>
                  </span>
                  <span className="text-xs text-white/60">▼</span>
                </button>
                {showFromList && (
                  <div className="absolute z-10 mt-2 w-full rounded-md border border-white/10 bg-black/60 shadow-2xl">
                    <div className="px-3 pt-2 text-[11px] text-white/70">Natives</div>
                    {ASSETS_CATALOG.filter((x) => x.type === "native").map((a, idx) => (
                      <button
                        key={`native-${a.symbol}-${idx}`}
                        onClick={() => { setSelectedAssetFrom({ type: a.type, symbol: a.symbol, name: a.name, address: null }); setShowFromList(false); }}
                        className="w-full flex items-center gap-2 p-2 hover:bg-gray-700"
                      >
                        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-pink-500 text-[10px] flex items-center justify-center font-bold">
                          {a.symbol.slice(0, 2)}
                        </span>
                        <span className="text-sm">{a.name}</span>
                      </button>
                    ))}
                    <div className="border-t border-white/10" />
                    <div className="px-3 pt-2 text-[11px] text-white/70">
                      ERC20 Tokens
                    </div>
                    {ASSETS_CATALOG.filter((x) => x.type === "erc20").map(
                      (a, idx) => (
                        <button
                          key={`erc20-${a.symbol}-${idx}`}
                          onClick={() => {
                            const addr =
                              a.addressesByChain?.[originChainId ?? -1] ?? null;
                            setSelectedAssetFrom({
                              type: a.type,
                              symbol: a.symbol,
                              name: a.name,
                              address: addr,
                            });
                            setShowFromList(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-700"
                        >
                          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-pink-500 text-[10px] flex items-center justify-center font-bold">
                            {a.symbol.slice(0, 2)}
                          </span>
                          <span className="text-sm">{a.name}</span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Destination Asset</p>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={keepSameAsset}
                    onChange={(e) => setKeepSameAsset(e.target.checked)}
                    className="rounded border-white/20 bg-black/30"
                  />
                  Keep same asset
                </label>
              </div>
              {!keepSameAsset && (
                <div className="mt-2 relative">
                  <button
                    onClick={() => setShowToList((v) => !v)}
                    className="w-full flex items-center justify-between rounded-md bg-black/30 border border-white/10 text-white p-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-pink-500 text-[10px] flex items-center justify-center font-bold">
                        {selectedAssetTo?.symbol?.slice(0, 2) ?? "-"}
                      </span>
                      <span className="text-sm">
                        {selectedAssetTo?.name ?? "Select asset"}
                      </span>
                    </span>
                    <span className="text-xs text-white/60">▼</span>
                  </button>
                  {showToList && (
                    <div className="absolute z-10 mt-2 w-full rounded-md border border-white/10 bg-black/60 shadow-2xl">
                      <div className="px-3 pt-2 text-[11px] text-white/70">
                        Native
                      </div>
                      {ASSETS_CATALOG.filter((x) => x.type === "native").map(
                        (a, idx) => (
                          <button
                            key={`native-to-${a.symbol}-${idx}`}
                            onClick={() => {
                              setSelectedAssetTo({
                                type: a.type,
                                symbol: a.symbol,
                                name: a.name,
                                address: null,
                              });
                              setShowToList(false);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-700"
                          >
                            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-pink-500 text-[10px] flex items-center justify-center font-bold">
                              {a.symbol.slice(0, 2)}
                            </span>
                            <span className="text-sm">{a.name}</span>
                          </button>
                        )
                      )}
                      <div className="border-t border-white/10" />
                      <div className="px-3 pt-2 text-[11px] text-white/70">
                        ERC20 Tokens
                      </div>
                      {ASSETS_CATALOG.filter((x) => x.type === "erc20").map(
                        (a, idx) => (
                          <button
                            key={`erc20-to-${a.symbol}-${idx}`}
                            onClick={() => {
                              const addr =
                                a.addressesByChain?.[destChainId ?? -1] ?? null;
                              setSelectedAssetTo({
                                type: a.type,
                                symbol: a.symbol,
                                name: a.name,
                                address: addr,
                              });
                              setShowToList(false);
                            }}
                            className="w-full flex items-center gap-2 p-2 hover:bg-gray-700"
                          >
                            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-pink-500 text-[10px] flex items-center justify-center font-bold">
                              {a.symbol.slice(0, 2)}
                            </span>
                            <span className="text-sm">{a.name}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-white/70 text-xs">Amount</p>
                <input
                  type="number"
                  min={0}
                  step="0.000000000000000001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary p-2"
                />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-white/70 text-xs">Action on arrival</p>
                <div className="mt-1 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="arrivalAction"
                      checked={actionOnArrival === "deposit"}
                      onChange={() => setActionOnArrival("deposit")}
                      className="rounded border-white/20 bg-black/30"
                    />
                    Deposit
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="arrivalAction"
                      checked={actionOnArrival === "invest"}
                      onChange={() => setActionOnArrival("invest")}
                      className="rounded border-white/20 bg-black/30"
                    />
                    Invest
                  </label>
                </div>
              </div>
            </div>

            {resultMsg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">
                {resultMsg}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              className="rounded-md px-3 h-9 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 text-white font-semibold disabled:opacity-50"
              onClick={simulateBridge}
              disabled={!canBridge() || processing}
            >
              {processing ? "Processing..." : "Bridge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, typeof document !== "undefined" ? document.body : ({} as any));
};

export default BridgeModal;
