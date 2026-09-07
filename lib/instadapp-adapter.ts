import {encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'

/**
 * Conservative Instadapp DSL boundary.
 *
 * Current official Instadapp documentation confirms that Smart Accounts route
 * extension functions through their fallback and that composable execution is
 * performed through `cast()`. The exact production Flash Loan Module signature
 * and deployment addresses must be verified against the selected chain/module
 * before this adapter is enabled for execution.
 */
export type InstadappCastCall = {
  smartAccount: Address
  module: Address
  payload: Hex
}

export type InstadappSimulationCall = {
  from: Address
  to: Address
  data: Hex
}

const conservativeAbi = parseAbi(['function cast(bytes data)'])

export function buildInstadappCastCall(input: InstadappCastCall): InstadappSimulationCall {
  if (!input.smartAccount) throw new Error('MISSING_SMART_ACCOUNT')
  if (!input.module) throw new Error('MISSING_INSTDAPP_MODULE')
  if (!input.payload || input.payload === '0x') throw new Error('MISSING_CAST_PAYLOAD')

  return {
    from: input.smartAccount,
    to: input.smartAccount,
    data: encodeFunctionData({abi: conservativeAbi, functionName:'cast', args:[input.payload]}),
  }
}

export function assertInstadappExecutionReady(): never {
  throw new Error('INSTADAPP_EXECUTION_INTERFACE_REQUIRES_VERIFIED_MODULE_SIGNATURE_AND_DEPLOYMENT')
}
