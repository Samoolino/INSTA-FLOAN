import {NextResponse} from 'next/server'
import {runtimeConfig} from '../../../lib/config'
import {getEnforcementPolicy} from '../../../lib/execution-enforcement'

export const dynamic = 'force-dynamic'

export async function GET() {
  const policy = getEnforcementPolicy()
  const gates = {
    liveExecutionFlag: runtimeConfig.liveExecution,
    controlledForkValidated: runtimeConfig.controlledForkValidated && Boolean(runtimeConfig.controlledForkValidationId),
    atomicRepaymentValidated: runtimeConfig.atomicRepaymentValidated,
    walletAuthorized: runtimeConfig.walletAuthorized,
    riskLimitsValidated: runtimeConfig.riskLimitsValidated,
    profitabilityValidated: runtimeConfig.profitabilityValidated,
    slippageGasValidated: runtimeConfig.slippageGasValidated,
    executionPathEnabled: runtimeConfig.executionPathEnabled,
    killSwitchClear: !runtimeConfig.killSwitchEnabled,
  }

  const mandatoryGateCount = Object.keys(gates).length
  const passedGateCount = Object.values(gates).filter(Boolean).length
  const allMandatoryGatesPassed = passedGateCount === mandatoryGateCount

  return NextResponse.json({
    executionState: runtimeConfig.liveExecution ? 'LIVE_FLAG_SET_BUT_AUTHORIZATION_STILL_GATED' : 'SIMULATION_ONLY',
    authorization: 'BLOCKED',
    policyMode: 'ENFORCEMENT_POLICY_ONLY',
    enforcement: {
      objective: 'Increase inclusion probability only when the opportunity remains safely profitable after enforcement costs.',
      privateRelayPreferred: policy.privateRelayPreferred,
      bundleRequired: policy.bundleRequired,
      nonceLockRequired: policy.nonceLockRequired,
      revalidateBeforeSend: policy.revalidateBeforeSend,
      maxPriorityFeeGwei: policy.maxPriorityFeeGwei,
      maxBribeBps: policy.maxBribeBps,
      maxGasMultiplier: policy.maxGasMultiplier,
      maxGasUsd: policy.maxGasUsd,
      minNetProfitAfterEnforcementUsd: policy.minNetProfitAfterEnforcementUsd,
      deadlineSeconds: policy.deadlineSeconds,
    },
    gates: {
      mandatoryGateCount,
      passedGateCount,
      allMandatoryGatesPassed,
      values: gates,
    },
    procedure: [
      'Detect a fresh, executable route from independent quote and liquidity observations.',
      'Calculate gross return and full cost model: swap fees, gas, slippage, bridge/settlement costs and enforcement cost.',
      'Reject the route if post-enforcement net profit falls below the configured safety floor.',
      'If Ethereum inclusion is needed, prefer private relay/bundle submission where configured; never treat a bribe as a guarantee of inclusion.',
      'Revalidate quotes, balances, nonce, gas and route state immediately before authorization.',
      'Simulate the exact atomic transaction path including repayment and safety checks.',
      'Require controlled-fork attestation, wallet authorization, risk/profitability/slippage validation and an enabled execution path.',
      'Require the kill switch to be clear; otherwise remain BLOCKED.',
      'After submission, verify receipt/finality and reconcile actual versus modeled net profit before continuing target attainment.',
    ],
    prohibitedShortcuts: [
      'No forced trade merely to attain the target.',
      'No fabricated or stale quote is executable evidence.',
      'No bribe/priority fee can override a failed safety or profitability gate.',
      'No MCP, dashboard or deployment state can authorize a transaction.',
    ],
  })
}
