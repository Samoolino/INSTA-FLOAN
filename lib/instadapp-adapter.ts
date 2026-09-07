import {encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'

/**
 * Instadapp DSA cast boundary.
 *
 * Instapool V4's flashBorrowAndCast decodes its nested `data` as
 * (string[] targets, bytes[] callDatas) and forwards those names to the
 * Smart Account's cast(string[],bytes[],address). The target is therefore a
 * connector name, not an EVM connector address.
 */
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

const castAbi = parseAbi([
  'function cast(string[] _targets, bytes[] _datas, address _origin) payable returns (bytes32[] responses)',
])

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
