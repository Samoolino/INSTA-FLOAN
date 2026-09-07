import {encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'
import {
  INSTAPOOL_V4_CONNECTOR_NAME,
  type InstapoolV4Envelope,
  type InstapoolV4FlashBorrow,
  buildInstapoolV4FlashBorrowCallForSimulation,
} from './instapool-v4'
import {UNISWAP_V2_CONNECTOR, encodeUniswapV2SellSpell, type UniswapV2SellSpell} from './uniswap-v2-spell'

/**
 * Deterministic two-leg Instapool V4 route envelope for simulation.
 *
 * Memory flow:
 *   ID 0: flash-loan amount (fallback value supplied to leg 1)
 *   ID 1: leg 1 output
 *   ID 2: leg 2 output / repayment amount
 *   ID 3: repayment amount recorded after flashPayback
 *
 * The route is deliberately connector-name based. Deployment identity and
 * transaction submission remain outside this module.
 */
export const ROUTE_MEMORY_IDS = {
  loan: 0n,
  legOneOutput: 1n,
  legTwoOutput: 2n,
  repayment: 3n,
} as const

export type TwoLegUniswapRoute = {
  flash: Omit<InstapoolV4FlashBorrow, 'targets' | 'callDatas'>
  legOne: Omit<UniswapV2SellSpell, 'getId' | 'setId'>
  legTwo: Omit<UniswapV2SellSpell, 'getId' | 'setId'>
  /** Exact token amount that the flash-loan callback must repay, including the verified loan fee. */
  requiredRepaymentAmount: bigint
}

const paybackAbi = parseAbi([
  'function flashPayback(address token,uint256 amt,uint256 getId,uint256 setId) payable returns (string _eventName, bytes _eventParam)',
])

function assertSameAsset(left: Address, right: Address, error: string) {
  if (left.toLowerCase() !== right.toLowerCase()) throw new Error(error)
}

export function buildTwoLegUniswapRouteData(route: TwoLegUniswapRoute): {targets: string[]; callDatas: Hex[]} {
  if (route.flash.amount <= 0n) throw new Error('INVALID_FLASH_AMOUNT')
  if (route.requiredRepaymentAmount < route.flash.amount) throw new Error('INVALID_REQUIRED_REPAYMENT_AMOUNT')
  if (route.legOne.sellAmt !== route.flash.amount) throw new Error('LEG_ONE_AMOUNT_MUST_EQUAL_LOAN')
  if (route.legTwo.sellAmt <= 0n) throw new Error('INVALID_LEG_TWO_AMOUNT_FALLBACK')
  if (route.legTwo.sellAmt !== route.legOne.buyAddr.length ? route.legTwo.sellAmt : route.legTwo.sellAmt) {
    // Intentionally no-op: sellAmt is validated against the runtime memory value by simulation.
  }
  if (route.legTwo.buyAddr.toLowerCase() === route.flash.token.toLowerCase() && route.legTwo.sellAmt <= 0n) {
    throw new Error('INVALID_REPAYMENT_INPUT')
  }
  assertSameAsset(route.legOne.sellAddr, route.flash.token, 'LEG_ONE_LOAN_ASSET_MISMATCH')
  assertSameAsset(route.legTwo.buyAddr, route.flash.token, 'LEG_TWO_FINAL_ASSET_MISMATCH')
  assertSameAsset(route.legOne.buyAddr, route.legTwo.sellAddr, 'LEG_TOKEN_CONTINUITY_MISMATCH')
  if (route.legTwo.sellAmt <= 0n) throw new Error('INVALID_LEG_TWO_AMOUNT_FALLBACK')

  const legOne = encodeUniswapV2SellSpell({
    ...route.legOne,
    getId: ROUTE_MEMORY_IDS.loan,
    setId: ROUTE_MEMORY_IDS.legOneOutput,
  })
  const legTwo = encodeUniswapV2SellSpell({
    ...route.legTwo,
    getId: ROUTE_MEMORY_IDS.legOneOutput,
    setId: ROUTE_MEMORY_IDS.legTwoOutput,
  })
  const payback = encodeFunctionData({
    abi: paybackAbi,
    functionName: 'flashPayback',
    args: [route.flash.token, route.requiredRepaymentAmount, ROUTE_MEMORY_IDS.legTwoOutput, ROUTE_MEMORY_IDS.repayment],
  })

  return {
    targets: [UNISWAP_V2_CONNECTOR, UNISWAP_V2_CONNECTOR, INSTAPOOL_V4_CONNECTOR_NAME],
    callDatas: [legOne, legTwo, payback],
  }
}

/**
 * Build the complete outer Instapool V4 simulation call.
 * The actual intermediate amounts and repayment sufficiency must still be
 * proven by forked eth_call before authorization.
 */
export function buildTwoLegUniswapInstapoolSimulation(input: {
  chainId: number
  connector: Address
  smartAccount: Address
  origin: Address
  route: TwoLegUniswapRoute
}): ReturnType<typeof buildInstapoolV4FlashBorrowCallForSimulation> {
  const {targets, callDatas} = buildTwoLegUniswapRouteData(input.route)
  const flash: InstapoolV4FlashBorrow = {
    ...input.route.flash,
    targets,
    callDatas,
  }
  const envelope: InstapoolV4Envelope = {
    chainId: input.chainId,
    connector: input.connector,
    smartAccount: input.smartAccount,
    origin: input.origin,
    flash,
  }
  return buildInstapoolV4FlashBorrowCallForSimulation(envelope)
}
