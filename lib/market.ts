export type Quote = {
  venue: string
  chainId: number
  tokenIn: string
  tokenOut: string
  amountInUsd: number
  amountOutUsd: number
  gasUsd: number
  slippageUsd: number
  timestamp: number
}

export type Opportunity = {
  strategy: string
  path: string
  gross: number
  cost: number
  net: number
  safe: boolean
  reason?: string
}

const finitePositive = (n: number) => Number.isFinite(n) && n > 0

export function normalizeQuotes(quotes: Quote[]): Quote[] {
  return quotes.filter(q =>
    finitePositive(q.amountInUsd) &&
    finitePositive(q.amountOutUsd) &&
    Number.isFinite(q.gasUsd) && q.gasUsd >= 0 &&
    Number.isFinite(q.slippageUsd) && q.slippageUsd >= 0 &&
    Number.isFinite(q.timestamp) && q.timestamp > 0 &&
    q.tokenIn.length > 0 && q.tokenOut.length > 0 && q.venue.length > 0
  )
}

export function buildOpportunity(quote: Quote, maxQuoteAgeMs = 15_000): Opportunity {
  const gross = quote.amountOutUsd - quote.amountInUsd
  const cost = quote.gasUsd + quote.slippageUsd
  const net = gross - cost
  const fresh = Date.now() - quote.timestamp <= maxQuoteAgeMs
  const safe = fresh && gross > 0 && net > 0
  return {
    strategy: 'market-quote',
    path: `${quote.venue}:${quote.tokenIn}->${quote.tokenOut}`,
    gross,
    cost,
    net,
    safe,
    reason: safe ? undefined : (!fresh ? 'STALE_QUOTE' : 'NON_POSITIVE_NET')
  }
}

export function discoverOpportunities(quotes: Quote[], maxQuoteAgeMs = 15_000): Opportunity[] {
  return normalizeQuotes(quotes).map(q => buildOpportunity(q, maxQuoteAgeMs))
}
