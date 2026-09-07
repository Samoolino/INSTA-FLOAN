import {strict as assert} from 'node:assert'
import {describe, it} from 'node:test'
import {decodeFunctionData, type Address, type Hex} from 'viem'
import {buildTwoLegUniswapRouteData, ROUTE_MEMORY_IDS} from './instapool-v4-route'

const TOKEN_A = '0x0000000000000000000000000000000000000001' as Address
const TOKEN_B = '0x0000000000000000000000000000000000000002' as Address
const AMOUNT = 1_000_000n

const baseRoute = () => ({
  flash: {token: TOKEN_A, amount: AMOUNT, route: 0n},
  legOne: {buyAddr: TOKEN_B, sellAddr: TOKEN_A, sellAmt: AMOUNT, unitAmt: 900_000n},
  // The connector resolves sellAmt from getId, so this value is only the
  // fallback; the actual leg-two amount is the value written to ID 1.
  legTwo: {buyAddr: TOKEN_A, sellAddr: TOKEN_B, sellAmt: 1n, unitAmt: 900_000n},
})

describe('Instapool V4 two-leg route', () => {
  it('builds the expected connector-name sequence and memory flow', () => {
    const result = buildTwoLegUniswapRouteData(baseRoute())
    assert.deepEqual(result.targets, ['UNISWAP-V2-A', 'UNISWAP-V2-A', 'Instapool-v4'])
    assert.equal(result.callDatas.length, 3)

    const legOne = decodeFunctionData({abi: [{type: 'function', name: 'sell', stateMutability: 'payable', inputs: [
      {name: 'buyAddr', type: 'address'}, {name: 'sellAddr', type: 'address'}, {name: 'sellAmt', type: 'uint256'},
      {name: 'unitAmt', type: 'uint256'}, {name: 'getId', type: 'uint256'}, {name: 'setId', type: 'uint256'}
    ], outputs: [{name: '_eventName', type: 'string'}, {name: '_eventParam', type: 'bytes'}]}], data: result.callDatas[0] as Hex})
    assert.equal(legOne.args?.[2], AMOUNT)
    assert.equal(legOne.args?.[4], ROUTE_MEMORY_IDS.loan)
    assert.equal(legOne.args?.[5], ROUTE_MEMORY_IDS.legOneOutput)

    const legTwo = decodeFunctionData({abi: [{type: 'function', name: 'sell', stateMutability: 'payable', inputs: [
      {name: 'buyAddr', type: 'address'}, {name: 'sellAddr', type: 'address'}, {name: 'sellAmt', type: 'uint256'},
      {name: 'unitAmt', type: 'uint256'}, {name: 'getId', type: 'uint256'}, {name: 'setId', type: 'uint256'}
    ], outputs: [{name: '_eventName', type: 'string'}, {name: '_eventParam', type: 'bytes'}]}], data: result.callDatas[1] as Hex})
    assert.equal(legTwo.args?.[4], ROUTE_MEMORY_IDS.legOneOutput)
    assert.equal(legTwo.args?.[5], ROUTE_MEMORY_IDS.legTwoOutput)

    const payback = decodeFunctionData({abi: [{type: 'function', name: 'flashPayback', stateMutability: 'payable', inputs: [
      {name: 'token', type: 'address'}, {name: 'amt', type: 'uint256'}, {name: 'getId', type: 'uint256'}, {name: 'setId', type: 'uint256'}
    ], outputs: [{name: '_eventName', type: 'string'}, {name: '_eventParam', type: 'bytes'}]}], data: result.callDatas[2] as Hex})
    assert.equal(payback.args?.[0], TOKEN_A)
    assert.equal(payback.args?.[2], ROUTE_MEMORY_IDS.legTwoOutput)
    assert.equal(payback.args?.[3], ROUTE_MEMORY_IDS.repayment)
  })

  it('rejects a broken token path', () => {
    assert.throws(() => buildTwoLegUniswapRouteData({
      ...baseRoute(),
      legTwo: {...baseRoute().legTwo, sellAddr: '0x0000000000000000000000000000000000000003' as Address},
    }), /LEG_TOKEN_CONTINUITY_MISMATCH/)
  })

  it('rejects a leg-one amount different from the loan', () => {
    assert.throws(() => buildTwoLegUniswapRouteData({
      ...baseRoute(),
      legOne: {...baseRoute().legOne, sellAmt: AMOUNT + 1n},
    }), /LEG_ONE_LOAN_ASSET_MISMATCH|INVALID_UNISWAP_V2_SELL_AMOUNT/)
  })
})
