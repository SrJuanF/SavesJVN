'use client';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {defineChain, http} from 'viem';
import {celo, celoSepolia, astar} from 'viem/chains';
import type {PrivyClientConfig} from '@privy-io/react-auth';
import {PrivyProvider} from '@privy-io/react-auth';
import {WagmiProvider, createConfig} from '@privy-io/wagmi';
import { injected } from "wagmi/connectors";


export const astarShibuya = defineChain({
  id: 81, // Replace this with your chain's ID
  name: 'Shibuya',
  //network: 'my-custom-chain',
  nativeCurrency: {
    decimals: 18, // Replace this with the number of decimals for your chain's native token
    name: 'SBY',
    symbol: 'SBY'
  },
  rpcUrls: {
    default: {
      http: ['https://evm.shibuya.astar.network'],
      //webSocket: ['wss://my-custom-chain-websocket-rpc']
    }
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://shibuya.subscan.io'}
  }
});

// Configure the chains you want to support
export const chains = [celo, astar, astarShibuya, celoSepolia] as const;
// Create wagmi config with Privy integration
export const wagmiConfig = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [celo.id]: http(),
    [astar.id]: http(),
    [astarShibuya.id]: http(),
    [celoSepolia.id]: http(),
  },
  //ssr: true, // Enable SSR support
});

const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
    requireUserPasswordOnCreate: true,
    noPromptOnSignature: false,
  },
  loginMethods: ['wallet', 'email', 'sms'],
  appearance: {
    showWalletLoginFirst: true,
  },
  defaultChain: celo,
  supportedChains: [celo, astar, astarShibuya, celoSepolia],
};

const queryClient = new QueryClient();

export default function Web3Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      apiUrl={process.env.NEXT_PUBLIC_PRIVY_AUTH_URL as string}
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={privyConfig}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
