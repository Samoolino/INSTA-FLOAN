import { NextResponse } from 'next/server'
import { getExecutionTruth } from '@/lib/execution-truth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  const expected = process.env.MCP_ACCESS_TOKEN

  if (expected && authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const explicitAuthorizationPresent = process.env.EXPLICIT_EXECUTION_AUTHORIZATION === 'true'
  const truth = getExecutionTruth(explicitAuthorizationPresent)

  return NextResponse.json({
    ok: true,
    ...truth,
    policy: {
      maxAdditionalGasUsd: Number(process.env.MAX_ADDITIONAL_GAS_USD || 0),
      maxInclusionIncentiveUsd: Number(process.env.MAX_INCLUSION_INCENTIVE_USD || 0),
      flashbotsSubmissionEnabled: process.env.FLASHBOTS_SUBMISSION_ENABLED === 'true',
      gelatoAutomationEnabled: process.env.GELATO_AUTOMATION_ENABLED === 'true',
      chainlinkAutomationEnabled: process.env.CHAINLINK_AUTOMATION_ENABLED === 'true',
    },
  })
}
