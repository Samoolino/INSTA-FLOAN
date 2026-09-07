'use client'

import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {createConfig, http, WagmiProvider} from 'wagmi'
import {mainnet, arbitrum, base, bsc} from 'wagmi/chains'
import {injected, walletConnect, coinbaseWallet} from 'wagmi/connectors'
import {useState} from 'react'

const config = createConfig({
  chains: [mainnet, arbitrum, base, bsc],
  connectors: [
    injected({shimDisconnect: true}),
    coinbaseWallet({appName: 'INSTA-FLOAN'}),
    ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
      ? [walletConnect({projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, showQrModal: true})]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
  },
})

export default function Providers({children}:{children:React.ReactNode}) {
  const [queryClient] = useState(() => new QueryClient())
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></WagmiProvider>
}
