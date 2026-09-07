export type Strategy={id:string;name:string;source:string;mode:'flash'|'borrow';chains:string;guard:string}
export const strategies:Strategy[]=[
{id:'aave-v3',name:'Aave V3 flash liquidity',source:'Aave V3',mode:'flash',chains:'Ethereum / L2s',guard:'atomic repayment + net profit'},
{id:'morpho',name:'Morpho liquidity',source:'Morpho',mode:'borrow',chains:'supported deployments',guard:'LLTV + oracle + health factor'},
{id:'spark',name:'Spark liquidity',source:'Spark',mode:'borrow',chains:'supported deployments',guard:'collateral + liquidation buffer'},
{id:'compound',name:'Compound III',source:'Compound',mode:'borrow',chains:'supported deployments',guard:'collateral factor + reserve'},
{id:'sky',name:'Sky / Maker liquidity',source:'Sky / Maker',mode:'borrow',chains:'supported deployments',guard:'debt ceiling + collateralization'},
{id:'euler',name:'Euler liquidity',source:'Euler',mode:'borrow',chains:'supported deployments',guard:'market risk + liquidation buffer'},
{id:'balancer',name:'Balancer flash loan',source:'Balancer',mode:'flash',chains:'supported deployments',guard:'single-tx repayment + gas'},
{id:'uniswap-v2',name:'Uniswap V2 flash swap',source:'Uniswap V2',mode:'flash',chains:'supported deployments',guard:'pair invariant + repayment'}
]