import {buildOpportunity, discoverOpportunities, normalizeQuotes, type Quote} from './market'

const now = Date.now()
const quote: Quote = {
  venue: 'TEST-DEX', chainId: 1, tokenIn: 'USDC', tokenOut: 'USDC',
  amountInUsd: 1000, amountOutUsd: 1020, gasUsd: 3, slippageUsd: 2, timestamp: now
}

if (normalizeQuotes([quote, {...quote, amountInUsd: NaN}]).length !== 1) throw new Error('quote validation failed')
const opportunity = buildOpportunity(quote)
if (!opportunity.safe || opportunity.net !== 15) throw new Error('opportunity calculation failed')
const stale = buildOpportunity({...quote, timestamp: now - 20_000})
if (stale.safe || stale.reason !== 'STALE_QUOTE') throw new Error('stale quote gate failed')
const negative = buildOpportunity({...quote, amountOutUsd: 1001})
if (negative.safe || negative.reason !== 'NON_POSITIVE_NET') throw new Error('negative-net gate failed')
if (discoverOpportunities([quote]).length !== 1) throw new Error('discovery failed')
console.log('market tests passed')
