import {type Quote} from './market'

export type QuoteAdapterConfig = {
  rpcUrl: string
}

/**
 * Server-side quote adapter boundary.
 * Chain health is verified here, but no price is fabricated. A venue-specific
 * adapter must return a real, timestamped quote before it reaches the target engine.
 */
export async function verifyRpc(config: QuoteAdapterConfig): Promise<{blockNumber: number; quotes: Quote[]}> {
  if (!config.rpcUrl) throw new Error('RPC URL is not configured')

  const response = await fetch(config.rpcUrl, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({jsonrpc:'2.0', id:1, method:'eth_blockNumber', params:[]}),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`)
  const json = await response.json() as {result?: string; error?: {message?: string}}
  if (json.error) throw new Error(json.error.message || 'RPC error')
  if (!json.result) throw new Error('RPC returned no block number')

  return {blockNumber: Number.parseInt(json.result, 16), quotes: []}
}
