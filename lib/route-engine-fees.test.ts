import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {evaluateRoute, type RouteCandidate} from './route-engine'

const route:RouteCandidate={
  chainId:1,
  loanAsset:'A',
  loanAmount:1000000n,
  loanAmountUsd:100,
  expectedFinalAmount:1010000n,
  expectedFinalUsd:101,
  flashLoanFeeUsd:0.1,
  gasUsd:0.5,
  slippageUsd:0.2,
  protocolFeeUsd:0.1,
  legs:[
    {venue:'dex-a',chainId:1,tokenIn:'A',tokenOut:'B',amountIn:1000000n,amountOut:1100000n,feeUsd:0.2},
    {venue:'dex-b',chainId:1,tokenIn:'B',tokenOut:'A',amountIn:1100000n,amountOut:1010000n,feeUsd:0.3},
  ],
}

test('route economics includes every explicit DEX leg fee',()=>{
  const result=evaluateRoute(route,0.05,0.05)
  assert.equal(result.plan.swapCostUsd,0.5)
  assert.equal(result.plan.netProfitUsd,-0.4)
  assert.equal(result.profitable,false)
})

test('negative DEX leg fee is rejected',()=>{
  const legs=[{...route.legs[0],feeUsd:-0.01},route.legs[1]]
  assert.throws(()=>evaluateRoute({...route,legs},0.05,0.05),/INVALID_LEG_FEE/)
})

test('zero DEX fees remain explicitly modeled rather than omitted',()=>{
  const legs=route.legs.map(leg=>({...leg,feeUsd:0}))
  const result=evaluateRoute({...route,legs},0.05,0.05)
  assert.equal(result.plan.swapCostUsd,0)
  assert.equal(result.plan.netProfitUsd,0.1)
})
