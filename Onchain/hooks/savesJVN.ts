import abi from './abi.json';
import contracts from './contracts.json';
import {
  useNetwork,
  usePrepareContractWrite,
  useContractWrite,
  useContractRead,
} from 'wagmi';

export type HexAddress = `0x${string}`;

type ContractEntry = { chainId: number; address: HexAddress };
type ContractsJson = {
  SavesJVN?: Record<string, ContractEntry>;
};

const parsedContracts = contracts as unknown as ContractsJson;
const entries = parsedContracts.SavesJVN ? Object.values(parsedContracts.SavesJVN) : [];
const ADDRESS_BY_CHAIN: Record<number, HexAddress> = entries.reduce((acc, x) => {
  if (x && typeof x.chainId === 'number' && typeof x.address === 'string') {
    acc[x.chainId] = x.address as HexAddress;
  }
  return acc;
}, {} as Record<number, HexAddress>);

export function getSavesJVNAddress(chainId?: number): HexAddress | undefined {
  if (!chainId) return undefined;
  return ADDRESS_BY_CHAIN[chainId];
}

// Helper para construir arreglos fijos [4] rellenando con la dirección cero
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as HexAddress;
function padFixed4(list?: HexAddress[]): [HexAddress, HexAddress, HexAddress, HexAddress] {
  const out: [HexAddress, HexAddress, HexAddress, HexAddress] = [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS];
  if (Array.isArray(list)) {
    const n = Math.min(4, list.length);
    for (let i = 0; i < n; i++) out[i] = list[i] as HexAddress;
  }
  return out;
}

// Hook para crear fondo con la nueva firma (address[4] para privilegiados y beneficiarios)
export function useCreateFund(params: {
  fundType?: number; // enum SavesJVN.FundType (0 = PensionVoluntaria, 1 = AhorroUniversitario)
  durationSeconds?: number | bigint;
  privileged?: HexAddress[]; // se rellenará a 4 posiciones con ZERO_ADDRESS
  beneficiaries?: HexAddress[]; // se rellenará a 4 posiciones con ZERO_ADDRESS
}) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);

  const fixedPrivileged = padFixed4(params.privileged);
  const fixedBeneficiaries = padFixed4(params.beneficiaries);

  const prepared = usePrepareContractWrite({
    address,
    abi,
    functionName: 'createFund',
    args:
      params.fundType !== undefined && params.durationSeconds !== undefined
        ? [
            Number(params.fundType),
            BigInt(params.durationSeconds),
            fixedPrivileged,
            fixedBeneficiaries,
          ]
        : undefined,
    enabled: Boolean(address && params.fundType !== undefined && params.durationSeconds !== undefined),
  });

  return useContractWrite(prepared.config);
}

export function useReadFund(params: { fundId?: number | bigint }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  return useContractRead({
    address,
    abi,
    functionName: 'getFund',
    args: params.fundId !== undefined ? [BigInt(params.fundId)] : undefined,
    enabled: Boolean(address && params.fundId !== undefined),
  });
}

export function useUserFunds(params: { user?: HexAddress }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  return useContractRead({
    address,
    abi,
    functionName: 'getFundsByUser',
    args: params.user ? [params.user] : undefined,
    enabled: Boolean(address && params.user),
  });
}

export function useIsUserInFund(params: { user?: HexAddress; fundId?: number | bigint }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  return useContractRead({
    address,
    abi,
    functionName: 'isUserInFund',
    args: params.user && params.fundId !== undefined ? [params.user, BigInt(params.fundId)] : undefined,
    enabled: Boolean(address && params.user && params.fundId !== undefined),
  });
}

export function useWithdrawToBeneficiary(params: {
  fundId?: number | bigint;
  amount?: number | bigint;
  to?: HexAddress;
}) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);

  const prepared = usePrepareContractWrite({
    address,
    abi,
    functionName: 'withdrawToBeneficiary',
    args:
      params.fundId !== undefined && params.amount !== undefined && params.to
        ? [BigInt(params.fundId), BigInt(params.amount), params.to]
        : undefined,
    enabled: Boolean(address && params.fundId !== undefined && params.amount !== undefined && params.to),
  });

  const write = useContractWrite(prepared.config);
  return write;
}

export function useSetDappTarget(params: { fundId?: number | bigint; dapp?: HexAddress }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  const prepared = usePrepareContractWrite({
    address,
    abi,
    functionName: 'setDappTarget',
    args: params.fundId !== undefined && params.dapp ? [BigInt(params.fundId), params.dapp] : undefined,
    enabled: Boolean(address && params.fundId !== undefined && params.dapp),
  });
  return useContractWrite(prepared.config);
}

export function useStakeASTR(params: { fundId?: number | bigint; amountU128?: bigint | number }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  const prepared = usePrepareContractWrite({
    address,
    abi,
    functionName: 'stakeASTR',
    args: params.fundId !== undefined && params.amountU128 !== undefined ? [BigInt(params.fundId), BigInt(params.amountU128)] : undefined,
    enabled: Boolean(address && params.fundId !== undefined && params.amountU128 !== undefined),
  });
  return useContractWrite(prepared.config);
}

export function useEndStake(params: { fundId?: number | bigint; amountU128?: bigint | number }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  const prepared = usePrepareContractWrite({
    address,
    abi,
    functionName: 'endStake',
    args: params.fundId !== undefined && params.amountU128 !== undefined ? [BigInt(params.fundId), BigInt(params.amountU128)] : undefined,
    enabled: Boolean(address && params.fundId !== undefined && params.amountU128 !== undefined),
  });
  return useContractWrite(prepared.config);
}

export function useDepositNative(params: { fundId?: number | bigint }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  const prepared = usePrepareContractWrite({
    address,
    abi,
    functionName: 'depositNative',
    args: params.fundId !== undefined ? [BigInt(params.fundId)] : undefined,
    enabled: Boolean(address && params.fundId !== undefined),
  });
  return useContractWrite(prepared.config);
}

export function useDepositToken(params: { fundId?: number | bigint; amount?: number | bigint }) {
  const { chain } = useNetwork();
  const address = getSavesJVNAddress(chain?.id);
  const prepared = usePrepareContractWrite({
    address,
    abi,
    functionName: 'depositToken',
    args: params.fundId !== undefined && params.amount !== undefined ? [BigInt(params.fundId), BigInt(params.amount)] : undefined,
    enabled: Boolean(address && params.fundId !== undefined && params.amount !== undefined),
  });
  return useContractWrite(prepared.config);
}