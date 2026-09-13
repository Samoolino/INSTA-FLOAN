# Hummingbot bridge worker

This directory defines the persistent CEX↔DEX bridge for INSTA-FLOAN. Do **not** run Hummingbot inside Vercel. Vercel remains the web/control plane; Hummingbot + Gateway run on a persistent worker/VPS/local machine.

## Install

Use the official Hummingbot installation path:

```bash
git clone https://github.com/hummingbot/hummingbot.git
cd hummingbot
make setup
make deploy
make link-cli
hbot --version
```

Gateway is enabled during setup for DEX workflows. Current Hummingbot releases document Docker images `hummingbot/hummingbot:latest` and `hummingbot/gateway:latest`. Pin a tested version for production after controlled-fork validation rather than relying indefinitely on `latest`.

## Configure the four primary EVM networks

Map the Hummingbot/Gateway RPCs to the same network identities used by INSTA-FLOAN:

```text
Ethereum   1
Arbitrum   42161
Base       8453
BSC        56
```

INSTA-FLOAN's route registry remains authoritative for verified contract/token routes.

## CEX connector set

Start with connectors that are currently documented by Hummingbot:

```text
binance
gate_io
okx
kucoin
bybit
bitget
mexc
coinbase
kraken
```

Only enable a connector after its API credentials are verified and the exact token/network relationship is known. Hummingbot documents CLOB connectors for these exchanges and supports both REST/WebSocket market connectivity and order execution.

## Credentials

CEX credentials belong inside Hummingbot's encrypted credential store. Use read + trade permissions only. Do not enable withdrawal permissions. INSTA-FLOAN receives connector health/availability and market observations, not raw API secrets.

For exchanges requiring passphrases (for example OKX/KuCoin), Hummingbot's credential workflow handles the exchange-specific fields.

## DEX side

Gateway provides the DEX middleware. The current Hummingbot Gateway connector set includes Uniswap on Ethereum and PancakeSwap on BNB Chain, with other connectors available depending on the current Gateway release/migration state.

For INSTA-FLOAN, DEX route activation still requires:

```text
RPC reachable
+ router/pool verified
+ token mapping verified
+ fresh quote
+ executable liquidity
+ route simulation
= ACTIVE DEX ROUTE
```

## CEX↔DEX opportunity flow

```text
CEX order books ──────┐
                      ├─> INSTA-FLOAN opportunity graph
DEX Gateway quotes ───┘          |
                                 +-> CEX BUY / DEX SELL
                                 +-> DEX BUY / CEX SELL
                                 +-> size + fees + gas + slippage
                                 +-> net profit
                                 +-> controlled-fork simulation
                                 +-> explicit authorization
```

The bridge does not itself authorize a flash-loan transaction.

## BSC example

A BSC token may be observed as:

```text
PancakeSwap(BSC)  -> on-chain quote
Binance           -> token/USDT order book
Gate.io           -> token/USDT order book
MEXC              -> token/USDT order book
```

The engine should compare executable prices after converting through the correct token/USDT or token/USDC relationship. A price difference is only actionable if the CEX can actually trade the asset and the DEX route can actually execute it at the required size.

## Security boundary

```text
Browser -> INSTA-FLOAN API -> Hummingbot API -> Hummingbot/Gateway
                                   |
                                   +-> encrypted CEX credentials
                                   +-> DEX wallet/Gateway credentials
```

Never expose CEX API secrets through `NEXT_PUBLIC_*` variables or the browser.

## Current production gate

The bridge is discovery/quote/simulation infrastructure until all INSTA-FLOAN execution gates pass. Current defaults remain:

```text
HUMMINGBOT_BRIDGE_ENABLED=false
HUMMINGBOT_LIVE_TRADING_ENABLED=false
HUMMINGBOT_EXECUTION_AUTHORIZED=false
LIVE_EXECUTION=false
REQUIRE_CONTROLLED_FORK_ATTESTATION=true
REQUIRE_EXPLICIT_EXECUTION_AUTHORIZATION=true
```
