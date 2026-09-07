import {normalizeQuotes, type Quote} from './market'

const positive = (value: string | undefined, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

export type QuoteAdapterConfig = {
  rpcUrl: string
  maxAgeMs?: number
}

/**
 * Server-side quote adapter boundary.
 * It intentionally does not invent prices: a venue adapter must supply
 * a verified quote payload before an opportunity can enter the target engine.
 */
export async function fetchRpcHealthQuote(config: QuoteAdapterConfig): Promise<Quote[]> {
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

  // Health is not a market quote. Return an empty normalized set rather than
  // fabricating an opportunity from chain availability.
  void positive(process.env.GAS_USD)
  return normalizeQuotes([])
}
