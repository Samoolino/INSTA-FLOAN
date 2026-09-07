import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {decodeFunctionData} from 'viem'
import {buildUniswapV2SellCastTarget, encodeUniswapV2SellSpell, UNISWAP_V2_CONNECTOR} from './uniswap-v2-spell'

const tokenA='0x0000000000000000000000000000000000000001' as `0x${string}`
const tokenB='0x0000000000000000000000000000000000000002' as `0x${string}`

const valid={
  buyAddr:tokenB,
  sellAddr:tokenA,
  sellAmt:1000000n,
  unitAmt:990000000000000000n,
  getId:7n,
  setId:8n,
}

test('Uniswap V2 spell encodes the authoritative sell signature',()=>{
  const data=encodeUniswapV2SellSpell(valid)
  const decoded=decodeFunctionData({abi:[{
    type:'function',name:'sell',stateMutability:'payable',inputs:[
      {name:'buyAddr',type:'address'},{name:'sellAddr',type:'address'},{name:'sellAmt',type:'uint256'},
      {name:'unitAmt',type:'uint256'},{name:'getId',type:'uint256'},{name:'setId',type:'uint256'},
    ],outputs:[{name:'_eventName',type:'string'},{name:'_eventParam',type:'bytes'}]
  }],data})
  assert.equal(decoded.functionName,'sell')
  assert.deepEqual(decoded.args, [tokenB,tokenA,1000000n,990000000000000000n,7n,8n])
})

test('Uniswap V2 sell spell rejects zero sell amount',()=>assert.throws(()=>encodeUniswapV2SellSpell({...valid,sellAmt:0n}),/INVALID_UNISWAP_V2_SELL_AMOUNT/))
test('Uniswap V2 sell spell rejects zero unit amount',()=>assert.throws(()=>encodeUniswapV2SellSpell({...valid,unitAmt:0n}),/INVALID_UNISWAP_V2_UNIT_AMOUNT/))
test('Uniswap V2 sell spell rejects invalid memory ids',()=>assert.throws(()=>encodeUniswapV2SellSpell({...valid,getId:-1n}),/INVALID_UNISWAP_V2_MEMORY_ID/))
test('Uniswap V2 cast target uses the verified connector name',()=>{
 const call=buildUniswapV2SellCastTarget(valid)
 assert.equal(call.target,UNISWAP_V2_CONNECTOR)
 assert.notEqual(call.data,'0x')
})
