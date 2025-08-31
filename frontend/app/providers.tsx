'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import type { Chain } from 'wagmi/chains'

const localhost31337: Chain = {
  id: 31337,
  name: 'Hardhat',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local Explorer', url: 'http://localhost:8545' },
  },
}

const chains = [baseSepolia, localhost31337] satisfies [Chain, ...Chain[]]

const config = createConfig({
  chains,
  transports: {
    [baseSepolia.id]: http(),
    [localhost31337.id]: http('http://127.0.0.1:8545'),
  },
  connectors: [
    injected({ target: 'metaMask' }),
  ],
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact" coolMode>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
