'use client'

import {useState} from 'react'
import {useAccount} from 'wagmi'
import {strategies} from '../lib/strategies'
import WalletButton from '../components/WalletButton'

type Opportunity = {id?:string; venue?:string; chainId?:number; tokenIn?:string; tokenOut?:string; netProfitUsd?:number}
type Assurance = {status:string; grade:string; flashLiquiditySources:number; fundedAssets:number; configuredQuoteRoutes:number; freshQuotes:number; profitablePaths:number; coverageRatio:number; quoteFreshnessRatio:number; venueCount:number; chainCount:number; expandable:boolean; nextActions:string[]; message:string}
type Graph = {routeCount:number; freshRouteCount:number; liquidityCoveredRouteCount:number}
type OpportunityStatus = {operationalState:string; nextProcedure:string[]; executionAuthorization:string; liveExecution:boolean; quoteCount:number; opportunityCount:number; targetAttainment:{targetProfitUsd:number; accumulatedProfitUsd:number; remainingProfitUsd:number; targetReached:boolean}; venueAvailability:{configuredVenueCount:number; activeVenueCount:number; unavailableVenueCount:number; venues:string[]}; errors?:string[]; message:string}
type Enforcement = {executionState:string; authorization:string; policyMode:string; gates:{mandatoryGateCount:number; passedGateCount:number; allMandatoryGatesPassed:boolean}; enforcement:{privateRelayPreferred:boolean; bundleRequired:boolean; nonceLockRequired:boolean; revalidateBeforeSend:boolean; maxPriorityFeeGwei:number; maxBribeBps:number; maxGasMultiplier:number; maxGasUsd:number; minNetProfitAfterEnforcementUsd:number; deadlineSeconds:number}; procedure:string[]; prohibitedShortcuts:string[]}

const stateLabel=(state:string)=>state.replaceAll('_',' ')

export default function Home(){
 const [status,setStatus]=useState('READY')
 const [target,setTarget]=useState(100)
 const [opportunities,setOpportunities]=useState<Opportunity[]>([])
 const [assurance,setAssurance]=useState<Assurance|null>(null)
 const [graph,setGraph]=useState<Graph|null>(null)
 const [opStatus,setOpStatus]=useState<OpportunityStatus|null>(null)
 const [enforcement,setEnforcement]=useState<Enforcement|null>(null)
 const [scanMessage,setScanMessage]=useState('No live scan performed yet.')
 const [scanning,setScanning]=useState(false)
 const {isConnected}=useAccount()

 async function scan(){
   setScanning(true); setStatus('SCANNING'); setScanMessage('Refreshing live quotes, liquidity coverage and opportunity state…')
   try{
     const [scanResponse,statusResponse,enforcementResponse]=await Promise.all([
       fetch(`/api/scan?target=${target}`,{cache:'no-store'}),
       fetch(`/api/opportunity-status?target=${target}`,{cache:'no-store'}),
       fetch('/api/execution-enforcement',{cache:'no-store'})
     ])
     const j=await scanResponse.json(); const s=await statusResponse.json(); const e=await enforcementResponse.json()
     setOpportunities(Array.isArray(j.selected)?j.selected:[]); setAssurance(j.assurance||null); setGraph(j.routeGraph||null); setOpStatus(s); setEnforcement(e)
     setScanMessage(s.message||j.message||j.adapterError||j.liquidityError||'Scan completed.')
     setStatus(stateLabel(s.operationalState|| (j.targetReached?'TARGET_REACHED':j.opportunityCount>0?'OPPORTUNITIES_AVAILABLE':'WAITING_FOR_OPPORTUNITY')))
   }catch{setOpportunities([]);setAssurance(null);setGraph(null);setOpStatus(null);setEnforcement(null);setScanMessage('SCAN ERROR: live quote or readiness service unavailable.');setStatus('SCAN ERROR')}
   finally{setScanning(false)}
 }

 return <main>
   <header><div><b>INSTA-FLOAN</b><span> · CONTROL PLANE</span></div><WalletButton/></header>
   <section className="hero"><small>INSTADAPP-ORIENTED FLASH-LOAN ARBITRAGE</small><h1>Detect opportunities first. Authorize execution only after every gate passes.</h1><p>Discovery, assurance, target attainment and execution authorization are separate states. A detected opportunity is not an authorized trade.</p><div className="actions"><label>TARGET PROFIT <input type="number" min="1" value={target} onChange={e=>setTarget(Number(e.target.value)||1)}/></label><button className="primary" onClick={scan} disabled={scanning}>{scanning?'SCANNING…':'SCAN / REFRESH STATUS'}</button></div><div className="walletModes"><span>WALLET CONNECT</span><i>or</i><span>PRIVATE KEY · MEMORY ONLY</span></div></section>
   <section className="stats"><div>WALLET<strong>{isConnected?'CONNECTED':'NOT CONNECTED'}</strong></div><div>STRATEGIES<strong>{strategies.length}</strong></div><div>TARGET<strong>${target}</strong></div><div>ENGINE<strong>{status}</strong></div></section>

   <section className="panel"><h2>Current execution state</h2><div className="stats"><div>OPPORTUNITY STATE<strong>{opStatus?.operationalState?stateLabel(opStatus.operationalState):'—'}</strong></div><div>AUTHORIZATION<strong>{opStatus?.executionAuthorization||'BLOCKED'}</strong></div><div>LIVE EXECUTION<strong>{opStatus?.liveExecution?'FLAG SET · GATED':'OFF'}</strong></div><div>QUOTE SNAPSHOT<strong>{opStatus?.quoteCount??'—'}</strong></div></div><p className="muted">{opStatus?.message||'Run a scan to obtain the current control-plane state.'}</p><div className="flow"><span>DETECT</span><i>→</i><span>ASSURE</span><i>→</i><span>SIMULATE</span><i>→</i><span>GATE</span><i>→</i><span>AUTHORIZE</span><i>→</i><span>SUBMIT</span><i>→</i><span>VERIFY</span></div><p className="muted">Only the first four states are currently actionable in this dashboard. Submission remains blocked until the production gate procedure is independently satisfied.</p></section>

   <section className="panel"><h2>Target attainment</h2><div className="stats"><div>TARGET<strong>${opStatus?.targetAttainment.targetProfitUsd??target}</strong></div><div>ACCUMULATED<strong>${opStatus?.targetAttainment.accumulatedProfitUsd??0}</strong></div><div>REMAINING<strong>${opStatus?.targetAttainment.remainingProfitUsd??target}</strong></div><div>STATE<strong>{opStatus?.targetAttainment.targetReached?'TARGET REACHED':'IN PROGRESS'}</strong></div></div><p className="muted">The target is a stopping objective, not a reason to force trades. The engine should stop at target, risk breach, kill-switch activation, or when no opportunity clears the configured net-profit floor.</p></section>

   <section className="panel"><h2>Venue availability</h2><div className="stats"><div>CONFIGURED<strong>{opStatus?.venueAvailability.configuredVenueCount??'—'}</strong></div><div>ACTIVE<strong>{opStatus?.venueAvailability.activeVenueCount??'—'}</strong></div><div>UNAVAILABLE<strong>{opStatus?.venueAvailability.unavailableVenueCount??'—'}</strong></div><div>OPPORTUNITIES<strong>{opStatus?.opportunityCount??opportunities.length}</strong></div></div><p className="muted">{opStatus?.venueAvailability.venues?.join(' · ')||'Venue availability will appear after a live status refresh.'}</p></section>

   <section className="panel"><h2>Opportunity assurance quality</h2><p className="muted">{assurance?.message||'Run a scan to measure live opportunity coverage.'}</p><div className="stats"><div>ASSURANCE GRADE<strong>{assurance?.grade||'—'}</strong></div><div>COVERAGE<strong>{assurance?`${(assurance.coverageRatio*100).toFixed(0)}%`:'—'}</strong></div><div>QUOTE FRESHNESS<strong>{assurance?`${(assurance.quoteFreshnessRatio*100).toFixed(0)}%`:'—'}</strong></div><div>PROFITABLE PATHS<strong>{assurance?.profitablePaths??'—'}</strong></div></div><div className="stats"><div>LIQUIDITY ASSETS<strong>{assurance?.fundedAssets??'—'}</strong></div><div>FRESH QUOTES<strong>{assurance?.freshQuotes??'—'}</strong></div><div>VENUES<strong>{assurance?.venueCount??'—'}</strong></div><div>CHAINS<strong>{assurance?.chainCount??'—'}</strong></div></div>{graph&&<p className="muted">Route graph: {graph.routeCount} routes · {graph.freshRouteCount} fresh · {graph.liquidityCoveredRouteCount} liquidity-covered · {assurance?.expandable?'EXPANSION READY':'BLOCKED'}</p>}{assurance?.nextActions?.length ? <div className="muted"><b>Next assurance actions:</b> {assurance.nextActions.join(' · ')}</div>:null}</section>

   <section className="panel"><h2>Live opportunity monitor</h2><p className="muted">{scanMessage}</p>{opportunities.length===0?<div className="empty">Current executable opportunities: <b>0</b></div>:opportunities.map((o,i)=><div className="row" key={o.id||i}><b>{o.venue||'Configured venue'}</b><span>Chain {o.chainId}</span><span>{o.tokenIn?.slice(0,8)}… → {o.tokenOut?.slice(0,8)}…</span><strong>NET ${Number(o.netProfitUsd||0).toFixed(2)}</strong><button onClick={()=>setStatus('SIMULATION REQUIRED')}>SIMULATE</button></div>)}</section>

   <section className="panel"><h2>Execution enforcement readiness</h2><div className="stats"><div>POLICY<strong>{enforcement?.policyMode||'—'}</strong></div><div>GATES<strong>{enforcement?`${enforcement.gates.passedGateCount}/${enforcement.gates.mandatoryGateCount}`:'—'}</strong></div><div>AUTHORIZATION<strong>{enforcement?.authorization||'BLOCKED'}</strong></div><div>PRIVATE RELAY<strong>{enforcement?.enforcement.privateRelayPreferred?'PREFERRED':'NOT PREFERRED'}</strong></div></div><p className="muted">Enforcement may model bounded inclusion-related costs, but cannot override safety/profitability gates or guarantee inclusion. This control plane does not autonomously spend incentives or submit transactions.</p></section>

   <section className="grid"><div className="panel"><h2>Liquidity strategy matrix</h2>{strategies.map(s=><div className="row" key={s.id}><b>{s.name}</b><span>{s.mode}</span><span>{s.chains}</span><em>{s.guard}</em></div>)}</div><aside className="panel"><h2>Execution gates</h2><div className="gate">01 · Wallet authorization</div><div className="gate">02 · Chain & contract validation</div><div className="gate">03 · Liquidity + quote freshness</div><div className="gate">04 · Full-route simulation</div><div className="gate">05 · Net-profit safety reserve</div><div className="gate">06 · Atomic transaction approval</div><p className="muted">Any failed gate keeps authorization BLOCKED.</p></aside></section>

   <section className="panel"><h2>Target-attainment controls</h2><div className="actions"><button onClick={scan} disabled={scanning}>{scanning?'SCANNING…':'SCAN / REFRESH'}</button><button disabled>ARM · GATED</button><button disabled>START TARGET · GATED</button><button disabled>STOP / KILL SWITCH</button></div><p className="muted">Procedure: refresh → detect → assure → simulate → validate gates → explicit authorization → execute → verify/reconcile. The current production boundary intentionally stops before authorization/submission.</p></section>
   <footer>WALLETCONNECT · MEMORY-ONLY PRIVATE-KEY IMPORT · NO SEED PHRASES · LIVE QUOTES READ-ONLY · REAL EXECUTION OFF</footer>
 </main>
