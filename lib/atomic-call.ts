import {encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'
import {type RouteCandidate} from './route-engine'

export type AtomicCallConfig = {
  executor: Address
  route: RouteCandidate
  calldata: Hex
  value?: bigint
}

export type AtomicCall = {
  from: Address
  to: Address
  data: Hex
  value?: bigint
}

const abi = parseAbi(['function executeRoute(bytes routeData)'])

/**
 * Builds an executor call envelope only. It does not sign or submit a transaction.
 * The executor calldata remains an opaque protocol-specific payload until the
 * verified flash-loan/executor contract interface is selected.
 */
export function buildAtomicCall(config: AtomicCallConfig): AtomicCall {
  if (!config.executor) throw new Error('MISSING_EXECUTOR')
  if (!config.calldata || config.calldata === '0x') throw new Error('MISSING_ROUTE_CALLDATA')
  if (config.route.legs.length < 2) throw new Error('ROUTE_REQUIRES_TWO_LEGS')

  const data = encodeFunctionData({abi, functionName:'executeRoute', args:[config.calldata]})
  return {from:config.executor,to:config.executor,data,...(config.value !== undefined ? {value:config.value} : {})}
}
