import abi from './abi.json';
import { useReadContract, useWriteContract } from 'wagmi';
import type { Address, Hex } from 'viem';


// Enum de tipos de fondo (según contrato)
// Interfaces: mantener solo los mínimos necesarios
export interface CreateFundParams {
  fundType: number; // 0 o 1 (ya validado en core)
  durationSeconds: bigint; // ya convertido/validado en core
  privilegedWallets: [Address, Address, Address, Address]; // ya validado/formateado en core
  beneficiaryWallets: [Address, Address, Address, Address]; // ya validado/formateado en core
}

// (Las demás interfaces de parámetros se eliminan; validación se hará dentro de las funciones)

// Tipo de retorno para getFund
export interface FundStruct {
  fundType: number;
  owner: Address;
  startTime: bigint;
  endTime: bigint;
  privileged: [Address, Address, Address, Address];
  beneficiaries: [Address, Address, Address, Address];
  balance: bigint;
  stakedBalance: bigint;
  active: boolean;
}

// Las validaciones y conversiones se realizan en el core antes de invocar estos hooks

// Hooks de lectura (useReadContract)
export const useReadFund = (address: Address, fundId: bigint | number, enabled: boolean = true) => {
  const id = typeof fundId === 'bigint' ? fundId : BigInt(fundId);
  return useReadContract({
    address,
    abi,
    functionName: 'getFund',
    args: [id],
    query: { enabled },
  }) as { data: FundStruct | undefined } & ReturnType<typeof useReadContract>;
};

export const useUserFunds = (address: Address, user: Address, enabled: boolean = true) => {
  return useReadContract({ address, abi, functionName: 'getFundsByUser', args: [user], query: { enabled } }) as {
    data: bigint[] | undefined;
  } & ReturnType<typeof useReadContract>;
};

export const useIsUserInFund = (address: Address, user: Address, fundId: bigint | number, enabled: boolean = true) => {
  const id = typeof fundId === 'bigint' ? fundId : BigInt(fundId);
  return useReadContract({ address, abi, functionName: 'isUserInFund', args: [user, id], query: { enabled } }) as {
    data: boolean | undefined;
  } & ReturnType<typeof useReadContract>;
};

export const useNextFundId = (address: Address, enabled: boolean = true) => {
  return useReadContract({ address, abi, functionName: 'nextFundId', query: { enabled } }) as {
    data: bigint | undefined;
  } & ReturnType<typeof useReadContract>;
};

export const usePenaltyDuration = (address: Address, enabled: boolean = true) => {
  return useReadContract({ address, abi, functionName: 'penaltyDuration', query: { enabled } }) as {
    data: bigint | undefined;
  } & ReturnType<typeof useReadContract>;
};

export const useTokenAddress = (address: Address, enabled: boolean = true) => {
  return useReadContract({ address, abi, functionName: 'token', query: { enabled } }) as {
    data: Address | undefined;
  } & ReturnType<typeof useReadContract>;
};

// Hook de escritura único (useWriteContract) que expone métodos del contrato
export const useSavesJVNWrites = (address: Address) => {
  const { writeContractAsync, data, isPending, error } = useWriteContract();

  return {
    data,
    isPending,
    error,
    createFund: async (params: CreateFundParams): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi,
        functionName: 'createFund',
        args: [
          Number(params.fundType),
          params.durationSeconds,
          params.privilegedWallets,
          params.beneficiaryWallets,
        ],
      });
    },
    depositToken: async (fundId: bigint, amount: bigint): Promise<Hex> => {
      return writeContractAsync({ address, abi, functionName: 'depositToken', args: [fundId, amount] });
    },
    depositNative: async (fundId: bigint, value?: bigint): Promise<Hex> => {
      return writeContractAsync({
        address,
        abi,
        functionName: 'depositNative',
        args: [fundId],
        value,
      });
    },
    stakeASTR: async (fundId: bigint, amount: bigint): Promise<Hex> => {
      return writeContractAsync({ address, abi, functionName: 'stakeASTR', args: [fundId, amount] });
    },
    endStake: async (fundId: bigint, amount: bigint): Promise<Hex> => {
      return writeContractAsync({ address, abi, functionName: 'endStake', args: [fundId, amount] });
    },
    withdrawToBeneficiary: async (fundId: bigint, amount: bigint, to: Address): Promise<Hex> => {
      return writeContractAsync({ address, abi, functionName: 'withdrawToBeneficiary', args: [fundId, amount, to] });
    },
    setDappTarget: async (fundId: bigint, dapp: Address): Promise<Hex> => {
      return writeContractAsync({ address, abi, functionName: 'setDappTarget', args: [fundId, dapp] });
    },
  };
};

export const useERC20Writes = (tokenAddress: Address) => {
  const { writeContractAsync } = useWriteContract();
  return {
    approve: async (spender: Address, amount: bigint): Promise<Hex> => {
      return writeContractAsync({ address: tokenAddress, abi: ERC20_ABI as any, functionName: 'approve', args: [spender, amount] });
    },
  };
};
export const useERC20Allowance = (tokenAddress: Address, owner: Address, spender: Address, enabled: boolean = true) => {
  return useReadContract({ address: tokenAddress, abi: ERC20_ABI as any, functionName: 'allowance', args: [owner, spender], query: { enabled } }) as {
    data: bigint | undefined;
  } & ReturnType<typeof useReadContract>;
};
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;