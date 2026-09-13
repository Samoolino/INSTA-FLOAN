import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { getExecutionTruth } from '../../../../lib/execution-truth'
import { submitHummingbotOrder, type HummingbotOrderRequest } from '../../../../lib/hummingbot-api'

function authorized(request: Request) {
  const configured = process.env.INSTA_EXECUTION_AUTH_TOKEN
  const supplied = request.headers.get('x-insta-execution-authorization')
  if (!configured || !supplied) return false
  const a = Buffer.from(configured)
  const b = Buffer.from(supplied)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const explicitAuthorizationPresent = authorized(request)
  const truth = getExecutionTruth(explicitAuthorizationPresent)

  if (truth.state !== 'SUBMISSION_ENABLED') {
    return NextResponse.json({
      status: 'BLOCKED',
      execution: truth,
      message: 'Hummingbot execution is fail-closed. No order was submitted.',
    }, { status: 409 })
  }

  let order: HummingbotOrderRequest
  try {
    order = await request.json()
  } catch {
    return NextResponse.json({ status: 'BLOCKED', message: 'Invalid JSON order request.' }, { status: 400 })
  }

  if (!order?.account_name || !order?.connector_name || !order?.trading_pair || !['BUY', 'SELL'].includes(order.trade_type)) {
    return NextResponse.json({ status: 'BLOCKED', message: 'Incomplete order request.' }, { status: 422 })
  }

  try {
    const result = await submitHummingbotOrder(order, explicitAuthorizationPresent)
    return NextResponse.json({ status: 'SUBMITTED', execution: truth, result })
  } catch (error) {
    return NextResponse.json({
      status: 'BLOCKED',
      execution: getExecutionTruth(explicitAuthorizationPresent),
      message: error instanceof Error ? error.message : 'Execution failed safely.',
    }, { status: 409 })
  }
}
