'use client'

import {useState} from 'react'
import {useAccount} from 'wagmi'
import {strategies} from '../lib/strategies'
import WalletButton from '../components/WalletButton'

type Opportunity = {
  id?: string
  venue?: string
  chainId?: number
  tokenIn?: string
  tokenOut?: string
  amountInUsd?: number
  amountOutUsd?: number
  netProfitUsd?: number
  gasUsd?: number
  slippageUsd?: number
  timestamp?: number
}

export default function Home(){
 const [status,setStatus]=useState('READY')
 const [target,setTarget]=useState(100)
 const [opportunities,setOpportunities]=useState<Opportunity[]>([])
 const [scanMessage,setScanMessage]=useState('No live scan performed yet.')
 const [scanning,setScanning]=useState(false)
 const {isConnected}=useAccount()

 async function scan(){
   setScanning(true)
   setStatus('SCANNING')
   setScanMessage('Reading configured on-chain routers…')
   try{
     const r=await fetch(`/api/scan?target=${target}`,{cache:'no-store'})
     const j=await r.json()
     setOpportunities(Array.isArray(j.selected)?j.selected:[])
     setScanMessage(j.adapterError || j.message || 'Scan completed.')
     setStatus(j.targetReached?'TARGET REACHED':j.opportunityCount>0?'OPPORTUNITIES FOUND':'NO EXECUTABLE PATH')
   }catch{
     setOpportunities([])
     setScanMessage('SCAN ERROR: live quote service unavailable.')
     setStatus('SCAN ERROR')
   }finally{setScanning(false)}
 }

 return <main>
   <header><div><b>INSTA-FLOAN</b><span> · CONTROL PLANE</span></div><WalletButton/></header>
   <section className="hero">
     <small>INSTADAPP-ORIENTED FLASH-LOAN ARBITRAGE</small>
     <h1>Liquidity discovery, route simulation and target-controlled execution.</h1>
     <p>Live quotes are read only from explicitly configured on-chain routers. Scanning never submits a transaction.</p>
     <div className="actions">
       <label>TARGET PROFIT <input type="number" min="1" value={target} onChange={e=>setTarget(Number(e.target.value)||1)}/></label>
       <button className="primary" onClick={scan} disabled={scanning}>{scanning?'SCANNING…':'SCAN TO TARGET'}</button>
     </div>
     <div className="walletModes" aria-label="Wallet connection modes">
       <span>WALLET CONNECT</span><i>or</i><span>PRIVATE KEY · MEMORY ONLY</span>
     </div>
   </section>
   <section className="stats">
     <div>WALLET<strong>{isConnected?'CONNECTED':'NOT CONNECTED'}</strong></div>
     <div>STRATEGIES<strong>{strategies.length}</strong></div>
     <div>TARGET<strong>${target}</strong></div>
     <div>ENGINE<strong>{status}</strong></div>
   </section>
   <section className="panel">
     <h2>Live opportunity monitor</h2>
     <p className="muted">{scanMessage}</p>
     {opportunities.length===0 ? <div className="empty">Current live opportunities: <b>0</b></div> : opportunities.map((o,i)=><div className="row" key={o.id||i}>
       <b>{o.venue||'Configured venue'}</b><span>Chain {o.chainId}</span><span>{o.tokenIn?.slice(0,8)}… → {o.tokenOut?.slice(0,8)}…</span><strong>NET ${Number(o.netProfitUsd||0).toFixed(2)}</strong>
       <button onClick={()=>setStatus('SIMULATION REQUIRED')}>SIMULATE</button>
     </div>)}
   </section>
   <section className="grid">
    <div className="panel"><h2>Liquidity strategy matrix</h2>{strategies.map(s=><div className="row" key={s.id}><b>{s.name}</b><span>{s.mode}</span><span>{s.chains}</span><em>{s.guard}</em></div>)}</div>
    <aside className="panel"><h2>Execution gates</h2><div className="gate">01 · Wallet authorization</div><div className="gate">02 · Chain & contract validation</div><div className="gate">03 · Liquidity + quote freshness</div><div className="gate">04 · Full-route simulation</div><div className="gate">05 · Net-profit safety reserve</div><div className="gate">06 · Atomic transaction approval</div><p className="muted">Any failed gate blocks execution.</p></aside>
   </section>
   <section className="panel"><h2>Target-attainment controls</h2><div className="flow"><span>TARGET</span><i>→</i><span>DISCOVER</span><i>→</i><span>QUOTE</span><i>→</i><span>SIMULATE</span><i>→</i><span>RISK GATE</span><i>→</i><span>AUTHORIZE</span><i>→</i><span>EXECUTE</span><i>→</i><span>VERIFY PNL</span></div><div className="actions"><button onClick={scan} disabled={scanning}>{scanning?'SCANNING…':'SCAN'}</button><button disabled>ARM EXECUTION · GATED</button><button disabled>START TARGET · GATED</button><button disabled>STOP / KILL SWITCH</button></div><p className="muted">START TARGET remains disabled until controlled-fork validation, route simulation, risk/profitability checks and explicit production authorization pass.</p></section>
   <footer>WALLETCONNECT · MEMORY-ONLY PRIVATE-KEY IMPORT · NO SEED PHRASES · LIVE QUOTES ARE READ-ONLY · LIVE EXECUTION REQUIRES EXPLICIT PRODUCTION ENABLEMENT</footer>
 </main>
}
