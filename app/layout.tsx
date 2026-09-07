import './globals.css'
import type {Metadata} from 'next'
import Providers from './providers'

export const metadata:Metadata={title:'INSTA-FLOAN | DeFi Arbitrage Control Plane',description:'Instadapp-oriented flash-loan arbitrage control plane'}

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><Providers>{children}</Providers></body></html>
}
