import { createPublicClient, webSocket } from 'viem'
import { WebSocketOpportunityScanner, binanceConfig, bybitConfig, coinbaseConfig, type ScannerSnapshot } from '../../lib/ws-opportunity-scanner'

const symbols = (process.env.WS_SCAN_SYMBOLS || 'BTCUSDT,ETHUSDT,BNBUSDT').split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
const minNetUsd = Number(process.env.WS_SCAN_MIN_NET_USD || '1')
const feeBps = Number(process.env.WS_SCAN_FEE_BPS || '10')
const slippageBps = Number(process.env.WS_SCAN_SLIPPAGE_BPS || '5')
const maxAgeMs = Number(process.env.WS_SCAN_MAX_AGE_MS || '2000')

const configs = []
if (process.env.WS_SCAN_ENABLE_BINANCE !== 'false') configs.push(binanceConfig(symbols))
if (process.env.WS_SCAN_ENABLE_COINBASE !== 'false') configs.push(coinbaseConfig(symbols))
if (process.env.WS_SCAN_ENABLE_BYBIT !== 'false') configs.push(bybitConfig(symbols))

const scanner = new WebSocketOpportunityScanner(configs, { minNetUsd, feeBps, slippageBps, maxAgeMs, maxResults: 50 })

function emit(snapshot: ScannerSnapshot) {
  const profitable = snapshot.opportunities.filter(o => o.executable && o.netUsd >= minNetUsd)
  process.stdout.write(JSON.stringify({
    type: 'WS_OPPORTUNITY_SNAPSHOT',
    updatedAt: snapshot.updatedAt,
    bookCount: snapshot.books.length,
    opportunityCount: snapshot.opportunities.length,
    profitableCount: profitable.length,
    opportunities: profitable.slice(0, 20),
  }) + '\n')
}

scanner.start(emit)

const rpcUrls = (process.env.WS_SCAN_RPC_WSS_URLS || '').split(',').map(s => s.trim()).filter(Boolean)
const rpcClients = rpcUrls.map((url, index) => {
  const client = createPublicClient({ transport: webSocket(url) })
  client.watchBlockNumber({
    emitOnBegin: true,
    onBlockNumber: block => process.stdout.write(JSON.stringify({ type: 'RPC_BLOCK', rpcIndex: index, block: block.toString(), timestamp: Date.now() }) + '\n'),
    onError: error => process.stderr.write(`[rpc:${index}] ${error instanceof Error ? error.message : String(error)}\n`),
  })
  return client
})

process.stdout.write(JSON.stringify({
  type: 'WS_SCANNER_STARTED',
  symbols,
  venues: configs.map(c => c.venue),
  rpcWebSockets: rpcClients.length,
  minNetUsd,
  maxAgeMs,
}) + '\n')

const shutdown = () => {
  scanner.stop()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
