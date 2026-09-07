'use client'

import {useState} from 'react'
import {privateKeyToAccount} from 'viem/accounts'
import {useAccount, useConnect, useDisconnect, useSwitchChain} from 'wagmi'
import {mainnet} from 'wagmi/chains'

function normalizeKey(value:string){
  const key=value.trim()
  return key.startsWith('0x') ? key as `0x${string}` : `0x${key}` as `0x${string}`
}

export default function WalletButton(){
  const {address,isConnected,chainId}=useAccount()
  const {connect,connectors,isPending,error}=useConnect()
  const {disconnect}=useDisconnect()
  const {switchChain}=useSwitchChain()
  const [showImport,setShowImport]=useState(false)
  const [privateKey,setPrivateKey]=useState('')
  const [importedAddress,setImportedAddress]=useState<string>()
  const [importError,setImportError]=useState('')

  function importKey(){
    setImportError('')
    try{
      const key=normalizeKey(privateKey)
      if(!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error('Enter a 32-byte hexadecimal private key.')
      const account=privateKeyToAccount(key)
      setImportedAddress(account.address)
      setPrivateKey('')
      setShowImport(false)
    }catch(e){setImportError(e instanceof Error?e.message:'Invalid private key.')}
  }

  if(isConnected) return <div className="walletArea">
    <div className="walletBadge"><span className="dot"/> {address?.slice(0,6)}…{address?.slice(-4)} · chain {chainId}</div>
    {chainId!==mainnet.id && <button className="secondary" onClick={()=>switchChain({chainId:mainnet.id})}>SWITCH TO ETHEREUM</button>}
    <button className="secondary" onClick={()=>disconnect()}>DISCONNECT</button>
  </div>

  if(importedAddress) return <div className="walletArea">
    <div className="walletBadge"><span className="dot"/> LOCAL KEY · {importedAddress.slice(0,6)}…{importedAddress.slice(-4)}</div>
    <small className="muted">Local signer preview only. The key is memory-only, never persisted or sent to the server, and cannot enable live execution from this UI.</small>
    <button className="secondary" onClick={()=>setImportedAddress(undefined)}>REMOVE KEY</button>
  </div>

  return <div className="walletArea">
    {connectors.map(c=><button className="secondary" key={c.uid} disabled={isPending} onClick={()=>connect({connector:c})}>{isPending?'CONNECTING…':`CONNECT ${c.name.toUpperCase()}`}</button>)}
    <button className="secondary" onClick={()=>setShowImport(v=>!v)}>IMPORT PRIVATE KEY · ADVANCED</button>
    {showImport && <div className="walletImport">
      <input aria-label="Private key" type="password" autoComplete="off" spellCheck={false} placeholder="0x… 32-byte private key" value={privateKey} onChange={e=>setPrivateKey(e.target.value)}/>
      <button className="primary" onClick={importKey}>IMPORT IN MEMORY</button>
      <small className="muted">Advanced local-only signer preview. Never paste a seed phrase. The key is not stored in localStorage, cookies, GitHub, or the API. Live transaction signing is not enabled by this control.</small>
      {importError && <small className="error">{importError}</small>}
    </div>}
    {error && <small className="error">{error.message}</small>}
  </div>
}
