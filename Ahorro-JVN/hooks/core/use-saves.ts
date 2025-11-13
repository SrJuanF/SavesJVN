"use client";

import contracts from "../contracts/contracts.json";
import { useAuth } from "@/hooks";
import { useEffect, useMemo, useState } from "react";
import { useNextFundId, usePenaltyDuration, useTokenAddress, useUserFunds, useSavesJVNWrites, useReadFund } from "../contracts/savesJVN";
import type { Address } from "viem";

// Acceso simple al address por chainId sin validaciones
type ContractsByChain = Record<number, { address: Address }>;
const CONTRACTS = contracts as unknown as ContractsByChain;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const MAX_USER_FUNDS = 20;

export function useSaves(){
    const { chainId, userAddress } = useAuth();
    const addressContract = CONTRACTS[chainId]?.address || null;

    // Derivar direcciones seguras para hooks
    const isValidAddress = (addr?: Address | null): boolean => !!addr && addr !== ZERO_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(addr);
    const contractEnabled = isValidAddress(addressContract);
    const userEnabled = isValidAddress(userAddress as `0x${string}`);

    const contractAddr: Address = (addressContract ?? ZERO_ADDRESS) as Address;
    const userAddr: Address = (userAddress ?? ZERO_ADDRESS) as Address;

    // Hooks de lectura del contrato
    const nextFundIdQuery = useNextFundId(contractAddr, contractEnabled);
    const penaltyDurationQuery = usePenaltyDuration(contractAddr, contractEnabled);
    const tokenAddressQuery = useTokenAddress(contractAddr, contractEnabled);

    const userFundsQuery = useUserFunds(contractAddr, userAddr, contractEnabled && userEnabled);

    const nextFundIdReady = Boolean(contractEnabled && !nextFundIdQuery?.isPending && nextFundIdQuery?.data !== undefined);
    const penaltyDurationReady = Boolean(contractEnabled && !penaltyDurationQuery?.isPending && penaltyDurationQuery?.data !== undefined);
    const tokenAddressReady = Boolean(contractEnabled && !tokenAddressQuery?.isPending && tokenAddressQuery?.data !== undefined);
    const userFundsReady = Boolean(contractEnabled && userEnabled && !userFundsQuery?.isPending && Array.isArray(userFundsQuery?.data));

    // Siempre llamar el mismo número de hooks (Reglas de Hooks)
    const [detailsEnabled, setDetailsEnabled] = useState(false);
    useEffect(() => {
      setDetailsEnabled(Boolean(userFundsReady));
    }, [userFundsReady]);

    const userFundIds: bigint[] = userFundsReady ? ((userFundsQuery?.data as bigint[]) ?? []) : [];
    const fixedIds = Array.from({ length: MAX_USER_FUNDS }, (_, i) => userFundIds[i] ?? 0n);
    const userFundsDetailsAll = fixedIds.map((id, i) =>
      useReadFund(contractAddr, id, detailsEnabled && i < userFundIds.length)
    );
    const userFundsDetails = userFundsDetailsAll.slice(0, userFundIds.length);
    const userFundsDetailsData = userFundsDetails
      .map((q) => {
        const d = (q?.data as any);
        if (!d) return undefined;
        if (Array.isArray(d)) {
          const fundType = Number(d[0]);
          const owner = String(d[1]);
          const startTime = typeof d[2] === "bigint" ? d[2] : BigInt(d[2] ?? 0);
          const endTime = typeof d[3] === "bigint" ? d[3] : BigInt(d[3] ?? 0);
          const privileged = padFixed4(d[4]);
          const beneficiaries = padFixed4(d[5]);
          const balance = typeof d[6] === "bigint" ? d[6] : BigInt(d[6] ?? 0);
          const stakedBalance = typeof d[7] === "bigint" ? d[7] : BigInt(d[7] ?? 0);
          const active = Boolean(d[8]);
          const balanceStr = formatAmount5(balance);
          const stakedBalanceStr = formatAmount5(stakedBalance);
          return { fundType, owner, startTime, endTime, privileged, beneficiaries, balance, stakedBalance, active, balanceStr, stakedBalanceStr };
        }
        return d;
      })
      .filter((v) => v !== undefined);

    // Efecto adicional: al cambiar chainId, userAddress o los ids de fondos, obtener detalles y mostrarlos en consola
    useEffect(() => {
      if (!contractEnabled) return;
      if (!userFundsQuery?.data || userFundsQuery?.data.length === 0) return;
      // Imprimir detalles disponibles para los ids actuales
      if (userFundsDetailsData && userFundsDetailsData.length > 0) {
        console.log("Detalles de fondos del usuario", { chainId, userAddress, fundIds: userFundsQuery?.data, details: userFundsDetailsData });
      }
    }, [contractEnabled, chainId, userAddress, userFundsQuery?.data, userFundsDetailsData]);

    // Estado de lecturas agregado por core
    const [readsState, setReadsState] = useState<{ isLoading: boolean; error: unknown | null }>({ isLoading: true, error: null });

    // Efecto: cuando cambian chainId o userAddress, monitorear estados de lectura
    useEffect(() => {
      if (!contractEnabled) {
        setReadsState({ isLoading: false, error: "Dirección de contrato inválida para el chainId actual" });
        return;
      }
      const loading = Boolean(
        nextFundIdQuery?.isPending ||
        penaltyDurationQuery?.isPending ||
        tokenAddressQuery?.isPending ||
        userFundsQuery?.isPending
      );
      const error =
        nextFundIdQuery?.error ||
        penaltyDurationQuery?.error ||
        tokenAddressQuery?.error ||
        userFundsQuery?.error ||
        null;
      setReadsState({ isLoading: loading, error });
    }, [addressContract, chainId, userAddress, nextFundIdQuery?.isPending, penaltyDurationQuery?.isPending, tokenAddressQuery?.isPending, userFundsQuery?.isPending, nextFundIdQuery?.error, penaltyDurationQuery?.error, tokenAddressQuery?.error, userFundsQuery?.error]);

    // Hook de escritura del contrato
    const writes = useSavesJVNWrites(contractAddr);

    // Wrappers de escritura con validaciones del core
    const createFund = async (params: { fundType: number; durationSeconds: bigint | number; privilegedWallets: string[]; beneficiaryWallets: string[]; }) => {
      if (!contractEnabled) throw new Error("Contrato no disponible o inválido en el chain actual");
      ensureFundType(params.fundType);
      ensureAddressArray4(params.privilegedWallets);
      ensureAddressArray4(params.beneficiaryWallets);
      return writes.createFund({
        fundType: Number(params.fundType),
        durationSeconds: toBigInt(params.durationSeconds),
        privilegedWallets: padFixed4(params.privilegedWallets) as [Address, Address, Address, Address],
        beneficiaryWallets: padFixed4(params.beneficiaryWallets) as [Address, Address, Address, Address],
      });
    };

    const depositToken = async (fundId: bigint | number, amount: bigint | number) => {
      if (!contractEnabled) throw new Error("Contrato no disponible o inválido en el chain actual");
      return writes.depositToken(toBigInt(fundId), toBigInt(amount));
    };

    const depositNative = async (fundId: bigint | number, value?: bigint | number) => {
      if (!contractEnabled) throw new Error("Contrato no disponible o inválido en el chain actual");
      return writes.depositNative(toBigInt(fundId), value !== undefined ? toBigInt(value) : undefined);
    };

    const stakeASTR = async (fundId: bigint | number, amount: bigint | number) => {
      if (!contractEnabled) throw new Error("Contrato no disponible o inválido en el chain actual");
      return writes.stakeASTR(toBigInt(fundId), toBigInt(amount));
    };

    const endStake = async (fundId: bigint | number, amount: bigint | number) => {
      if (!contractEnabled) throw new Error("Contrato no disponible o inválido en el chain actual");
      return writes.endStake(toBigInt(fundId), toBigInt(amount));
    };

    const withdrawToBeneficiary = async (fundId: bigint | number, amount: bigint | number, to: Address) => {
      if (!contractEnabled) throw new Error("Contrato no disponible o inválido en el chain actual");
      return writes.withdrawToBeneficiary(toBigInt(fundId), toBigInt(amount), to);
    };

    const setDappTarget = async (fundId: bigint | number, dapp: Address) => {
      if (!contractEnabled) throw new Error("Contrato no disponible o inválido en el chain actual");
      return writes.setDappTarget(toBigInt(fundId), dapp);
    };

    return {
      chainId,
      addressContract,
      // Lecturas (datos y estado)
      nextFundId: nextFundIdReady ? (nextFundIdQuery?.data as bigint) : undefined,
      penaltyDuration: penaltyDurationReady ? (penaltyDurationQuery?.data as bigint) : undefined,
      tokenAddress: tokenAddressReady ? (tokenAddressQuery?.data as Address) : undefined,
      userFunds: userFundsReady ? (userFundsQuery?.data as unknown) : undefined,
      userFundsDetailsData: userFundsDetailsData,
      totalBalance: userFundsDetailsData.reduce((acc, v: any) => acc + (v?.balance ?? 0n), 0n),
      totalBalanceStr: formatAmount5(userFundsDetailsData.reduce((acc, v: any) => acc + (v?.balance ?? 0n), 0n)),
      readsState,
      // Escrituras (con validaciones previas)
      createFund,
      depositToken,
      depositNative,
      stakeASTR,
      endStake,
      withdrawToBeneficiary,
      setDappTarget,
    };
}

function padFixed4(list?: (Address | string)[]): [Address, Address, Address, Address] {
  const out: [Address, Address, Address, Address] = [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS];
  if (Array.isArray(list)) {
    const n = Math.min(4, list.length);
    for (let i = 0; i < n; i++) out[i] = list[i] as Address;
  }
  return out;
}

// Validaciones mínimas solicitadas
function ensureAddressArray4(list: string[]) {
  if (!Array.isArray(list) || list.length !== 4) {
    throw new Error("Se requieren exactamente 4 direcciones formateadas en el arreglo");
  }
  const re = /^0x[a-fA-F0-9]{40}$/;
  list.forEach((addr) => {
    if (!re.test(addr)) throw new Error(`Dirección inválida: ${addr}`);
  });
}

function ensureFundType(ft: number) {
  if (ft !== 0 && ft !== 1) throw new Error("fundType debe ser 0 (Pensión) o 1 (Universitario)");
}

function toBigInt(value: bigint | number): bigint {
  const b = typeof value === "bigint" ? value : BigInt(value);
  if (b < 0n) throw new Error("El valor no puede ser negativo");
  return b;
}

function formatAmount5(v: bigint, decimals: number = 18): string {
  const neg = v < 0n;
  const ab = neg ? -v : v;
  const s = ab.toString().padStart(decimals + 1, "0");
  const intPart = s.slice(0, -decimals);
  const fracPart = s.slice(-decimals);
  const d = fracPart.slice(0, 5);
  const out = Number(d) === 0 ? intPart : `${intPart}.${d}`;
  return neg ? `-${out}` : out;
}