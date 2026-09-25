export type ExecutionTruthState =
  | 'DISCOVERY_ONLY'
  | 'OPPORTUNITY_DETECTED'
  | 'PROFITABLE_CANDIDATE'
  | 'FORK_ATTESTED'
  | 'READY_FOR_AUTHORIZATION'
  | 'AUTHORIZED'
  | 'SUBMISSION_ENABLED'
  | 'CONFIRMED'
  | 'RECONCILING'
  | 'TARGET_REACHED'
  | 'BLOCKED'

export type ExecutionTruth = {
  state: ExecutionTruthState
  liveExecution: boolean
  automationEnabled: boolean
  autonomousSubmission: boolean
  inclusionIncentiveEnabled: boolean
  controlledForkAttested: boolean
  explicitAuthorizationRequired: boolean
  explicitAuthorizationPresent: boolean
  productionWalletAuthorized: boolean
  riskValidated: boolean
  profitabilityValidated: boolean
  slippageGasValidated: boolean
  executionPathEnabled: boolean
  killSwitchEnabled: boolean
  reason: string
}

const boolEnv = (name: string) => process.env[name] === 'true'

/**
 * Single source of truth for whether the application is merely discovering an
 * opportunity or is actually permitted to submit a live transaction.
 *
 * This function is deliberately fail-closed. Missing/false production gates
 * can never be interpreted as authorization.
 *
 * Manual explicit authorization and autonomous submission are intentionally
 * separate controls. Neither AUTONOMOUS_SUBMISSION nor AUTOMATION_ENABLED is
 * required for an explicitly authorized manual execution.
 */
export function getExecutionTruth(explicitAuthorizationPresent = false): ExecutionTruth {
  const controlledForkAttested = boolEnv('CONTROLLED_FORK_VALIDATED')
  const productionWalletAuthorized = boolEnv('PRODUCTION_WALLET_AUTHORIZED')
  const riskValidated = boolEnv('PRODUCTION_RISK_LIMITS_VALIDATED')
  const profitabilityValidated = boolEnv('PRODUCTION_PROFITABILITY_VALIDATED')
  const slippageGasValidated = boolEnv('PRODUCTION_SLIPPAGE_GAS_VALIDATED')
  const executionPathEnabled = boolEnv('PRODUCTION_EXECUTION_PATH_ENABLED')
  // The kill switch is active unless explicitly disabled. Active kill switch
  // always blocks submission; it is never a positive readiness prerequisite.
  const killSwitchEnabled = process.env.PRODUCTION_KILL_SWITCH_ENABLED !== 'false'
  const liveExecution = boolEnv('LIVE_EXECUTION')
  const automationEnabled = boolEnv('AUTOMATION_ENABLED')
  const autonomousSubmission = boolEnv('AUTONOMOUS_SUBMISSION')
  const inclusionIncentiveEnabled = boolEnv('INCLUSION_INCENTIVE_ENABLED')
  const explicitAuthorizationRequired = process.env.REQUIRE_EXPLICIT_EXECUTION_AUTHORIZATION !== 'false'

  const deterministicGatesPass = controlledForkAttested
    && productionWalletAuthorized
    && riskValidated
    && profitabilityValidated
    && slippageGasValidated
    && executionPathEnabled
    && !killSwitchEnabled

  const authorized = deterministicGatesPass && (!explicitAuthorizationRequired || explicitAuthorizationPresent)
  // Manual execution is valid once explicit authorization and deterministic
  // gates pass. Autonomous submission remains a separate optional mode.
  const submissionEnabled = authorized && liveExecution

  let state: ExecutionTruthState = 'BLOCKED'
  let reason = 'Production execution is fail-closed until all mandatory gates and authorization requirements pass.'

  if (!liveExecution) {
    state = 'DISCOVERY_ONLY'
    reason = 'Live execution is disabled; discovery and revalidation may continue.'
  } else if (!controlledForkAttested) {
    state = 'PROFITABLE_CANDIDATE'
    reason = 'Controlled-fork attestation is required before execution authorization.'
  } else if (killSwitchEnabled) {
    state = 'FORK_ATTESTED'
    reason = 'Production kill switch is enabled; execution is blocked until the operator disables it.'
  } else if (!deterministicGatesPass) {
    state = 'FORK_ATTESTED'
    reason = 'Controlled-fork attestation exists, but one or more production safety gates remain incomplete.'
  } else if (!explicitAuthorizationPresent && explicitAuthorizationRequired) {
    state = 'READY_FOR_AUTHORIZATION'
    reason = 'All deterministic gates pass; explicit execution authorization is still required.'
  } else if (authorized && !automationEnabled) {
    state = 'AUTHORIZED'
    reason = 'Execution is explicitly authorized; autonomous automation remains disabled.'
  } else if (authorized && submissionEnabled) {
    state = 'SUBMISSION_ENABLED'
    reason = autonomousSubmission
      ? 'All execution gates pass and autonomous submission is enabled.'
      : 'All execution gates pass and explicit manual authorization enables submission; autonomous submission remains disabled.'
  }

  return {
    state,
    liveExecution,
    automationEnabled,
    autonomousSubmission,
    inclusionIncentiveEnabled,
    controlledForkAttested,
    explicitAuthorizationRequired,
    explicitAuthorizationPresent,
    productionWalletAuthorized,
    riskValidated,
    profitabilityValidated,
    slippageGasValidated,
    executionPathEnabled,
    killSwitchEnabled,
    reason,
  }
}
