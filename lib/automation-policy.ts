export type AutomationProvider = 'CHAINLINK_AUTOMATION' | 'GELATO' | 'FLASHBOTS' | 'CUSTOM_KEEPER'

export type AutomationPolicy = {
  enabled: boolean
  providers: AutomationProvider[]
  triggerMode: 'DISCOVERY_ONLY' | 'REVALIDATION_ONLY' | 'EXECUTION_REQUEST'
  autonomousSubmission: boolean
  inclusionIncentiveEnabled: boolean
  maxAdditionalGasUsd: number
  maxInclusionIncentiveUsd: number
  requiresControlledForkAttestation: boolean
  requiresExplicitAuthorization: boolean
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

/**
 * Guardrail policy for keeper/bundler integrations.
 *
 * Automation can continuously discover and revalidate opportunities, but
 * autonomous transaction submission and inclusion-incentive spending remain
 * disabled unless explicitly enabled by a future audited release.
 */
export function getAutomationPolicy(): AutomationPolicy {
  const enabled = process.env.AUTOMATION_ENABLED === 'true'
  const autonomousSubmission = process.env.AUTONOMOUS_SUBMISSION === 'true'
  const inclusionIncentiveEnabled = process.env.INCLUSION_INCENTIVE_ENABLED === 'true'

  const providers = (process.env.AUTOMATION_PROVIDERS || '')
    .split(',')
    .map(value => value.trim().toUpperCase())
    .filter((value): value is AutomationProvider =>
      ['CHAINLINK_AUTOMATION', 'GELATO', 'FLASHBOTS', 'CUSTOM_KEEPER'].includes(value),
    )

  const triggerMode = process.env.AUTOMATION_TRIGGER_MODE === 'REVALIDATION_ONLY'
    ? 'REVALIDATION_ONLY'
    : process.env.AUTOMATION_TRIGGER_MODE === 'EXECUTION_REQUEST'
      ? 'EXECUTION_REQUEST'
      : 'DISCOVERY_ONLY'

  return {
    enabled,
    providers,
    triggerMode,
    autonomousSubmission,
    inclusionIncentiveEnabled,
    maxAdditionalGasUsd: numberEnv('MAX_ADDITIONAL_GAS_USD', 0),
    maxInclusionIncentiveUsd: numberEnv('MAX_INCLUSION_INCENTIVE_USD', 0),
    requiresControlledForkAttestation: process.env.REQUIRE_CONTROLLED_FORK_ATTESTATION !== 'false',
    requiresExplicitAuthorization: process.env.REQUIRE_EXPLICIT_EXECUTION_AUTHORIZATION !== 'false',
  }
}

export function automationCanAuthorizeLiveExecution(policy = getAutomationPolicy()) {
  return policy.enabled
    && policy.autonomousSubmission
    && policy.requiresControlledForkAttestation
    && policy.requiresExplicitAuthorization
    && policy.providers.length > 0
}
