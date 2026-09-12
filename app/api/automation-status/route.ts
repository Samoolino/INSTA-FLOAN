import {NextResponse} from 'next/server'
import {automationCanAuthorizeLiveExecution, getAutomationPolicy} from '../../../lib/automation-policy'
import {runtimeConfig} from '../../../lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const policy = getAutomationPolicy()

  return NextResponse.json({
    status: automationCanAuthorizeLiveExecution(policy) ? 'AUTHORIZATION_CAPABLE' : 'GUARDED',
    liveExecution: runtimeConfig.liveExecution,
    automation: {
      enabled: policy.enabled,
      providers: policy.providers,
      triggerMode: policy.triggerMode,
      autonomousSubmission: policy.autonomousSubmission,
      inclusionIncentiveEnabled: policy.inclusionIncentiveEnabled,
      maxAdditionalGasUsd: policy.maxAdditionalGasUsd,
      maxInclusionIncentiveUsd: policy.maxInclusionIncentiveUsd,
      requiresControlledForkAttestation: policy.requiresControlledForkAttestation,
      requiresExplicitAuthorization: policy.requiresExplicitAuthorization,
    },
    executionPolicy: {
      liveExecutionFlag: runtimeConfig.liveExecution,
      automationMayDiscover: policy.enabled,
      automationMayRevalidate: policy.enabled,
      automationMayAuthorizeLiveExecution: automationCanAuthorizeLiveExecution(policy),
      transactionSubmission: 'DETERMINISTIC_EXECUTOR_ONLY',
    },
    message: automationCanAuthorizeLiveExecution(policy)
      ? 'Automation policy is configured for authorization-capable operation; the deterministic execution gates remain authoritative.'
      : 'Automation is guarded. It may discover/revalidate opportunities, but it cannot autonomously authorize or submit a live transaction.',
  })
}
