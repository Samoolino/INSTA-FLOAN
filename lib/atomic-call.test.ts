import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {buildAtomicCall} from './atomic-call'

const address='0x0000000000000000000000000000000000000001' as `0x${string}`
const route={chainId:1,loanAsset:address,loanAmount:1n,loanAmountUsd:1,expectedFinalAmount:2n,expectedFinalUsd:2,flashLoanFeeUsd:0,gasUsd:0,slippageUsd:0,protocolFeeUsd:0,legs:[{venue:'A',chainId:1,tokenIn:address,tokenOut:'0x0000000000000000000000000000000000000002',amountIn:1n,amountOut:2n,feeUsd:0},{venue:'B',chainId:1,tokenIn:'0x0000000000000000000000000000000000000002',tokenOut:address,amountIn:2n,amountOut:2n,feeUsd:0}]}

test('atomic call rejects missing executor',()=>assert.throws(()=>buildAtomicCall({executor:'' as `0x${string}`,route,calldata:'0x01'}),/MISSING_EXECUTOR/))
test('atomic call rejects empty route calldata',()=>assert.throws(()=>buildAtomicCall({executor:address,route,calldata:'0x'}),/MISSING_ROUTE_CALLDATA/))
test('atomic call encodes executor envelope without submission',()=>{
 const call=buildAtomicCall({executor:address,route,calldata:'0x1234'})
 assert.equal(call.from,address)
 assert.equal(call.to,address)
 assert.notEqual(call.data,'0x')
})
