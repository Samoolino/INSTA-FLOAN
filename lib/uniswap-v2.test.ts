import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {quoteUniswapV2} from './uniswap-v2'

test('quote adapter rejects missing RPC', async()=>{
  await assert.rejects(
    quoteUniswapV2({
      rpcUrl:'',
      chain:{id:1,name:'test',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['http://localhost']}}} as never,
      router:'0x0000000000000000000000000000000000000001',
      path:['0x0000000000000000000000000000000000000001','0x0000000000000000000000000000000000000002'],
      amountIn:1n,
    }),
    /RPC_NOT_CONFIGURED/
  )
})

test('quote adapter rejects invalid path', async()=>{
  await assert.rejects(
    quoteUniswapV2({
      rpcUrl:'https://example.invalid',
      chain:{id:1,name:'test',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['http://localhost']}}} as never,
      router:'0x0000000000000000000000000000000000000001',
      path:['0x0000000000000000000000000000000000000001'],
      amountIn:1n,
    }),
    /INVALID_SWAP_PATH/
  )
})

test('quote adapter rejects zero input', async()=>{
  await assert.rejects(
    quoteUniswapV2({
      rpcUrl:'https://example.invalid',
      chain:{id:1,name:'test',nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:['http://localhost']}}} as never,
      router:'0x0000000000000000000000000000000000000001',
      path:['0x0000000000000000000000000000000000000001','0x0000000000000000000000000000000000000002'],
      amountIn:0n,
    }),
    /INVALID_AMOUNT_IN/
  )
})
