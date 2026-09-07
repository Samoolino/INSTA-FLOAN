import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {buildRoundTrip} from './route-builder'

test('composes exact two-leg round trip with explicit DEX fees',()=>{
  const route=buildRoundTrip(
    {venue:'dex-a',chainId:1,tokenIn:'0xA',tokenOut:'0xB',amountIn:1000n,amountOut:1200n,feeUsd:0.4},
    {venue:'dex-b',chainId:1,tokenIn:'0xB',tokenOut:'0xA',amountIn:1200n,amountOut:1030n,feeUsd:0.3},
    {chainId:1,loanAsset:'0xA',loanAmount:1000n,loanAmountUsd:1000,flashLoanFeeUsd:1,gasUsd:3,slippageUsd:1,finalAmountUsd:1030}
  )
  assert.equal(route.expectedFinalAmount,1030n)
  assert.equal(route.legs[1].amountIn,route.legs[0].amountOut)
  assert.equal(route.legs[0].feeUsd,0.4)
  assert.equal(route.legs[1].feeUsd,0.3)
})

test('rejects broken token continuity',()=>{
  assert.throws(()=>buildRoundTrip(
    {venue:'dex-a',chainId:1,tokenIn:'0xA',tokenOut:'0xB',amountIn:1000n,amountOut:1200n,feeUsd:0},
    {venue:'dex-b',chainId:1,tokenIn:'0xC',tokenOut:'0xA',amountIn:1200n,amountOut:1030n,feeUsd:0},
    {chainId:1,loanAsset:'0xA',loanAmount:1000n,loanAmountUsd:1000,flashLoanFeeUsd:1,gasUsd:3,slippageUsd:1,finalAmountUsd:1030}
  ),/QUOTE_TOKEN_CONTINUITY_MISMATCH/)
})

test('rejects stale amount handoff',()=>{
  assert.throws(()=>buildRoundTrip(
    {venue:'dex-a',chainId:1,tokenIn:'0xA',tokenOut:'0xB',amountIn:1000n,amountOut:1200n,feeUsd:0},
    {venue:'dex-b',chainId:1,tokenIn:'0xB',tokenOut:'0xA',amountIn:1199n,amountOut:1030n,feeUsd:0},
    {chainId:1,loanAsset:'0xA',loanAmount:1000n,loanAmountUsd:1000,flashLoanFeeUsd:1,gasUsd:3,slippageUsd:1,finalAmountUsd:1030}
  ),/SECOND_LEG_AMOUNT_MISMATCH/)
})

test('rejects missing or negative DEX fees',()=>{
  const second={venue:'dex-b',chainId:1,tokenIn:'0xB',tokenOut:'0xA',amountIn:1200n,amountOut:1030n,feeUsd:0}
  assert.throws(()=>buildRoundTrip(
    {venue:'dex-a',chainId:1,tokenIn:'0xA',tokenOut:'0xB',amountIn:1000n,amountOut:1200n,feeUsd:-1},
    second,
    {chainId:1,loanAsset:'0xA',loanAmount:1000n,loanAmountUsd:1000,flashLoanFeeUsd:1,gasUsd:3,slippageUsd:1,finalAmountUsd:1030}
  ),/INVALID_FIRST_LEG_FEE/)
})
