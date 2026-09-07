export type ChainEndpoint = {name:string; chainId:number; rpcUrl:string}
export type ChainHealth = ChainEndpoint & {ok:boolean; blockNumber?:number; error?:string}

export async function checkChain(endpoint:ChainEndpoint): Promise<ChainHealth> {
  if (!endpoint.rpcUrl) return {...endpoint, ok:false, error:'RPC_NOT_CONFIGURED'}
  try {
    const response = await fetch(endpoint.rpcUrl, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_blockNumber',params:[]}),
      cache:'no-store',
    })
    if (!response.ok) return {...endpoint,ok:false,error:`RPC_HTTP_${response.status}`}
    const json = await response.json() as {result?:string;error?:{message?:string}}
    if (json.error) return {...endpoint,ok:false,error:json.error.message || 'RPC_ERROR'}
    if (!json.result) return {...endpoint,ok:false,error:'NO_BLOCK_NUMBER'}
    return {...endpoint,ok:true,blockNumber:Number.parseInt(json.result,16)}
  } catch (error) {
    return {...endpoint,ok:false,error:error instanceof Error ? error.message : 'RPC_ERROR'}
  }
}

export async function checkChains(endpoints:ChainEndpoint[]): Promise<ChainHealth[]> {
  return Promise.all(endpoints.map(checkChain))
}
