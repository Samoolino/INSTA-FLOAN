import {encodeAbiParameters, encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'
import {buildInstadappCastCall, type InstadappSimulationCall} from './instadapp-adapter'
import {assertInstapoolV4Deployment} from './instapool-v4-config'

/**
 * Verified against Instadapp's dsa-connectors Instapool-v4 source:
 * flashBorrowAndCast(address,uint256,uint256,bytes,bytes)
 *
 * The connector decodes `data` as (string[] targets, bytes[] callDatas)
 * and internally invokes the Smart Account cast(string[],bytes[],address).
 *
 * The connector is selected from the chain-specific deployment registry.
 * Arbitrary connector addresses are rejected at this boundary.
 */
export type InstapoolV4FlashBorrow = {
  token: Address
  amount: bigint
  route: bigint
  targets: string[]
  callDatas: Hex[]
  extraData?: Hex
}

export type InstapoolV4Envelope = {
  chainId: number
  connector: Address
  smartAccount: Address
  origin: Address
  flash: InstapoolV4FlashBorrow
}

export type InstapoolV4SimulationCall = InstadappSimulationCall

const flashAbi = parseAbi([
  'function flashBorrowAndCast(address token,uint256 amt,uint256 route,bytes data,bytes extraData) payable returns (string _eventName, bytes _eventParam)',
])

function validate(input: InstapoolV4FlashBorrow) {
  if (input.amount <= 0n) throw new Error('INVALID_FLASH_AMOUNT')
  if (input.targets.length === 0) throw new Error('MISSING_FLASH_TARGETS')
  if (input.targets.length !== input.callDatas.length) throw new Error('FLASH_TARGET_DATA_LENGTH_MISMATCH')
  if (input.targets.some(target => target.length === 0)) throw new Error('INVALID_FLASH_TARGET')
  if (input.callDatas.some(data => !data || data === '0x')) throw new Error('MISSING_FLASH_CALLDATA')
  if (input.route < 0n) throw new Error('INVALID_FLASH_ROUTE')
}

export function encodeInstapoolV4FlashData(input: InstapoolV4FlashBorrow): Hex {
  validate(input)
  return encodeAbiParameters(
    [
      {type: 'string[]'},
      {type: 'bytes[]'},
    ],
    [input.targets, input.callDatas],
  )
}

export function buildInstapoolV4FlashBorrowCall(input: InstapoolV4Envelope): InstadappSimulationCall {
  const verifiedConnector = assertInstapoolV4Deployment(input.chainId)
  if (verifiedConnector !== input.connector) throw new Error('INSTAPOOL_V4_CONNECTOR_MISMATCH')

  const data = encodeInstapoolV4FlashData(input.flash)
  const extraData = input.flash.extraData ?? '0x'

  const connectorData = encodeFunctionData({
    abi: flashAbi,
    functionName: 'flashBorrowAndCast',
    args: [input.flash.token, input.flash.amount, input.flash.route, data, extraData],
  })

  return buildInstadappCastCall({
    smartAccount: input.smartAccount,
    targets: [verifiedConnector],
    datas: [connectorData],
    origin: input.origin,
  })
}

/**
 * Legacy explicit gate retained for callers that have already completed
 * deployment verification. New call construction uses the chain-specific
 * registry above and cannot bypass it with an arbitrary address.
 */
export function assertInstapoolV4DeploymentVerified(verified: boolean): void {
  if (!verified) throw new Error('INSTAPOOL_V4_DEPLOYMENT_NOT_VERIFIED')
}
