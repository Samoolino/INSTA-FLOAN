import {encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'

/**
 * Instadapp DSL simulation boundary.
 *
 * Official Instadapp documentation describes Smart Account execution through
 * `cast()` and extension dispatch via the account fallback. Historical official
 * Instadapp interfaces show the concrete cast shape as:
 *   cast(address[] targets, bytes[] datas, address origin)
 *
 * We use that ABI only for calldata construction. Flash-loan connector/module
 * selection remains configuration-driven and is NOT assumed from historical
 * connector addresses.
 */
export type InstadappCastCall = {
  smartAccount: Address
  targets: Address[]
  datas: Hex[]
  origin: Address
}

export type InstadappSimulationCall = {
  from: Address
  to: Address
  data: Hex
}

const castAbi = parseAbi([
  'function cast(address[] _targets, bytes[] _datas, address _origin) payable returns (bytes32[] responses)',
])

export function buildInstadappCastCall(input: InstadappCastCall): InstadappSimulationCall {
  if (!input.smartAccount) throw new Error('MISSING_SMART_ACCOUNT')
  if (input.targets.length === 0) throw new Error('MISSING_CAST_TARGETS')
  if (input.targets.length !== input.datas.length) throw new Error('CAST_ARRAY_LENGTH_MISMATCH')
  if (input.targets.some(target => !target)) throw new Error('INVALID_CAST_TARGET')
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
