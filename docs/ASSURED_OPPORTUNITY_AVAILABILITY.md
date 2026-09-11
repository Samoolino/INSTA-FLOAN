# Assured Opportunity Availability Procedure

## Purpose

The system must distinguish **market opportunity availability** from **transaction execution**. A visible quote is not an executable trade. An opportunity becomes executable only after every required control gate passes.

## Opportunity lifecycle

`DISCOVER → ACCESS → NORMALIZE → GRAPH → PRICE → PROFIT TEST → RISK TEST → SIMULATE → ATTEST → AUTHORIZE → EXECUTE → RECONCILE`

### 1. Discover

Continuously query every configured venue/route using the approved live quote adapters. A venue is not considered active merely because it is configured.

Required evidence:
- chain/RPC reachable;
- venue/router reachable;
- token pair valid;
- quote timestamp fresh;
- quote amounts and gas/slippage fields valid.

### 2. Access

Access is established through the appropriate integration boundary:

- direct on-chain RPC/router calls for deterministic market reads;
- official venue APIs where required for off-chain order books;
- approved third-party adapters where a venue cannot be queried directly;
- MCP only as an orchestration/readiness interface, never as the financial source of truth;
- GitHub/Vercel integrations for deployment and operational configuration, not trade authorization.

Third-party or GitHub Apps must receive only the minimum permissions required. Installation access is explicitly scoped to the repository/resources needed by the integration.

### 3. Normalize and validate

Normalize all quotes into the common `Quote` model. Reject malformed, stale, missing, or inconsistent data. Never synthesize a quote to fill a gap.

### 4. Build opportunity graph

Join fresh quotes to enabled flash-liquidity/funded-asset coverage. Track venue, chain, token-in, token-out, lender and liquidity capacity. Missing venue coverage remains a coverage failure, not an executable opportunity.

### 5. Calculate economics

For each candidate:

`net = gross return - gas - slippage - venue/loan/bridge/settlement costs`

Only positive-net candidates above `MIN_NET_PROFIT_USD` and safety reserve requirements remain eligible.

### 6. Risk gate

Check liquidity capacity, maximum path/cycle limits, quote freshness, slippage, gas, reserve requirements and configured risk limits.

### 7. Simulation gate

Revalidate the exact route immediately before execution and simulate the complete transaction path, including flash-loan repayment. Controlled-fork validation must attest the same route/contract assumptions before production authorization.

### 8. Authorization gate

Production execution requires all configured gates to pass:

- controlled-fork validation + validation ID;
- atomic repayment validation;
- production wallet authorization;
- risk limits validation;
- profitability validation;
- slippage/gas validation;
- production execution path enabled;
- kill switch disabled.

Until these are all true, `LIVE_EXECUTION` remains false and no transaction is broadcast.

### 9. Execute

Only an opportunity that passed every gate may enter the execution path. The execution layer must submit one atomic transaction, verify the expected repayment, and record transaction/reconciliation evidence.

### 10. Reconcile and target attainment

After execution, reconcile actual received amounts, fees, gas and realized net profit. Target attainment is based on realized/verified results, not displayed opportunity estimates. When the target is reached, stop new execution and reconcile/sweep according to policy.

## Operational states

- `CONFIGURATION_BLOCKED` — required infrastructure is missing.
- `WAITING_FOR_ROUTE_CONFIGURATION` — intended venue routes are not configured.
- `WAITING_FOR_FRESH_QUOTES` — routes exist but fresh quotes are unavailable.
- `WAITING_FOR_VENUE_COVERAGE` — one or more configured venues are inactive/stale.
- `WAITING_FOR_LIQUIDITY_COVERAGE` — enabled flash-liquidity assets lack route coverage.
- `WAITING_FOR_OPPORTUNITY` — all configured venues are active and covered, but no candidate clears the net-profit/risk gate.
- `OPPORTUNITIES_AVAILABLE` — positive-net candidates exist, but execution gates may still block them.
- `EXECUTION_READY` — a specific candidate has passed simulation, controlled-fork, repayment, wallet, risk, slippage/gas and execution-path gates.
- `TARGET_REACHED` — target attainment has been verified; new execution stops.

`WAITING_FOR_OPPORTUNITY` is a healthy fail-closed state. The system must continue scanning rather than lower profitability thresholds, fabricate prices, or force a trade.

## MCP / third-party integration boundary

The MCP control plane prioritizes **availability assurance**: it reports configured venues, active venues, fresh routes, liquidity coverage, profitable candidates and the exact blocking gate. It must not sign, borrow, withdraw, broadcast, disable the kill switch or self-authorize execution.

MCP tools may orchestrate discovery and verification across approved adapters. Deterministic on-chain quote/route logic and the production gate engine remain authoritative.

## Production acceptance evidence

A release is opportunity-availability ready only when:

1. every intended venue is configured;
2. every configured venue has fresh successful observations;
3. liquidity coverage is measured;
4. opportunities are derived from real quotes;
5. net economics are calculated after costs;
6. candidate reasons are observable when rejected;
7. execution remains fail-closed;
8. controlled-fork validation evidence exists before live authorization;
9. Vercel health and production environment configuration are verified;
10. no secret/private key is committed or logged.
