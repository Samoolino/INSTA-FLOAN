# INSTA-FLOAN — Hummingbot CEX↔DEX Bridge

## Purpose

INSTA-FLOAN remains the control plane and flash-liquidity/risk layer. Hummingbot is an execution/data bridge for CEX order books and Gateway DEX routes. The bridge must never bypass INSTA-FLOAN execution truth, controlled-fork validation, profitability gates, explicit authorization, or the kill switch.

Hummingbot Gateway provides standardized DEX interfaces and Hummingbot connectors provide standardized CEX/DEX market-data and order interfaces. Current Hummingbot documentation confirms Gateway supports Ethereum/BSC DEX connectors including Uniswap and PancakeSwap, while Hummingbot strategies can compare CEX and DEX markets. citeturn0search0turn1search2turn1search5

## Network/venue topology

```text
                         INSTA-FLOAN CONTROL PLANE
                                   |
             +---------------------+---------------------+
             |                                           |
       Flash liquidity                              Hummingbot bridge
       + risk gates                                      |
             |                         +----------------+----------------+
       Aave/Morpho/...                 |                                 |
             |                     CEX connectors                    Gateway
             |                 Binance/Gate/OKX/...             Uniswap/Pancake...
             |                     |                                 |
             +---------------------+---------------+-----------------+
                                                   |
                                         opportunity graph
                                                   |
                                  token × chain × venue × time
```

The five primary EVM networks in the current INSTA-FLOAN plan are:

- Ethereum — chain 1
- Arbitrum — chain 42161
- Base — chain 8453
- BSC — chain 56
- additional registered networks remain eligible only when their RPC, venue route and liquidity coverage are independently verified.

Hummingbot's current RPC documentation explicitly lists Ethereum, Arbitrum, Base and BSC among supported Ethereum-family networks. citeturn0search6

## CEX→DEX opportunity model

A CEX does **not** need to expose the same blockchain venue as a DEX. The bridge uses the network/asset mapping as the settlement boundary.

Example:

```text
BSC token ABC
      |
      +--> PancakeSwap BSC quote
      |
      +--> Binance ABC/USDT order book
      |
      +--> Gate ABC/USDT order book
      |
      +--> OKX ABC/USDT order book
```

The opportunity engine computes both directions:

```text
CEX BUY  -> DEX SELL
DEX BUY  -> CEX SELL
```

and, for each candidate, models:

```text
gross spread
- CEX fee
- DEX fee
- flash-loan fee (when used)
- gas
- slippage / price impact
- bridge/settlement cost when applicable
- reserve
= net executable profit
```

A displayed price difference is **not** an opportunity until the executable size, balances, quote age and complete transaction path are validated.

Hummingbot's XEMM strategy already documents CEX↔DEX operation through Gateway, with the DEX used as a taker/hedge venue. Its AMM arbitrage strategy also targets price differences between AMM DEXs and other exchanges. citeturn1search0turn1search2

## Credential architecture

Never place CEX API keys or secrets in `NEXT_PUBLIC_*` variables, browser local storage, source control, or ordinary Vercel client configuration.

Recommended boundary:

```text
Browser
  |
  | connector selection only
  v
INSTA-FLOAN API
  |
  | authenticated bridge request
  v
Hummingbot API / Hummingbot instance
  |
  +--> encrypted CEX credentials
  +--> Gateway wallet credentials
```

Hummingbot's official credential workflow stores API/private credentials encrypted on the local machine and recommends read+trade access without withdrawal permissions. citeturn0search8turn0search11

For multiple CEX accounts, use Hummingbot account/credential profiles rather than a single universal secret:

```text
master_account
  ├── binance
  ├── gate_io
  ├── okx
  └── kucoin

hedge_account
  ├── binance
  └── gate_io
```

The INSTA-FLOAN frontend should display connection status and credential **presence**, never reveal the secret.

## Venue activation contract

A CEX/DEX venue becomes `ACTIVE` only when:

1. connector is configured;
2. network/chain mapping is valid;
3. token mapping is valid;
4. connector health is positive;
5. a fresh quote/order-book snapshot is available;
6. executable size is known;
7. required balance/liquidity is available;
8. estimated total cost is known;
9. the route survives simulation/risk gates.

Otherwise it remains `CONFIGURED`, `STALE`, `BLOCKED`, or `UNAVAILABLE`.

## Hummingbot bridge installation

Hummingbot's current official installation recommends Docker and `make setup`, `make deploy`, and `make link-cli`; Gateway is enabled alongside the client for DEX trading. citeturn2search0turn2search1

The persistent bridge should run outside Vercel:

```bash
# on a persistent Linux/VPS worker
 git clone https://github.com/hummingbot/hummingbot.git
 cd hummingbot
 make setup
 make deploy
 make link-cli
```

Gateway should be enabled for DEX access. Current official documentation uses `hummingbot/gateway:latest` and port `15888`; production Gateway should use HTTPS/certificates rather than development HTTP. citeturn2search1turn2search2

## INSTA-FLOAN integration boundary

```text
Hummingbot/Gateway
  -> market observations / candidate execution quote
  -> INSTA-FLOAN opportunity engine
  -> profitability + liquidity + simulation
  -> explicit authorization
  -> execution adapter
```

Hummingbot must not independently decide that an INSTA-FLOAN flash-loan transaction is authorized. INSTA-FLOAN remains the final execution authority.

## Current safety defaults

```text
AUTOMATION_ENABLED=false
AUTONOMOUS_SUBMISSION=false
INCLUSION_INCENTIVE_ENABLED=false
MAX_ADDITIONAL_GAS_USD=0
MAX_INCLUSION_INCENTIVE_USD=0
REQUIRE_CONTROLLED_FORK_ATTESTATION=true
REQUIRE_EXPLICIT_EXECUTION_AUTHORIZATION=true
FLASHBOTS_SUBMISSION_ENABLED=false
GELATO_AUTOMATION_ENABLED=false
CHAINLINK_AUTOMATION_ENABLED=false
LIVE_EXECUTION=false
```

The bridge can therefore be installed, connected, scanned and used for paper/simulation workflows without turning on real-money autonomous submission.

## Frontend redesign

The dashboard should add three panels:

### CEX accounts

Each connector shows:

```text
Binance       CONNECTED / BLOCKED
Gate.io       CONNECTED / BLOCKED
OKX           CONNECTED / BLOCKED
KuCoin        CONNECTED / BLOCKED
```

Never show API secrets.

### DEX/Gateway networks

```text
Ethereum      Gateway ONLINE / OFFLINE
Arbitrum      Gateway ONLINE / OFFLINE
Base          Gateway ONLINE / OFFLINE
BSC           Gateway ONLINE / OFFLINE
```

### Cross-venue opportunities

Every row should show:

```text
CHAIN
TOKEN PAIR
BUY VENUE
SELL VENUE
EXECUTABLE SIZE
GROSS SPREAD
TOTAL COST
NET PROFIT
QUOTE AGE
RISK STATUS
SIMULATION STATUS
```

The UI should distinguish `PRICE DIFFERENCE` from `EXECUTABLE OPPORTUNITY`.

## Operational commands exposed by the bridge

```text
DISCOVER_CEX
DISCOVER_DEX
VERIFY_NETWORK
VERIFY_TOKEN_MAPPING
REFRESH_CEX_BOOKS
REFRESH_DEX_QUOTES
BUILD_CEX_DEX_MATRIX
CALCULATE_NET_PROFIT
SIMULATE_ROUTE
ROTATE_STALE_ROUTE
STOP_BRIDGE
```

No command in this bridge should implicitly authorize production execution.
