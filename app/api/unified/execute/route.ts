import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getExecutionTruth } from '../../../../lib/execution-truth'
import { submitHummingbotOrder, type HummingbotOrderRequest } from '../../../../lib/hummingbot-api'

export const dynamic = 'force-dynamic'

function authorized(request: Request) {
  const configured = process.env.INSTA_EXECUTION_AUTH_TOKEN
  const supplied = request.headers.get('x-insta-execution-authorization')
  if (!configured || !supplied) return false
  const a = Buffer.from(configured)
  const b = Buffer.from(supplied)
  return a.length === b.length && timingSafeEqual(a, b)
}

function walletMatches(request: Request, body: Record<string, unknown>) {
  const connected = request.headers.get('x-wallet-address')?.toLowerCase()
  const requested = typeof body.walletAddress === 'string' ? body.walletAddress.toLowerCase() : undefined
  if (!connected || !requested) return true
  return connected === requested
}

export async function POST(request: Request) {
  const explicitAuthorizationPresent = authorized(request)
  const execution = getExecutionTruth(explicitAuthorizationPresent)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'BLOCKED', message: 'Invalid JSON execution request.' }, { status: 400 })
  }

  if (!walletMatches(request, body)) {
    return NextResponse.json({
      status: 'BLOCKED',
      message: 'Requested wallet identity does not match the connected control-plane wallet.',
    }, { status: 409 })
  }

  if (execution.state !== 'SUBMISSION_ENABLED') {
    return NextResponse.json({
      status: 'BLOCKED',
      execution,
      wallet: body.walletAddress || request.headers.get('x-wallet-address') || null,
      message: 'Unified execution is fail-closed. Controlled-fork validation, production authorization and all execution gates must pass before submission.',
    }, { status: 409 })
  }

  const engine = body.engine
  if (engine !== 'HUMMINGBOT') {
    return NextResponse.json({
      status: 'BLOCKED',
      execution,
      message: 'Only the verified Hummingbot execution adapter is currently wired to a real order-submission boundary. Instadapp/DEX execution remains gated until its on-chain executor is independently attested.',
    }, { status: 409 })
  }

  const order: HummingbotOrderRequest = {
    account_name: String(body.account_name || ''),
    connector_name: String(body.connector_name || ''),
    trading_pair: String(body.trading_pair || ''),
    trade_type: body.trade_type as 'BUY' | 'SELL',
    amount: String(body.amount || ''),
    order_type: body.order_type as HummingbotOrderRequest['order_type'],
    price: body.price == null ? undefined : String(body.price),
  }

  if (!order.account_name || !order.connector_name || !order.trading_pair || !['BUY', 'SELL'].includes(order.trade_type) || !order.amount) {
    return NextResponse.json({ status: 'BLOCKED', message: 'Incomplete Hummingbot execution request.' }, { status: 422 })
  }

  try {
    const result = await submitHummingbotOrder(order, explicitAuthorizationPresent)
    return NextResponse.json({
      status: 'SUBMITTED',
      engine: 'HUMMINGBOT',
      wallet: body.walletAddress || request.headers.get('x-wallet-address') || null,
      execution,
      result,
    })
  } catch (error) {
    return NextResponse.json({
      status: 'BLOCKED',
      execution: getExecutionTruth(explicitAuthorizationPresent),
      message: error instanceof Error ? error.message : 'Execution failed safely.',
    }, { status: 409 })
  }
}
