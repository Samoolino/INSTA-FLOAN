import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {quoteAndEvaluateV2RoundTrip} from './v2-roundtrip'

test('invalid first RPC fails closed before route evaluation',async()=>{
 await assert.rejects(()=>quoteAndEvaluateV2RoundTrip({
  first:{rpcUrl:'',chain:{id:1,name:'test',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['http://localhost']}}} as never,router:'0x0000000000000000000000000000000000000001',path:['0x0000000000000000000000000000000000000001','0x0000000000000000000000000000000000000002'],amountIn:1n},
  second:{rpcUrl:'',chain:{id:1,name:'test',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['http://localhost']}}} as never,router:'0x0000000000000000000000000000000000000002',path:['0x0000000000000000000000000000000000000002','0x0000000000000000000000000000000000000001']},
  route:{chainId:1,loanAsset:'0x0000000000000000000000000000000000000001',loanAmount:1n,loanAmountUsd:1,flashLoanFeeUsd:0,gasUsd:0,slippageUsd:0,finalAmountUsd:1},minNetProfitUsd:0.1,safetyReserveUsd:0
 }),/RPC_NOT_CONFIGURED/)
})
