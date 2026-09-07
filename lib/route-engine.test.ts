import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {evaluateRoute, type RouteCandidate} from './route-engine'

const base:RouteCandidate={
  chainId:1,
  loanAsset:'0x0000000000000000000000000000000000000001',
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
  assert.throws(()=>evaluateRoute({...base,legs:[base.legs[0]]}))
})

test('zero loan amount is rejected',()=>{
  assert.throws(()=>evaluateRoute({...base,loanAmount:0n}))
})

test('reserve blocks marginal route',()=>{
  const result=evaluateRoute(base,0.1,0.2)
  assert.equal(result.profitable,false)
})
