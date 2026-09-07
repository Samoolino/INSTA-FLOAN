import {type Address, type Hex} from 'viem'
import {buildInstadappCastCall, type InstadappSimulationCall} from './instadapp-adapter'
import {simulateCall, type SimulationResult} from './route-simulation'

export type InstadappSimulationRequest = {
  smartAccount: Address
  targets: Address[]
  datas: Hex[]
  origin: Address
  rpcUrl: string
  expectedBlockNumber?: bigint
}

export type InstadappSimulationResult = {
  call: InstadappSimulationCall
  simulation: SimulationResult
}

/**
 * Builds the complete Smart Account cast() envelope and immediately sends that
 * exact calldata through the existing eth_call simulation boundary.
 *
 * This function never signs or broadcasts a transaction. A verified flash-loan
 * connector/module target must still be supplied by the caller; this layer does
 * not assume a production connector address or method signature.
 */
export async function simulateInstadappCast(
  request: InstadappSimulationRequest,
): Promise<InstadappSimulationResult> {
  const call = buildInstadappCastCall({
    smartAccount: request.smartAccount,
    targets: request.targets,
    datas: request.datas,
    origin: request.origin,
  })

  const simulation = await simulateCall({
    rpcUrl: request.rpcUrl,
    from: call.from,
    to: call.to,
    data: call.data,
    expectedBlockNumber: request.expectedBlockNumber,
  })

  return {call, simulation}
}
