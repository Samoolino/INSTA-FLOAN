import { NextResponse } from 'next/server'
import { getHummingbotBridgeStatus } from '../../../lib/hummingbot-bridge'

export async function GET() {
  return NextResponse.json({
    status: getHummingbotBridgeStatus(),
    message:
      'Hummingbot is an execution/data bridge. INSTA-FLOAN remains the final opportunity, risk, simulation and authorization control plane.',
  })
}
