const rpc=process.env.ETH_RPC_URL
export async function rpcCall(method:string,params:any[]=[]){
 if(!rpc) throw new Error('ETH_RPC_URL is not configured')
 const res=await fetch(rpc,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),cache:'no-store'})
 if(!res.ok) throw new Error(`RPC HTTP ${res.status}`)
 const json=await res.json()
 if(json.error) throw new Error(json.error.message || 'RPC error')
 return json.result
}
export async function latestBlock(){return parseInt(await rpcCall('eth_blockNumber'),16)}
