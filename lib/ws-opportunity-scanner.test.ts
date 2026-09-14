import {describe, expect, it} from 'node:test'
import {findCrossVenueOpportunities, vwap, type OrderBook} from './ws-opportunity-scanner'

describe('websocket opportunity scanner', () => {
  it('calculates VWAP from multiple order-book levels', () => {
    expect(vwap([[100, 1], [101, 2]], 2)).toEqual({price: 100.5, quantity: 2})
  })

  it('only reports positive-net cross-venue opportunities', () => {
    const now = Date.now()
    const books: OrderBook[] = [
      {venue: 'BUY', symbol: 'BTCUSDT', asks: [[100, 2]], bids: [[99, 2]], timestamp: now},
      {venue: 'SELL', symbol: 'BTCUSDT', asks: [[103, 2]], bids: [[102, 2]], timestamp: now},
    ]
    const opportunities = findCrossVenueOpportunities(books, {minNetUsd: 1, feeBps: 10, slippageBps: 5, maxAgeMs: 2000})
    expect(opportunities.length).toBe(1)
    expect(opportunities[0].venueBuy).toBe('BUY')
    expect(opportunities[0].venueSell).toBe('SELL')
    expect(opportunities[0].netUsd).toBeGreaterThan(1)
    expect(opportunities[0].executable).toBe(true)
  })
})
