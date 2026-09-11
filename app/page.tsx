'use client'

import {useState} from 'react'
import {useAccount} from 'wagmi'
import {strategies} from '../lib/strategies'
import WalletButton from '../components/WalletButton'

type Opportunity = {id?:string; venue?:string; chainId?:number; tokenIn?:string; tokenOut?:string; netProfitUsd?:number}
type Assurance = {status:string; grade:string; flashLiquiditySources:number; fundedAssets:number; configuredQuoteRoutes:number; freshQuotes:number; profitablePaths:number; coverageRatio:number; quoteFreshnessRatio:number; venueCount:number; chainCount:number; expandable:boolean; nextActions:string[]; message:string}
type Graph = {routeCount:number; freshRouteCount:number; liquidityCoveredRouteCount:number}

export default function Home(){
 const [status,setStatus]=useState('READY')
 const [target,setTarget]=useState(100)
 const [opportunities,setOpportunities]=useState<Opportunity[]>([])
 const [assurance,setAssurance]=useState<Assurance|null>(null)
 const [graph,setGraph]=useState<Graph|null>(null)
 const [scanMessage,setScanMessage]=useState('No live scan performed yet.')
 const [scanning,setScanning]=useState(false)
 const {isConnected}=useAccount()

 async function scan(){
   setScanning(true); setStatus('SCANNING'); setScanMessage('Rotating verified liquidity × token × venue routes…')
   try{
     const r=await fetch(`/api/scan?target=${target}`,{cache:'no-store'}); const j=await r.json()
     setOpportunities(Array.isArray(j.selected)?j.selected:[]); setAssurance(j.assurance||null); setGraph(j.routeGraph||null)
     setScanMessage(j.adapterError||j.liquidityError||j.message||'Scan completed.')
     setStatus(j.targetReached?'TARGET REACHED':j.opportunityCount>0?'OPPORTUNITIES FOUND':j.assurance?.status||'WAITING FOR OPPORTUNITY')
   }catch{setOpportunities([]);setAssurance(null);setGraph(null);setScanMessage('SCAN ERROR: live quote service unavailable.');setStatus('SCAN ERROR')}
   finally{setScanning(false)}
 }

 return <main>
   <header><div><b>INSTA-FLOAN</b><span> · CONTROL PLANE</span></div><WalletButton/></header>
   <section className="hero"><small>INSTADAPP-ORIENTED FLASH-LOAN ARBITRAGE</small><h1>Adaptive liquidity discovery, route coverage and target-controlled execution.</h1><p>Opportunity assurance measures coverage and freshness continuously; it never promises that profitable markets exist. No scan submits a transaction.</p><div className="actions"><label>TARGET PROFIT <input type="number" min="1" value={target} onChange={e=>setTarget(Number(e.target.value)||1)}/></label><button className="primary" onClick={scan} disabled={scanning}>{scanning?'SCANNING…':'SCAN TO TARGET'}</button></div><div className="walletModes"><span>WALLET CONNECT</span><i>or</i><span>PRIVATE KEY · MEMORY ONLY</span></div></section>
   <section className="stats"><div>WALLET<strong>{isConnected?'CONNECTED':'NOT CONNECTED'}</strong></div><div>STRATEGIES<strong>{strategies.length}</strong></div><div>TARGET<strong>${target}</strong></div><div>ENGINE<strong>{status}</strong></div></section>
   <section className="panel"><h2>Opportunity assurance quality</h2><p className="muted">{assurance?.message||'Run a scan to measure live opportunity coverage.'}</p><div className="stats"><div>ASSURANCE GRADE<strong>{assurance?.grade||'—'}</strong></div><div>COVERAGE<strong>{assurance?`${(assurance.coverageRatio*100).toFixed(0)}%`:'—'}</strong></div><div>QUOTE FRESHNESS<strong>{assurance?`${(assurance.quoteFreshnessRatio*100).toFixed(0)}%`:'—'}</strong></div><div>PROFITABLE PATHS<strong>{assurance?.profitablePaths??'—'}</strong></div></div><div className="stats"><div>LIQUIDITY ASSETS<strong>{assurance?.fundedAssets??'—'}</strong></div><div>FRESH QUOTES<strong>{assurance?.freshQuotes??'—'}</strong></div><div>VENUES<strong>{assurance?.venueCount??'—'}</strong></div><div>CHAINS<strong>{assurance?.chainCount??'—'}</strong></div></div>{graph&&<p className="muted">Route graph: {graph.routeCount} routes · {graph.freshRouteCount} fresh · {graph.liquidityCoveredRouteCount} liquidity-covered · {assurance?.expandable?'EXPANSION READY':'BLOCKED'}</p>}{assurance?.nextActions?.length ? <div className="muted"><b>Next assurance actions:</b> {assurance.nextActions.join(' · ')}</div>:null}</section>
   <section className="panel"><h2>Live opportunity monitor</h2><p className="muted">{scanMessage}</p>{opportunities.length===0?<div className="empty">Current executable opportunities: <b>0</b></div>:opportunities.map((o,i)=><div className="row" key={o.id||i}><b>{o.venue||'Configured venue'}</b><span>Chain {o.chainId}</span><span>{o.tokenIn?.slice(0,8)}… → {o.tokenOut?.slice(0,8)}…</span><strong>NET ${Number(o.netProfitUsd||0).toFixed(2)}</strong><button onClick={()=>setStatus('SIMULATION REQUIRED')}>SIMULATE</button></div>)}</section>
   <section className="grid"><div className="panel"><h2>Liquidity strategy matrix</h2>{strategies.map(s=><div className="row" key={s.id}><b>{s.name}</b><span>{s.mode}</span><span>{s.chains}</span><em>{s.guard}</em></div>)}</div><aside className="panel"><h2>Execution gates</h2><div className="gate">01 · Wallet authorization</div><div className="gate">02 · Chain & contract validation</div><div className="gate">03 · Liquidity + quote freshness</div><div className="gate">04 · Full-route simulation</div><div className="gate">05 · Net-profit safety reserve</div><div className="gate">06 · Atomic transaction approval</div><p className="muted">Any failed gate blocks execution.</p></aside></section>
   <section className="panel"><h2>Target-attainment controls</h2><div className="flow"><span>TARGET</span><i>→</i><span>DISCOVER</span><i>→</i><span>ROTATE</span><i>→</i><span>QUOTE</span><i>→</i><span>SIMULATE</span><i>→</i><span>RISK GATE</span><i>→</i><span>AUTHORIZE</span><i>→</i><span>EXECUTE</span><i>→</i><span>VERIFY PNL</span></div><div className="actions"><button onClick={scan} disabled={scanning}>{scanning?'SCANNING…':'SCAN'}</button><button disabled>ARM EXECUTION · GATED</button><button disabled>START TARGET · GATED</button><button disabled>STOP / KILL SWITCH</button></div><p className="muted">No profitable path means WAITING FOR OPPORTUNITY; the engine never forces a trade to reach the target. Real execution remains gated behind controlled-fork validation and explicit production authorization.</p></section>
   <footer>WALLETCONNECT · MEMORY-ONLY PRIVATE-KEY IMPORT · NO SEED PHRASES · LIVE QUOTES READ-ONLY · REAL EXECUTION OFF</footer>
 </main>
}
