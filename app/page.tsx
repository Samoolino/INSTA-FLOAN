'use client'

import {useEffect, useState} from 'react'
import {useAccount} from 'wagmi'
import {strategies} from '../lib/strategies'
import WalletButton from '../components/WalletButton'

type Opportunity = {id?:string; venue?:string; chainId?:number; tokenIn?:string; tokenOut?:string; netProfitUsd?:number}
type Assurance = {status:string; flashLiquiditySources:number; fundedAssets:number; configuredQuoteRoutes:number; freshQuotes:number; profitablePaths:number; coverageRatio:number; quoteFreshnessRatio:number; venueCount:number; chainCount:number; expandable:boolean; nextActions:string[]; message:string; grade:string}
type Graph = {routeCount:number; freshRouteCount:number; liquidityCoveredRouteCount:number}
type Bridge = {enabled:boolean; liveTradingEnabled:boolean; executionAuthorized:boolean; apiConfigured:boolean; gatewayConfigured:boolean; activeNetworks:string[]; connectors:{name:string;kind:'CEX'|'DEX';configured:boolean;credentialsConfigured:boolean;networkScope:string[];executionEnabled:boolean}[]; policy:{secretsNeverReturned:boolean;withdrawalsDisabledByArchitecture:boolean;readOnlyUntilExplicitAuthorization:boolean;controlledForkRequired:boolean}}
type Unified = {status:string; wallet:{address:string|null; identityScope:string; custodyModel:string; note:string}; engines:{instadapp:{status:string;quoteCount:number;opportunityCount:number;executableOpportunityCount:number;routeCount:number;freshRouteCount:number;liquidityCoveredRouteCount:number;assuranceGrade:string}; hummingbot:{configured:boolean;connectorCount:number;tickerCount:number;poolPriceCount:number;status:string;error?:string}}; execution:{state:string;liveExecution:boolean;automationEnabled:boolean;autonomousSubmission:boolean;inclusionIncentiveEnabled:boolean;controlledForkAttested:boolean;explicitAuthorizationRequired:boolean;productionWalletAuthorized:boolean;riskValidated:boolean;profitabilityValidated:boolean;slippageGasValidated:boolean;executionPathEnabled:boolean;killSwitchEnabled:boolean;reason:string}; target:{requestedUsd:number;targetReached:boolean;nextAction:string}; safety:{automationEnabled:boolean;autonomousSubmission:boolean;inclusionIncentives:boolean;explicitAuthorizationRequired:boolean;controlledForkRequired:boolean;killSwitchEnabled:boolean;liveExecution:boolean}; errors:{adapterError?:string;venueConfigError?:string;liquidityError?:string}}

export default function Home(){
 const [status,setStatus]=useState('READY')
 const [target,setTarget]=useState(100)
 const [opportunities,setOpportunities]=useState<Opportunity[]>([])
 const [assurance,setAssurance]=useState<Assurance|null>(null)
 const [graph,setGraph]=useState<Graph|null>(null)
 const [bridge,setBridge]=useState<Bridge|null>(null)
 const [unified,setUnified]=useState<Unified|null>(null)
 const [scanMessage,setScanMessage]=useState('No live scan performed yet.')
 const [scanning,setScanning]=useState(false)
 const {address,isConnected}=useAccount()

 useEffect(()=>{fetch('/api/hummingbot',{cache:'no-store'}).then(r=>r.json()).then(j=>setBridge(j.status||null)).catch(()=>setBridge(null))},[])

 async function scan(){
   setScanning(true); setStatus('SCANNING'); setScanMessage('Rotating verified liquidity × token × venue routes across both engines…')
   try{
     const headers: HeadersInit = address ? {'x-wallet-address':address} : {}
     const r=await fetch(`/api/unified?target=${target}${address?`&wallet=${encodeURIComponent(address)}`:''}`,{cache:'no-store',headers}); const u:Unified=await r.json()
     setUnified(u)
     const sr=await fetch(`/api/scan?target=${target}`,{cache:'no-store'}); const j=await sr.json()
     setOpportunities(Array.isArray(j.selected)?j.selected:[]); setAssurance(j.assurance||null); setGraph(j.routeGraph||null)
     setScanMessage(j.adapterError||j.liquidityError||u.engines.hummingbot.error||j.message||'Unified scan completed.')
     setStatus(u.target.targetReached?'TARGET REACHED':u.engines.instadapp.opportunityCount>0||u.engines.hummingbot.tickerCount>0?'OPPORTUNITIES FOUND':u.execution.state)
   }catch{setOpportunities([]);setAssurance(null);setGraph(null);setUnified(null);setScanMessage('SCAN ERROR: live quote service unavailable.');setStatus('SCAN ERROR')}
   finally{setScanning(false)}
 }

 return <main>
   <header><div><b>INSTA-FLOAN</b><span> · UNIFIED CONTROL CONSOLE</span></div><WalletButton/></header>
   <section className="hero"><small>INSTADAPP DAPP + HUMMINGBOT ARBITRAGE</small><h1>One frontend. One wallet identity. Two independent execution engines.</h1><p>The console shares wallet identity, target policy, risk truth and reconciliation visibility while keeping Instadapp/DEX execution and Hummingbot/CEX execution operationally independent. No engine can bypass the common safety boundary.</p><div className="actions"><label>TARGET PROFIT <input type="number" min="1" value={target} onChange={e=>setTarget(Number(e.target.value)||1)}/></label><button className="primary" onClick={scan} disabled={scanning||!isConnected}>{scanning?'SCANNING…':'SCAN ALL ENGINES'}</button></div><div className="walletModes"><span>{isConnected?`SHARED WALLET · ${address?.slice(0,8)}…${address?.slice(-6)}`:'CONNECT WALLET TO IDENTIFY BOTH ENGINES'}</span><i>·</i><span>PRIVATE KEY · MEMORY ONLY</span></div></section>

   <section className="stats"><div>WALLET<strong>{isConnected?'CONNECTED':'NOT CONNECTED'}</strong></div><div>STRATEGIES<strong>{strategies.length}</strong></div><div>TARGET<strong>${target}</strong></div><div>CONTROL<strong>{status}</strong></div></section>

   <section className="grid"><div className="panel"><h2>Engine A · Instadapp / DEX</h2><p className="muted">On-chain flash-liquidity, DEX↔DEX and supported cross-route discovery. Wallet remains the on-chain signer boundary.</p><div className="stats"><div>STATUS<strong>{unified?.engines.instadapp.status||assurance?.status||'DISCOVERY_ONLY'}</strong></div><div>QUOTES<strong>{unified?.engines.instadapp.quoteCount??0}</strong></div><div>PATHS<strong>{unified?.engines.instadapp.opportunityCount??0}</strong></div><div>NET-EXECUTABLE<strong>{unified?.engines.instadapp.executableOpportunityCount??0}</strong></div></div></div><div className="panel"><h2>Engine B · Hummingbot / CEX + Gateway</h2><p className="muted">Independent CEX accounts and Gateway DEX market-data/execution connectivity. Credentials stay in Hummingbot's encrypted store.</p><div className="stats"><div>STATUS<strong>{unified?.engines.hummingbot.status||'NOT_CONFIGURED'}</strong></div><div>CONNECTORS<strong>{unified?.engines.hummingbot.connectorCount??0}</strong></div><div>TICKERS<strong>{unified?.engines.hummingbot.tickerCount??0}</strong></div><div>POOL PRICES<strong>{unified?.engines.hummingbot.poolPriceCount??0}</strong></div></div></div></section>

   <section className="panel"><h2>Shared identity · independent funds</h2><div className="row"><b>Wallet identity</b><span>{unified?.wallet.address||address||'NOT CONNECTED'}</span></div><div className="row"><b>Control-plane scope</b><span>ONE ADDRESS / TWO ENGINES / SHARED TARGET + RISK TRUTH</span></div><div className="row"><b>Custody</b><span>INDEPENDENT: ON-CHAIN WALLET + HUMMINGBOT CEX ACCOUNTS</span></div><p className="muted">The same wallet address is the user-facing identity across both engines. This does not merge custody or silently transfer funds between a CEX account and an EVM wallet. Capital is scoped independently, and each engine reports its own available execution domain.</p></section>

   <section className="panel"><h2>Unified opportunity assurance</h2><p className="muted">{assurance?.message||'Run SCAN ALL ENGINES to reconcile live DEX quotes, Hummingbot market data and liquidity coverage.'}</p><div className="stats"><div>ASSURANCE GRADE<strong>{assurance?.grade||unified?.engines.instadapp.assuranceGrade||'—'}</strong></div><div>COVERAGE<strong>{assurance?`${(assurance.coverageRatio*100).toFixed(0)}%`:'—'}</strong></div><div>QUOTE FRESHNESS<strong>{assurance?`${(assurance.quoteFreshnessRatio*100).toFixed(0)}%`:'—'}</strong></div><div>PROFITABLE PATHS<strong>{assurance?.profitablePaths??0}</strong></div></div>{graph&&<p className="muted">DEX route graph: {graph.routeCount} routes · {graph.freshRouteCount} fresh · {graph.liquidityCoveredRouteCount} liquidity-covered · {assurance?.expandable?'EXPANSION READY':'BLOCKED'}</p>}</section>

   <section className="panel"><h2>Live opportunity monitor</h2><p className="muted">{scanMessage}</p>{opportunities.length===0?<div className="empty">Current on-chain executable opportunities: <b>0</b></div>:opportunities.map((o,i)=><div className="row" key={o.id||i}><b>{o.venue||'Configured venue'}</b><span>Chain {o.chainId}</span><span>{o.tokenIn?.slice(0,8)}… → {o.tokenOut?.slice(0,8)}…</span><strong>NET ${Number(o.netProfitUsd||0).toFixed(2)}</strong><button onClick={()=>setStatus('SIMULATION REQUIRED')}>SIMULATE</button></div>)}</section>

   <section className="panel"><h2>Execution truth · shared safety boundary</h2><div className="stats"><div>STATE<strong>{unified?.execution.state||'DISCOVERY_ONLY'}</strong></div><div>FORK<strong>{unified?.execution.controlledForkAttested?'ATTESTED':'REQUIRED'}</strong></div><div>AUTH<strong>{unified?.execution.productionWalletAuthorized?'VALIDATED':'REQUIRED'}</strong></div><div>KILL SWITCH<strong>{unified?.execution.killSwitchEnabled?'ON':'OFF'}</strong></div></div><div className="row"><b>Automation</b><span>{unified?.execution.automationEnabled?'ENABLED':'DISABLED'}</span><span>Autonomous submission: {unified?.execution.autonomousSubmission?'ENABLED':'DISABLED'}</span><span>Live execution: {unified?.execution.liveExecution?'ENABLED':'DISABLED'}</span></div><p className="muted">Both engines remain independently stoppable, but neither can submit while the common execution truth is blocked. Discovery, quote refresh, route rotation and simulation may continue without authorization.</p></section>

   <section className="grid"><div className="panel"><h2>Liquidity strategy matrix</h2>{strategies.map(s=><div className="row" key={s.id}><b>{s.name}</b><span>{s.mode}</span><span>{s.chains}</span><em>{s.guard}</em></div>)}</div><aside className="panel"><h2>CEX ↔ DEX bridge</h2>{bridge&&<><div className="row"><b>Networks</b><span>{bridge.activeNetworks.length?bridge.activeNetworks.join(' · '):'No RPC networks configured'}</span></div><div className="row"><b>CEX connectors</b><span>{bridge.connectors.filter(c=>c.kind==='CEX').map(c=>c.name).join(' · ')||'None configured'}</span></div><div className="row"><b>DEX connectors</b><span>{bridge.connectors.filter(c=>c.kind==='DEX').map(c=>c.name).join(' · ')||'None configured'}</span></div></>}<p className="muted">CEX↔DEX is inventory-based; DEX↔DEX can be atomic where the route and flash-liquidity proof support it.</p></aside></section>

   <section className="panel"><h2>Target-attainment controls</h2><div className="flow"><span>TARGET</span><i>→</i><span>DISCOVER</span><i>→</i><span>ROTATE</span><i>→</i><span>QUOTE</span><i>→</i><span>SIMULATE</span><i>→</i><span>RISK GATE</span><i>→</i><span>AUTHORIZE</span><i>→</i><span>EXECUTE</span><i>→</i><span>VERIFY PNL</span></div><div className="actions"><button onClick={scan} disabled={scanning||!isConnected}>{scanning?'SCANNING…':'SCAN ALL ENGINES'}</button><button disabled>ARM EXECUTION · GATED</button><button disabled>START TARGET · GATED</button><button disabled>STOP / KILL SWITCH</button></div><p className="muted">No profitable path means WAITING FOR OPPORTUNITY. The target is never forced. Route expansion remains open to every configured network/token/venue that passes validation, while unsupported or stale routes stay non-executable.</p></section>
   <footer>WALLETCONNECT · MEMORY-ONLY PRIVATE-KEY IMPORT · NO SEED PHRASES · SHARED WALLET IDENTITY · INDEPENDENT CEX/DEX CUSTODY · LIVE QUOTES READ-ONLY · REAL EXECUTION OFF</footer>
 </main>
}