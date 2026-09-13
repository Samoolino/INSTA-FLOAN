import { getExecutionTruth } from './execution-truth'

const baseUrl = () => (process.env.HUMMINGBOT_API_URL || '').replace(/\/$/, '')

function authHeader() {
  const user = process.env.HUMMINGBOT_API_USER
  const pass = process.env.HUMMINGBOT_API_PASS
  if (!user || !pass) return undefined
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

async function request(path: string, init: RequestInit = {}) {
  const url = `${baseUrl()}${path}`
  if (!baseUrl()) throw new Error('HUMMINGBOT_API_URL is not configured')

  const headers = new Headers(init.headers)
  headers.set('accept', 'application/json')
  const auth = authHeader()
  if (auth) headers.set('authorization', auth)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const response = await fetch(url, { ...init, headers, cache: 'no-store' })
  const text = await response.text()
  let data: unknown = text
  try { data = text ? JSON.parse(text) : null } catch {}
  if (!response.ok) throw new Error(`Hummingbot API ${response.status}: ${text.slice(0, 500)}`)
  return data
}

export function hummingbotConfigured() {
  return Boolean(baseUrl())
}

export async function listHummingbotConnectors() {
  return request('/connectors/')
}

export async function getHummingbotTickers(connector?: string) {
  return request(connector ? `/market-data/tickers/${encodeURIComponent(connector)}` : '/market-data/tickers')
}

export async function getHummingbotPoolPrices() {
  return request('/market-data/pool-prices')
}

export async function getHummingbotOrderBook(body: Record<string, unknown>) {
  return request('/market-data/order-book', { method: 'POST', body: JSON.stringify(body) })
}

export async function getHummingbotVwap(body: Record<string, unknown>) {
  return request('/market-data/order-book/vwap-for-volume', { method: 'POST', body: JSON.stringify(body) })
}

export async function getHummingbotPortfolio(body: Record<string, unknown> = {}) {
  return request('/portfolio/state', { method: 'POST', body: JSON.stringify(body) })
}

export type HummingbotOrderRequest = {
  account_name: string
  connector_name: string
  trading_pair: string
  trade_type: 'BUY' | 'SELL'
  amount: number
  order_type: 'LIMIT' | 'MARKET'
  price?: number
  position_action?: 'OPEN' | 'CLOSE' | 'NIL'
}

/**
 * The only live-order boundary exposed by the INSTA-FLOAN adapter.
 * It is fail-closed: Hummingbot is never called unless the complete
 * INSTA-FLOAN production execution truth is SUBMISSION_ENABLED and the
 * caller has explicitly supplied authorization.
 */
export async function submitHummingbotOrder(
  order: HummingbotOrderRequest,
  explicitAuthorizationPresent: boolean,
) {
  const truth = getExecutionTruth(explicitAuthorizationPresent)
  if (truth.state !== 'SUBMISSION_ENABLED') {
    throw new Error(`Execution blocked: ${truth.state} — ${truth.reason}`)
  }
  return request('/trading/orders', { method: 'POST', body: JSON.stringify(order) })
}
