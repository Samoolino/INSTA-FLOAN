# INSTA-FLOAN Execution Ecosystem & Guarded Automation

## Objective

INSTA-FLOAN is not intended to remain an isolated dashboard. The ecosystem target is:

`opportunity discovery -> liquidity access -> DSA/Spell route -> deterministic assurance -> simulation/attestation -> guarded submission -> receipt/reconciliation`

The automation layer improves availability and timing. It does **not** bypass the existing profitability, repayment, risk, wallet or controlled-fork gates.

## Instadapp integration boundary

The repository already models the Instadapp DSA `cast(string[],bytes[],address)` envelope and Instapool-v4 `flashBorrowAndCast(address,uint256,uint256,bytes,bytes)` route. The existing implementation is simulation-first and fail-closed.

The preferred ecosystem model is therefore:

1. Discover a candidate through the opportunity graph.
2. Resolve a verified Instapool-v4 lender route for the candidate chain/token.
3. Build the DSA spell/cast calldata.
4. Run exact calldata simulation.
5. Verify repayment enforcement and profitability.
6. Produce an `EXECUTION_READY` attestation.
7. Require explicit production authorization before any transaction submission.

The dashboard, MCP and automation services must never invent a route merely because an Instadapp connector exists.

## Flash-loan aggregator clarification

The application currently uses its **verified Instapool-v4 adapter/configuration**, not a generic dynamic "Flashloan Aggregator" abstraction that can silently select arbitrary lenders.

If a future aggregator is introduced, it must expose an adapter contract such as:

```text
lender -> chain -> asset -> available liquidity -> fee -> freshness -> repayment proof
```

Every returned route must be independently verified before it enters the opportunity graph.

## Automation / keeper architecture

Chainlink Automation, Gelato, or another approved decentralized keeper may be integrated as a **trigger/orchestration layer**.

A keeper trigger can request:

- fresh quote scan;
- opportunity revalidation;
- target-progress evaluation;
- controlled-fork simulation;
- execution-readiness attestation.

A keeper trigger must **not** by itself authorize a live trade.

Required state transition:

`KEEPER_TRIGGERED -> REVALIDATING -> SIMULATING -> ATTESTED -> AUTHORIZATION_REQUIRED -> SUBMITTABLE`

Only an explicitly enabled production execution service may transition `AUTHORIZATION_REQUIRED -> SUBMITTED`.

## MEV / inclusion strategy

Ethereum inclusion infrastructure such as Flashbots/private transaction or bundle submission can be supported as an **optional submission adapter**.

It must be modelled as:

```text
baseGas
+ priorityFee
+ inclusionCost
+ optional builder/searcher incentive
= executionCost
```

The opportunity is executable only if the **worst-case bounded execution cost** still clears the configured net-profit floor and reserve.

The system must never treat a bribe, priority fee or private bundle as an inclusion guarantee.

For the current product stage, these values are **simulation/configuration inputs only**. Autonomous incentive spending is disabled.

## Availability assurance

Venue availability is measured independently from profitability:

- `CONFIGURED`
- `CONNECTED`
- `QUOTE_FRESH`
- `LIQUIDITY_COVERED`
- `ROUTE_SIMULATABLE`
- `PROFITABLE`
- `EXECUTION_READY`

A venue can be connected but unavailable for execution. A profitable quote can be non-executable. An executable route can still be unauthorized.

The MCP opportunity control plane should continuously rotate stale venues, request fresh quotes and identify uncovered token/venue/network combinations.

## Third-party / MCP extensions

Approved extensions may include:

- RPC/indexing provider adapters (Alchemy or equivalent)
- DEX quote adapters
- CEX official APIs
- simulation/fork providers
- Flashbots/private submission adapter
- Chainlink Automation adapter
- Gelato Automation adapter
- Supabase persistence/reconciliation
- Sentry observability
- Telegram operational alerts
- GitHub CI/release controls
- Vercel deployment/health monitoring

Third-party adapters are untrusted inputs until normalized, freshness-checked and independently validated.

## Production gate

`LIVE_EXECUTION=false` remains the default.

Production execution requires all of:

1. healthy production RPC;
2. verified lender/connector configuration;
3. fresh quote;
4. sufficient flash liquidity;
5. route graph coverage;
6. positive net profit after all costs;
7. risk limits;
8. exact transaction simulation;
9. atomic repayment proof;
10. controlled-fork attestation;
11. explicit wallet/operator authorization;
12. kill-switch available;
13. reconciliation path available.

Failure of any gate returns `BLOCKED` and no transaction is submitted.

## Target attainment

Continuous target attainment means continuous **opportunity search and revalidation**, not forced trading.

If no route clears the gates, the correct state is:

`WAITING_FOR_OPPORTUNITY`

not a synthetic trade and not a relaxation of the profitability floor.

## Operational objective

The highest-priority automation objective is therefore:

> Keep the verified opportunity surface continuously populated and measurable while preserving deterministic financial safety gates.
