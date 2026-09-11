# MCP Opportunity Availability Objective

## Priority objective

The INSTA-FLOAN MCP is an **opportunity-availability control plane**, not merely a chat/tool interface.

Its first responsibility is to continuously establish whether the configured market universe contains **fresh, funded, routeable and potentially executable opportunities**.

An opportunity must not be called executable merely because a quote exists. The control plane must establish the chain:

`flash liquidity → funded asset → configured venue → active/fresh quote → route graph → gross return → gas/slippage/fees → positive net → risk checks → simulation → repayment validation → authorization → execution`

Instadapp DSL provides composability through smart-account extensions and `cast()`, but the availability engine remains responsible for proving that a route is actually usable before execution is considered. urlInstadapp Developer Docshttps://docs.instadapp.io/

## All-venue engagement requirement

Every venue configured in `LIVE_QUOTE_ROUTES` is treated as an explicit availability obligation.

For each configured venue the engine should continuously:

1. Resolve its configured chain, router and token path.
2. Verify the RPC is available.
3. Read a fresh on-chain quote.
4. Verify quote integrity and timestamp freshness.
5. Connect the venue route to compatible flash-liquidity assets.
6. Place the venue into the opportunity graph.
7. Calculate net economics after gas, slippage and configured costs.
8. Mark the venue as **active** only when fresh valid data is actually observed.
9. Mark candidate paths as **executable opportunities** only when the positive-net and safety gates pass.
10. Continuously re-scan and rotate/expand routes when a venue becomes stale, unavailable or uneconomic.

Therefore:

- configured venue ≠ active venue;
- active venue ≠ profitable opportunity;
- profitable opportunity ≠ executable transaction;
- executable transaction ≠ authorized live transaction.

This separation is deliberate and prevents the MCP from overstating market availability.

## Availability states

### `NO_LIVE_ROUTES`
No complete venue universe is configured. The system may expand configuration but must not fabricate opportunities.

### `NO_FRESH_QUOTES`
Routes exist but fresh valid quotes are unavailable. The venue universe is not execution-ready.

### `VENUE_COVERAGE_INCOMPLETE`
At least one configured venue is not actively returning fresh quotes. Partial venue coverage is not presented as complete opportunity availability.

### `PARTIAL_COVERAGE`
All configured venues may be active, but enabled flash-liquidity assets are not fully connected to fresh route coverage.

### `NO_PROFITABLE_PATHS`
All configured venues and liquidity coverage are healthy, but no current route clears the positive-net profitability/safety gate. The system keeps scanning rather than forcing a trade to satisfy the user's target.

### `COVERAGE_READY`
Every configured venue is active, liquidity coverage is complete, fresh quotes are available, and at least one positive-net candidate currently clears the market safety gate.

Even this state does **not** authorize a live transaction. Controlled-fork validation, atomic repayment validation, wallet authorization, risk limits, profitability validation, gas/slippage validation, execution-path enablement and kill-switch policy must still pass.

## MCP responsibilities

The MCP should expose read-only availability tools such as:

- `get_opportunity_assurance`
- `get_venue_availability`
- `get_liquidity_status`
- `get_quote_status`
- `get_opportunity_graph`
- `get_executable_opportunities`
- `get_target_progress`
- `get_production_gates`
- `get_last_execution`
- `get_reconciliation_status`

Long-running scans may use MCP Tasks where appropriate; the current MCP specification supports stateless HTTP operation and Tasks as an extension. citeturn0search0

## Security boundary

The MCP must never:

- invent liquidity or quotes;
- mark a venue active without fresh observed data;
- call an opportunity executable solely because it is profitable on paper;
- sign arbitrary transactions;
- withdraw funds;
- bypass controlled-fork validation;
- disable the kill switch;
- override risk/profitability gates.

The MCP is an observability/orchestration layer. The deterministic assurance and execution-gate code remains authoritative.

## Target attainment

Target attainment is subordinate to opportunity quality. If the target is not reachable with currently valid opportunities, the system reports `WAITING_FOR_OPPORTUNITY`/equivalent progress rather than inventing trades or lowering safety thresholds.

The desired operating loop is:

`discover all venues → refresh → validate → rank → simulate → authorize → execute → reconcile → refresh all venues → continue until target → stop/reconcile`

This gives the DApp a concrete availability objective: **maintain the widest verified set of actively accessible execution opportunities before any live transaction is authorized.**
