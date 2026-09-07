'use client'

import {useAccount, useConnect, useDisconnect, useSwitchChain} from 'wagmi'
import {mainnet} from 'wagmi/chains'

export default function WalletButton(){
  const {address,isConnected,chainId}=useAccount()
  const {connect,connectors,isPending,error}=useConnect()
  const {disconnect}=useDisconnect()
  const {switchChain}=useSwitchChain()

  if(isConnected) return <div className="walletArea">
    <div className="walletBadge"><span className="dot"/> {address?.slice(0,6)}…{address?.slice(-4)} · chain {chainId}</div>
    {chainId!==mainnet.id && <button className="secondary" onClick={()=>switchChain({chainId:mainnet.id})}>SWITCH TO ETHEREUM</button>}
    <button className="secondary" onClick={()=>disconnect()}>DISCONNECT</button>
  </div>

  return <div className="walletArea">
    {connectors.map(c=><button className="secondary" key={c.uid} disabled={isPending} onClick={()=>connect({connector:c})}>{isPending?'CONNECTING…':`CONNECT ${c.name.toUpperCase()}`}</button>)}
    {error && <small className="error">{error.message}</small>}
  </div>
}
