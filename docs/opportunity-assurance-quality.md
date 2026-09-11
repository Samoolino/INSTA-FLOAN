# Opportunity Availability Assurance — Quality & Process Standard

## 1. Purpose

The system must provide **continuous opportunity-search coverage**, not a promise of continuous profit. An opportunity is actionable only when its liquidity source, route, quote freshness, execution safety, and net profitability can be evidenced.

## 2. Assurance model

`Flash liquidity → funded asset → venue/route graph → fresh quote → gross spread → gas/slippage/fees → net profit → risk gate → simulation → authorization`

Every scan produces an auditable readiness state. The engine must never invent liquidity, prices, routes, or profitability.

## 3. Quality states

- **COVERAGE_READY (A/B):** fresh routes cover enabled liquidity and at least one positive-net path clears the market gate.
- **PARTIAL_COVERAGE (B/C):** live data exists but some enabled liquidity assets lack fresh route coverage. Rotate or expand routes.
- **NO_FRESH_QUOTES (D):** routes exist but quote freshness is insufficient. Refresh before considering execution.
- **NO_LIVE_ROUTES (F):** no verified live routes are configured.
- **NO_PROFITABLE_PATHS (B):** coverage is healthy, but current market conditions do not provide a positive-net safe path.

The grade measures **readiness quality**, not expected return.

## 4. Minimum quality controls

1. **Liquidity integrity** — lender, chain, token and positive available USD must be valid.
2. **Route integrity** — venue, token-in, token-out and chain must be explicitly configured/verified.
3. **Quote integrity** — amounts, gas, slippage and timestamp must be finite and valid.
4. **Freshness** — quotes older than the configured freshness window are excluded from actionable coverage.
5. **Coverage** — enabled liquidity assets are mapped to fresh route coverage; uncovered assets trigger expansion/rotation.
6. **Profitability** — gross spread must exceed gas, slippage, configured fees and safety reserve; non-positive net paths are rejected.
7. **Execution separation** — scanning and assurance never submit a transaction.
8. **Fail closed** — any missing production gate blocks real execution.

## 5. Continuous availability strategy

At each scan cycle:

- refresh live quotes;
- recompute liquidity-to-route coverage;
- remove stale routes;
- rank fresh routes by net profit and safety;
- identify uncovered liquidity assets;
- rotate/expand configured routes where possible;
- rescan until a valid positive-net path appears or the system remains in `WAITING FOR OPPORTUNITY`.

This creates continuous **avenue coverage** without falsely guaranteeing a profitable market.

## 6. Target attainment procedure

A target is a cumulative profit objective, not a forced trade quota.

`TARGET → DISCOVER → ROTATE/EXPAND → QUOTE → PROFIT GATE → SIMULATE → RISK GATE → AUTHORIZE → EXECUTE → VERIFY PNL → RECONCILE`

If no route passes the gates, the system waits. It must not lower safety thresholds or trade a loss merely to reach the target.

## 7. Production release gates

Real execution remains OFF until all required controls are independently validated:

- controlled-fork validation and attestation ID;
- atomic repayment validation;
- authorized production wallet/signing path;
- risk limits validated;
- profitability model validated;
- slippage/gas model validated;
- execution path explicitly enabled;
- kill-switch policy validated and available.

Deployment health is not trading authorization.

## 8. Vercel verification procedure

For Preview/Production, verify:

1. deployment state is `READY`;
2. `/api/health` returns healthy with required RPC configuration;
3. `/api/scan` returns assurance telemetry without submitting a transaction;
4. production environment variables are configured in Vercel;
5. live route/liquidity configuration contains only verified values;
6. real execution remains fail-closed until production gates pass.

Vercel environment variables are scoped by environment and require a redeploy before changes take effect. See the Vercel environment-variable guidance.

## 9. Evidence required before declaring “opportunity available”

A dashboard should only mark a route actionable when it has:

- current block/quote timestamp;
- verified lender/venue/chain/token identifiers;
- positive available liquidity;
- fresh quote;
- positive modeled net profit after costs/reserve;
- route safety result;
- successful controlled simulation where required.

Otherwise the UI should show the precise blocker and next assurance action.
