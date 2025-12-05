"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSaves, ZERO_ADDRESS } from "@/hooks/core/use-saves";

type FundFormData = {
  type: "pension" | "universitario";
  durationYears: number;
  privilegedWallets: string;
  beneficiaryWallets: string;
};

type CreateFundFormProps = {
  onSuccess?: () => void;
  collaborators?: string[];
};

export const CreateFundForm = ({ onSuccess, collaborators = [] }: CreateFundFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue,
  } = useForm<FundFormData>();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { createFund, readsState } = useSaves();
  const [selectedPriv, setSelectedPriv] = useState<string[]>([]);
  const [selectedBen, setSelectedBen] = useState<string[]>([]);
  const [showCollabModal, setShowCollabModal] = useState(false);
  useEffect(() => {
    const s = selectedPriv.slice(0, 4).join(", ");
    setValue("privilegedWallets", s, { shouldValidate: true });
  }, [selectedPriv, setValue]);
  useEffect(() => {
    const s = selectedBen.slice(0, 4).join(", ");
    setValue("beneficiaryWallets", s, { shouldValidate: true });
  }, [selectedBen, setValue]);

  const type = useWatch({ control, name: "type" });

  const submit = async (data: FundFormData) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const toArray4 = (v: string) => {
        const arr = v
          .split(/[\s,]+/)
          .filter(Boolean)
          .slice(0, 4);
        while (arr.length < 4) arr.push(ZERO_ADDRESS);
        return arr;
      };
      const fundType = data.type === "pension" ? 0 : 1;
      const durationSeconds = BigInt(
        Math.floor(Number(data.durationYears) * 365 * 24 * 3600)
      );
      const toFixed4 = (arr: string[]) => {
        const out = arr.slice(0, 4);
        while (out.length < 4) out.push(ZERO_ADDRESS);
        return out;
      };
      const privileged = selectedPriv.length > 0 ? toFixed4(selectedPriv) : toArray4(data.privilegedWallets);
      const beneficiaries = selectedBen.length > 0 ? toFixed4(selectedBen) : toArray4(data.beneficiaryWallets);
      await createFund({
        fundType,
        durationSeconds,
        privilegedWallets: privileged,
        beneficiaryWallets: beneficiaries,
      });
      reset();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label>Fund type</label>
        <select
          {...register("type", { required: "Type is required" })}
          className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary p-2"
        >
          <option value="">Select type</option>
          <option value="pension">Voluntary pension</option>
          <option value="universitario">University savings</option>
        </select>
        {errors.type && <p className="text-red-400">{errors.type.message}</p>}
      </div>
      <div>
        <label>Duration (years - decimal notation)</label>
        <input
          type="number"
          step="0.1"
          {...register("durationYears", {
            required: "Duration is required",
            validate: (value) => {
              const val = Number(value);
              if (type === "pension" && val < 5)
                return "Pension requires at least 5 years";
              //if (type === "universitario" && val <= 0) return "La duración debe ser mayor a 0";
              return true;
            },
          })}
          className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary p-2"
          min={type === "pension" ? 5 : 0}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (type === "pension" && v < 5) {
              setValue("durationYears", 5, { shouldValidate: true });
            }
          }}
        />
        {errors.durationYears && (
          <p className="text-red-400">{errors.durationYears.message}</p>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <label>Privileged wallets (max 4)</label>
          <div className="relative group">
            <div className="h-4 w-4 rounded-sm border border-white/20 bg-white/10 flex items-center justify-center text-[10px] cursor-help">
              i
            </div>
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/20 bg-black/80 px-2 py-1 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100">
              Permissions for Deposit, Investments, and Withdrawal
            </div>
          </div>
          <button type="button" className="ml-auto text-xs rounded-md px-2 py-1 border border-white/20 hover:bg-white/10" onClick={() => setShowCollabModal(true)}>View collaborators</button>
        </div>
        <div className="mt-2">
          <p className="text-[11px] text-white/60">Use "View collaborators" to select up to 4, or type manually</p>
        </div>
        <input
          type="text"
          placeholder="0x..., 0x..., 0x..."
          {...register("privilegedWallets", {
            validate: (v) => {
              if (selectedPriv.length > 0) return true;
              const parts = (v || "").split(/[\s,]+/).filter(Boolean);
              if (parts.length === 0) return "Wallets are required";
              if (parts.length > 4) return "Maximum 4 wallets";
              return true;
            },
          })}
          className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary p-2"
        />
        {errors.privilegedWallets && (
          <p className="text-red-400">{errors.privilegedWallets.message}</p>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <label>Connected wallets (max 4)</label>
          <div className="relative group">
            <div className="h-4 w-4 rounded-sm border border-white/20 bg-white/10 flex items-center justify-center text-[10px] cursor-help">
              i
            </div>
            <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/20 bg-black/80 px-2 py-1 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100">
              They can see the deposit in their accounts
            </div>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-[11px] text-white/60">Use "View collaborators" to select up to 4, or type manually</p>
        </div>
        <input
          type="text"
          placeholder="0x..., 0x..., 0x..."
          {...register("beneficiaryWallets", {
            validate: (v) => {
              if (selectedBen.length > 0) return true;
              const parts = (v || "").split(/[\s,]+/).filter(Boolean);
              if (parts.length === 0) return "Wallets are required";
              if (parts.length > 4) return "Maximum 4 wallets";
              return true;
            },
          })}
          className="mt-1 w-full rounded-md bg-black/30 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary p-2"
        />
        {errors.beneficiaryWallets && (
          <p className="text-red-400">{errors.beneficiaryWallets.message}</p>
        )}
      </div>
      {readsState.error ? (
        <p className="text-red-400">{String(readsState.error)}</p>
      ) : null}
      {errorMsg ? <p className="text-red-400">{errorMsg}</p> : null}
      <button
        type="submit"
        className="w-full h-10 rounded-md bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 font-semibold disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create fund"}
      </button>
      {showCollabModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCollabModal(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 shadow-2xl flex flex-col max-h-[75vh] overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h3 className="text-sm font-bold">Collaborators</h3>
                <button className="rounded-md px-2 py-1 text-xs border border-white/20 hover:bg-white/10" onClick={() => setShowCollabModal(false)}>Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {(!collaborators || collaborators.length === 0) ? (
                  <p className="text-white/70 text-xs">No related collaborators.</p>
                ) : (
                  <ul className="space-y-2">
                    {collaborators.map((addr, idx) => (
                      <li key={`c-${addr}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                          <div>
                            <p className="text-xs font-semibold">{`Collaborator ${idx + 1}`}</p>
                            <p className="text-[11px] text-white/70 break-all">{addr}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" className="text-[11px] rounded-md px-2 py-1 border border-white/20 hover:bg-white/10" onClick={() => {
                            setSelectedPriv((prev) => (prev.includes(addr) ? prev : prev.length < 4 ? [...prev, addr] : prev));
                          }}>Add to permissions</button>
                          <button type="button" className="text-[11px] rounded-md px-2 py-1 border border-white/20 hover:bg-white/10" onClick={() => {
                            setSelectedBen((prev) => (prev.includes(addr) ? prev : prev.length < 4 ? [...prev, addr] : prev));
                          }}>Add to connected</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
