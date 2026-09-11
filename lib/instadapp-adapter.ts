import {encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'

/**
 * Instadapp Cast engine metadata.
 *
 * The old `Instadapp/dsa-sdk` repository is archived; its last published
 * package is 1.5.15. This application therefore does NOT pin the archived
 * SDK as its execution engine. It uses the current DSL-compatible `cast`
 * ABI directly through viem, which keeps the execution boundary explicit
 * and avoids coupling production execution to the archived SDK.
 */
export const INSTADAPP_CAST_ENGINE = {
  name: 'Instadapp DSL Cast',
  mode: 'direct-abi',
  sdkReference: 'Instadapp/dsa-sdk@1.5.15 (archived; reference only)',
  castSignature: 'cast(string[],bytes[],address)',
  execution: 'simulation-only-until-gates-pass',
} as const

export type InstadappCastCall = {
  smartAccount: Address
  targets: string[]
  datas: Hex[]
  origin: Address
}

export type InstadappSimulationCall = {
  from: Address
  to: Address
  data: Hex
}

export type InstadappCastEngineStatus = {
  engine: typeof INSTADAPP_CAST_ENGINE.name
  mode: typeof INSTADAPP_CAST_ENGINE.mode
  castSignature: typeof INSTADAPP_CAST_ENGINE.castSignature
  archivedSdkReference: typeof INSTADAPP_CAST_ENGINE.sdkReference
  liveExecution: 'BLOCKED'
  reason: string
}

const castAbi = parseAbi([
  'function cast(string[] _targets, bytes[] _datas, address _origin) payable returns (bytes32[] responses)',
])

export function getInstadappCastEngineStatus(): InstadappCastEngineStatus {
  return {
    engine: INSTADAPP_CAST_ENGINE.name,
    mode: INSTADAPP_CAST_ENGINE.mode,
    castSignature: INSTADAPP_CAST_ENGINE.castSignature,
    archivedSdkReference: INSTADAPP_CAST_ENGINE.sdkReference,
    liveExecution: 'BLOCKED',
    reason: 'Production execution remains fail-closed until module signature, deployment identity, controlled-fork, repayment, wallet, risk, profitability, slippage/gas, execution-path and kill-switch gates are explicitly validated.',
  }
}

export function buildInstadappCastCall(input: InstadappCastCall): InstadappSimulationCall {
  if (!input.smartAccount) throw new Error('MISSING_SMART_ACCOUNT')
  if (input.targets.length === 0) throw new Error('MISSING_CAST_TARGETS')
  if (input.targets.length !== input.datas.length) throw new Error('CAST_ARRAY_LENGTH_MISMATCH')
  if (input.targets.some(target => target.length === 0)) throw new Error('INVALID_CAST_TARGET')
  if (input.datas.some(data => !data || data === '0x')) throw new Error('MISSING_CAST_DATA')
  if (!input.origin) throw new Error('MISSING_CAST_ORIGIN')

  return {
    from: input.smartAccount,
    to: input.smartAccount,
    data: encodeFunctionData({
      abi: castAbi,
      functionName: 'cast',
      args: [input.targets, input.datas, input.origin],
    }),
  }
}

export function assertInstadappExecutionReady(): never {
  throw new Error('INSTADAPP_EXECUTION_INTERFACE_REQUIRES_VERIFIED_MODULE_SIGNATURE_AND_DEPLOYMENT')
}
