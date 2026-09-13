import { NextResponse } from 'next/server'
import {
  getHummingbotPoolPrices,
  getHummingbotTickers,
  listHummingbotConnectors,
  hummingbotConfigured,
} from '../../../../lib/hummingbot-api'

export async function GET() {
  if (!hummingbotConfigured()) {
    return NextResponse.json({
      status: 'NOT_CONFIGURED',
      connectors: [],
      tickers: null,
      poolPrices: null,
      message: 'HUMMINGBOT_API_URL is not configured on this server.',
    }, { status: 503 })
  }

  const results = await Promise.allSettled([
    listHummingbotConnectors(),
    getHummingbotTickers(),
    getHummingbotPoolPrices(),
  ])

  const value = (index: number) => results[index].status === 'fulfilled' ? results[index].value : null
  const error = (index: number) => results[index].status === 'rejected'
    ? String(results[index].reason instanceof Error ? results[index].reason.message : results[index].reason)
    : null

  return NextResponse.json({
    status: results.every(result => result.status === 'fulfilled') ? 'OK' : 'PARTIAL',
    connectors: value(0),
    tickers: value(1),
    poolPrices: value(2),
    errors: {
      connectors: error(0),
      tickers: error(1),
      poolPrices: error(2),
    },
    security: {
      credentialsReturned: false,
      liveExecutionEnabled: false,
    },
  })
}
