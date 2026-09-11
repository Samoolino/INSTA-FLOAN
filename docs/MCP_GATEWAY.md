# INSTA-FLOAN MCP Gateway

The DApp now exposes a **read-only remote Model Context Protocol (MCP) gateway** at `/api/mcp`.

The implementation uses Vercel's `mcp-handler` 2.x with MCP SDK v2 and Zod. `mcp-handler` 2.x natively serves the MCP `2026-07-28` protocol and can fall back to stateless Streamable HTTP for 2025-era clients. The gateway uses Node.js 20+ and Streamable HTTP.

## Authorization

The endpoint is intentionally fail-closed. It requires:

```text
Authorization: Bearer <MCP_ACCESS_TOKEN>
```

`MCP_ACCESS_TOKEN` is server-only. Configure it in Vercel Production/Preview environment variables. Never put it in `NEXT_PUBLIC_*`, source code, Git history, browser storage, or client bundles.

If the secret is absent or the bearer value is wrong, `/api/mcp` returns HTTP 401.

## Read-only tools

The gateway exposes these tools:

- `get_runtime_status` — execution mode, target and safety configuration.
- `get_cast_engine_status` — direct Instadapp DSL Cast engine state and boundary.
- `get_liquidity_status` — configured flash-liquidity sources and funded assets.
- `get_opportunity_assurance` — route coverage, quote freshness and positive-net readiness.
- `get_opportunity_graph` — liquidity → token → venue route graph from current quotes.
- `get_profitable_opportunities` — current candidates clearing the positive-net safety gate.
- `get_production_gates` — controlled-fork, repayment, wallet, risk, profitability, gas/slippage and execution-path gate state.

These tools do **not** sign, broadcast, borrow, withdraw, disable the kill switch, or authorize production execution.

## Safety boundary

The MCP gateway is an intelligence/observability layer. The deterministic opportunity-assurance and execution gates remain authoritative.

The intended flow is:

```text
MCP client
  -> read runtime / liquidity / quotes / assurance
  -> identify candidate opportunity
  -> deterministic profitability + safety gate
  -> controlled-fork simulation
  -> atomic repayment validation
  -> explicit production authorization
  -> separate execution path
  -> reconciliation
```

The gateway must never become an alternate route around the production execution gate.

## Vercel configuration

For Preview/Production, configure `MCP_ACCESS_TOKEN` and the server-side RPC variables required by the live quote adapter. Environment changes require a new deployment before the running function receives them.

Keep:

```text
LIVE_EXECUTION=false
PRODUCTION_KILL_SWITCH_ENABLED=true
```

until the controlled-fork and all production gates have independently passed.

## Deployment verification

The branch deployment must reach `READY` before this MCP endpoint is considered available. A build failure is a release blocker; the previous MCP dependency deployment was observed building successfully, while the first MCP route revision failed type-checking because it used an obsolete three-argument `createMcpHandler` call. The route was corrected to the current two-argument API before the next deployment attempt.

The production site is not promoted by this change. Real execution remains blocked.

## Why this design

The current MCP specification is stateless and HTTP-native, allowing the endpoint to scale behind ordinary HTTP infrastructure. The MCP specification also provides authorization hardening and a formal extension model. INSTA-FLOAN deliberately keeps transaction authorization outside the MCP tool surface so an agent cannot turn a read-only market-intelligence channel into an unrestricted wallet executor.
