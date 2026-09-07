import './globals.css'
import type {Metadata} from 'next'
export const metadata:Metadata={title:'INSTA-FLOAN',description:'Instadapp flash-loan arbitrage control plane'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
