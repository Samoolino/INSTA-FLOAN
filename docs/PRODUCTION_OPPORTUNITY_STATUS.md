# Production Opportunity Status

## Current control-plane interpretation

The system uses **WAITING_FOR_OPPORTUNITY** when all configured venues are active and fresh but no candidate clears the positive-net profitability gate. This is a healthy controlled state, not a failed operation.

## Detection

1. Discover configured venue routes.
2. Verify venue/router/RPC access.
3. Pull fresh quotes from every configured venue.
4. Normalize and reject malformed/stale quotes.
5. Join quotes to enabled flash-liquidity assets.
6. Build the route graph.
7. Calculate gross return and subtract gas, slippage, venue/loan/settlement costs and reserve.
8. Rank candidates above the minimum net-profit threshold.

## Access

Use direct deterministic on-chain adapters for execution-critical quote data. Use official venue APIs where required for off-chain order books. Third-party adapters may extend coverage only when their outputs are provenance-tagged and independently validated. MCP is the orchestration/control plane: it can report venue availability, quote freshness, liquidity coverage and candidate readiness, but cannot authorize or broadcast trades.

## Execution

A positive-net candidate is still only a candidate. Before execution it must pass:

- quote freshness revalidation;
- exact route and contract/token validation;
- liquidity sizing;
- gas/slippage/reserve limits;
- controlled-fork attestation;
- complete transaction simulation including atomic flash-loan repayment;
- production wallet authorization;
- profitability/risk/slippage-gas validation;
- production execution-path enablement;
- kill-switch state validation.

Only after all gates pass can the execution worker submit the atomic transaction. Scan and MCP endpoints do not submit transactions.

## Target attainment

The target engine selects only positive-net candidates. It stops selecting once accumulated expected/realized profit reaches the configured target. It never forces an unprofitable trade merely to reach the target. After realized execution, reconciliation becomes the source of truth.

## Third-party / installation policy

Any third-party service or GitHub App must be explicitly trusted and granted only minimum required permissions. GitHub App installation scope must be limited to the repositories/resources required for automation. MCP authorization should likewise be scoped to read/assurance capabilities; human confirmation remains required for privileged changes.

## Vercel release gate

A deployment can be READY while the runtime remains unavailable if required environment variables are absent. Production health must therefore be verified separately from deployment state. `ETH_RPC_URL` and all required chain/venue configuration must exist in the Vercel production environment before live quote availability can be considered healthy.

`LIVE_EXECUTION` remains disabled until the production execution gates above are independently attested.
