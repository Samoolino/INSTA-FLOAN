import {NextResponse} from 'next/server'
import {assertExecutionDisabled, getPublicRuntimeStatus, runtimeConfig} from '../../../lib/config'
import {getInstadappCastEngineStatus} from '../../../lib/instadapp-adapter'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    assertExecutionDisabled()
    return NextResponse.json({
      service: 'INSTA-FLOAN',
      ...getPublicRuntimeStatus(),
      castEngine: getInstadappCastEngineStatus(),
      targetProfitUsd: runtimeConfig.targetProfitUsd,
      minNetProfitUsd: runtimeConfig.minNetProfitUsd,
      safetyReserveUsd: runtimeConfig.safetyReserveUsd,
      maxPathsPerCycle: runtimeConfig.maxPathsPerCycle,
      maxCycles: runtimeConfig.maxCycles,
      executionAuthorization: 'BLOCKED',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      service: 'INSTA-FLOAN',
      ok: false,
      castEngine: getInstadappCastEngineStatus(),
      executionAuthorization: 'BLOCKED',
      error: error instanceof Error ? error.message : 'Runtime safety check failed',
      timestamp: new Date().toISOString(),
    }, {status: 503})
  }
}
