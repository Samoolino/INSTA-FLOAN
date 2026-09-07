import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {evaluateRoute, type RouteCandidate} from './route-engine'

const base:RouteCandidate={
  chainId:1,
  loanAsset:'A',
  loanAmount:1000000n,
  loanAmountUsd:100,
  expectedFinalAmount:1010000n,
  expectedFinalUsd:101,
  flashLoanFeeUsd:0.1,
  gasUsd:0.5,
  slippageUsd:0.2,
  legs:[
    {venue:'dex-a',chainId:1,tokenIn:'A',tokenOut:'B',amountIn:1000000n,amountOut:1100000n},
    {venue:'dex-b',chainId:1,tokenIn:'B',tokenOut:'A',amountIn:1100000n,amountOut:1010000n},
  ],
}

test('two-leg route calculates net profit after costs',()=>{
  const result=evaluateRoute(base,0.1,0.05)
  assert.equal(result.plan.grossProfitUsd,1)
  assert.equal(result.plan.netProfitUsd,0.2)
  assert.equal(result.profitable,true)
})

test('single-leg route is rejected',()=>{
  assert.throws(()=>evaluateRoute({...base,legs:[base.legs[0]]}),/ROUTE_REQUIRES_TWO_LEGS/)
})

test('zero loan amount is rejected',()=>{
  assert.throws(()=>evaluateRoute({...base,loanAmount:0n}),/INVALID_LOAN_AMOUNT/)
})

test('reserve blocks marginal route',()=>{
  const result=evaluateRoute(base,0.1,0.2)
  assert.equal(result.profitable,false)
})

test('broken token continuity is rejected',()=>{
  const legs=[base.legs[0],{...base.legs[1],tokenIn:'C'}]
  assert.throws(()=>evaluateRoute({...base,legs}),/LEG_CONTINUITY_MISMATCH/)
})

test('broken amount continuity is rejected',()=>{
  const legs=[base.legs[0],{...base.legs[1],amountIn:1n}]
  assert.throws(()=>evaluateRoute({...base,legs}),/LEG_AMOUNT_MISMATCH/)
})

test('loan asset must close the route',()=>{
  const legs=[base.legs[0],{...base.legs[1],tokenOut:'C'}]
  assert.throws(()=>evaluateRoute({...base,legs}),/FINAL_ASSET_PATH_MISMATCH/)
})
