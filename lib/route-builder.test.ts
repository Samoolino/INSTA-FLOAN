import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {buildRoundTrip} from './route-builder'

test('composes exact two-leg round trip',()=>{
  const route=buildRoundTrip(
    {venue:'dex-a',chainId:1,tokenIn:'0xA',tokenOut:'0xB',amountIn:1000n,amountOut:1200n},
    {venue:'dex-b',chainId:1,tokenIn:'0xB',tokenOut:'0xA',amountIn:1200n,amountOut:1030n},
    {chainId:1,loanAsset:'0xA',loanAmount:1000n,loanAmountUsd:1000,flashLoanFeeUsd:1,gasUsd:3,slippageUsd:1,finalAmountUsd:1030}
  )
  assert.equal(route.expectedFinalAmount,1030n)
  assert.equal(route.legs[1].amountIn,route.legs[0].amountOut)
})

test('rejects broken token continuity',()=>{
  assert.throws(()=>buildRoundTrip(
    {venue:'dex-a',chainId:1,tokenIn:'0xA',tokenOut:'0xB',amountIn:1000n,amountOut:1200n},
    {venue:'dex-b',chainId:1,tokenIn:'0xC',tokenOut:'0xA',amountIn:1200n,amountOut:1030n},
    {chainId:1,loanAsset:'0xA',loanAmount:1000n,loanAmountUsd:1000,flashLoanFeeUsd:1,gasUsd:3,slippageUsd:1,finalAmountUsd:1030}
  ),/QUOTE_TOKEN_CONTINUITY_MISMATCH/)
})

test('rejects stale amount handoff',()=>{
  assert.throws(()=>buildRoundTrip(
    {venue:'dex-a',chainId:1,tokenIn:'0xA',tokenOut:'0xB',amountIn:1000n,amountOut:1200n},
    {venue:'dex-b',chainId:1,tokenIn:'0xB',tokenOut:'0xA',amountIn:1199n,amountOut:1030n},
    {chainId:1,loanAsset:'0xA',loanAmount:1000n,loanAmountUsd:1000,flashLoanFeeUsd:1,gasUsd:3,slippageUsd:1,finalAmountUsd:1030}
  ),/SECOND_LEG_AMOUNT_MISMATCH/)
})
