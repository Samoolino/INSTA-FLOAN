import {encodeFunctionData, parseAbi, type Address, type Hex} from 'viem'

/**
 * Authoritative Instadapp Uniswap V2 connector spell.
 *
 * Verified against Instadapp/dsa-connectors at commit
 * a8e806796064f8012c0896b641e93c14b0c242e1:
 * ConnectV2UniswapV2.sell(address,address,uint256,uint256,uint256,uint256)
 *
 * The spell is addressed by connector name through DSA cast(); this module
 * encodes only the connector calldata. Deployment resolution is deliberately
 * kept outside this encoder and must be independently verified before use.
 */
export const UNISWAP_V2_CONNECTOR = 'UNISWAP-V2-A' as const
export const UNISWAP_V2_SOURCE_COMMIT = 'a8e806796064f8012c0896b641e93c14b0c242e1' as const

export type UniswapV2SellSpell = {
  buyAddr: Address
  sellAddr: Address
  sellAmt: bigint
  unitAmt: bigint
  getId: bigint
  setId: bigint
}

const sellAbi = parseAbi([
  'function sell(address buyAddr,address sellAddr,uint256 sellAmt,uint256 unitAmt,uint256 getId,uint256 setId) payable returns (string _eventName, bytes _eventParam)',
])

export function encodeUniswapV2SellSpell(input: UniswapV2SellSpell): Hex {
  if (!input.buyAddr || !input.sellAddr) throw new Error('MISSING_UNISWAP_V2_TOKEN')
  if (input.sellAmt <= 0n) throw new Error('INVALID_UNISWAP_V2_SELL_AMOUNT')
  if (input.unitAmt <= 0n) throw new Error('INVALID_UNISWAP_V2_UNIT_AMOUNT')
  if (input.getId < 0n || input.setId < 0n) throw new Error('INVALID_UNISWAP_V2_MEMORY_ID')

  return encodeFunctionData({
    abi: sellAbi,
    functionName: 'sell',
    args: [input.buyAddr, input.sellAddr, input.sellAmt, input.unitAmt, input.getId, input.setId],
  })
}

export function buildUniswapV2SellCastTarget(input: UniswapV2SellSpell): {target: typeof UNISWAP_V2_CONNECTOR, data: Hex} {
  return {
    target: UNISWAP_V2_CONNECTOR,
    data: encodeUniswapV2SellSpell(input),
  }
}
