# INSTA-FLOAN Live Readiness Status

**Status: FAIL-CLOSED — no real-money flash execution enabled.**

## Verified upstream Instapool V4 source

The application pins the upstream Instadapp DSA Connectors source to:

- Repository: `Instadapp/dsa-connectors`
- Commit: `a8e806796064f8012c0896b641e93c14b0c242e1`
- Contract: `ConnectV2InstaPoolV4`
- Function: `flashBorrowAndCast(address,uint256,uint256,bytes,bytes)`

The pinned source exists for Ethereum, Arbitrum, Optimism, Polygon, and Avalanche connector variants.

## What is NOT yet verified

The following are deliberately absent from the committed runtime configuration and therefore cannot be treated as live-ready:

- Instapool V4 connector addresses for any chain
- Expected runtime bytecode hashes for any chain
- Independently verified on-chain code identity
- Current token liquidity balances
- Executable token/pair route inventory
- Current V2/V3 venue router addresses for the selected route
- Controlled-fork attestation ID
- Production wallet authorization
- Production risk, profitability, gas/slippage and execution-path approvals
- A verified Vercel deployment URL

`.env.example` keeps the Instapool connector addresses, verification flags and bytecode hashes empty/false, and all production execution flags fail-closed.

## Controlled-fork attestation requirements

A valid attestation must prove, on a local Anvil fork of a specific public chain:

1. Exact chain ID and fork block/RPC provenance.
2. Exact Instapool V4 connector address and runtime bytecode identity.
3. Exact smart-account/origin addresses used by the route.
4. Exact flash-loan token and amount.
5. Exact two-leg route and venue contract addresses.
6. Exact required repayment amount.
7. Positive case: transaction receipt succeeds and repayment is satisfied atomically.
8. Negative case: repayment reduced by exactly one token unit (or equivalent smallest unit) reverts with status `0x0`.
9. Fork snapshot is restored and pre/post token balances match.
10. Attestation ID is recorded before any production execution authorization.

The integration test in `lib/instapool-v4-local-fork.integration.test.ts` already encodes the positive and under-repayment/revert cases and is opt-in to a loopback fork.

## Real-execution gate

No flag may be changed to enable live execution merely because the UI or Vercel deployment is live. Production execution remains blocked until all of the following are independently evidenced:

`CONTROLLED_FORK_VALIDATED`
`ATOMIC_REPAYMENT_VALIDATED`
`PRODUCTION_WALLET_AUTHORIZED`
`PRODUCTION_RISK_LIMITS_VALIDATED`
`PRODUCTION_PROFITABILITY_VALIDATED`
`PRODUCTION_SLIPPAGE_GAS_VALIDATED`
`PRODUCTION_EXECUTION_PATH_ENABLED`
`PRODUCTION_KILL_SWITCH_ENABLED`

Only after those checks pass may a human-authorized, bounded inaugural transaction be considered.

## Vercel status

Canonical Vercel project: `insta-floan` (`prj_vzRQ7tmPR0id7Ym1lhCgyRfuQqnM`).

The connected Vercel control plane currently reports **zero deployments and no production domain**. Therefore no verified pilot URL can truthfully be published yet.

A canonical GitHub Actions production pipeline has now been committed at `.github/workflows/vercel-production.yml`. It targets the canonical Vercel project, uses Node 24, builds with `vercel build --prod`, and deploys the prebuilt output with `vercel deploy --prebuilt --prod`. The workflow requires the Vercel `VERCEL_TOKEN` GitHub secret and the GitHub `production` environment; no Vercel credential is committed to the repository.

The connected Vercel deployment action itself still cannot be invoked from this connection because its backend currently requires target/name/files inputs that are not exposed by the loaded action schema. Therefore the new GitHub pipeline is the canonical production-deployment path until that connector limitation is removed.

## Pilot gate

The first real flash execution must remain blocked until the verified deployment evidence, controlled-fork attestation, live contract/token/pair inventory, wallet authorization and profitability/risk checks are complete. No private key should be pasted into this repository, Vercel, browser storage, CI logs or chat.
