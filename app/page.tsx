'use client'

import {useState} from 'react'
import {useAccount} from 'wagmi'
import {strategies} from '../lib/strategies'
import WalletButton from '../components/WalletButton'

export default function Home(){
 const [status,setStatus]=useState('READY')
 const [target,setTarget]=useState(100)
 const {isConnected}=useAccount()
 async function scan(){
   setStatus('SCANNING')
   try{
     const r=await fetch(`/api/scan?target=${target}`)
     const j=await r.json()
     setStatus(j.targetReached?'TARGET REACHED':'NO EXECUTABLE PATH')
   }catch{setStatus('SCAN ERROR')}
 }
 return <main>
   <header><div><b>INSTA-FLOAN</b><span> · CONTROL PLANE</span></div><WalletButton/></header>
   <section className="hero">
     <small>INSTADAPP-ORIENTED FLASH-LOAN ARBITRAGE</small>
     <h1>Liquidity discovery, route simulation and target-controlled execution.</h1>
     <p>Designed as a front-end-first control surface for multi-wallet EVM access, opportunity scanning and eventually atomic Instadapp execution. The current execution mode is simulation-only.</p>
     <div className="actions">
       <label>TARGET PROFIT <input type="number" min="1" value={target} onChange={e=>setTarget(Number(e.target.value)||1)}/></label>
       <button className="primary" onClick={scan}>SCAN TO TARGET</button>
     </div>
   </section>
   <section className="stats">
     <div>WALLET<strong>{isConnected?'CONNECTED':'NOT CONNECTED'}</strong></div>
     <div>STRATEGIES<strong>{strategies.length}</strong></div>
     <div>TARGET<strong>${target}</strong></div>
     <div>ENGINE<strong>{status}</strong></div>
   </section>
   <section className="grid">
    <div className="panel"><h2>Liquidity strategy matrix</h2>{strategies.map(s=><div className="row" key={s.id}><b>{s.name}</b><span>{s.mode}</span><span>{s.chains}</span><em>{s.guard}</em></div>)}</div>
    <aside className="panel"><h2>Execution gates</h2><div className="gate">01 · Wallet authorization</div><div className="gate">02 · Chain & contract validation</div><div className="gate">03 · Liquidity + quote freshness</div><div className="gate">04 · Full-route simulation</div><div className="gate">05 · Net-profit safety reserve</div><div className="gate">06 · Atomic transaction approval</div><p className="muted">Any failed gate blocks execution.</p></aside>
   </section>
   <section className="panel"><h2>Target-attainment engine</h2><div className="flow"><span>TARGET</span><i>→</i><span>DISCOVER</span><i>→</i><span>QUOTE</span><i>→</i><span>SIMULATE</span><i>→</i><span>RISK GATE</span><i>→</i><span>AUTHORIZE</span><i>→</i><span>EXECUTE</span><i>→</i><span>VERIFY PNL</span></div><p className="muted">The engine may continue across independently profitable opportunities until the configured target is reached. It never accepts a losing trade simply to recover an earlier loss.</p></section>
   <footer>SIMULATION-FIRST · WALLETCONNECT OR MEMORY-ONLY PRIVATE-KEY IMPORT · NO SEED PHRASES · LIVE EXECUTION DISABLED</footer>
 </main>
}
