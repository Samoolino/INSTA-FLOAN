# INSTA-FLOAN — Real Execution Runbook

## Purpose

This runbook converts the production execution design into an actionable sequence without bypassing the fail-closed controls.

**Current rule:** deployment of the web UI does not authorize blockchain execution. `LIVE_EXECUTION` remains `false` until every gate below has independent evidence.

## 1. Vercel control-plane release

Canonical Vercel project:

- Team: `samoolinos-projects`
- Project: `insta-floan`
- GitHub source: `Samoolino/INSTA-FLOAN`

Release sequence:

1. Build from `main`.
2. Deploy a preview/staged deployment.
3. Verify the dashboard, health route, wallet UI, and execution-gate status.
4. Run the controlled-fork validation independently of the public deployment.
5. Only after all checks pass, promote the validated deployment to production.

Do not put a private key in GitHub, browser storage, Vercel build output, CI logs, or source code.

## 2. Provider engagement proof

A protocol being deployed on-chain is not sufficient evidence that INSTA-FLOAN can engage it.

For the selected lender/connector, record:

- chain ID
- exact lender/connector address
- runtime bytecode hash
- official deployment/source reference
- token and repayment asset
- flash-loan entrypoint
- Smart Account/origin configuration
- successful exact-repayment transaction receipt on the controlled fork
- deliberately insufficient-repayment transaction receipt showing revert
- fork snapshot/balance restoration after the negative case

Until this evidence exists, the provider is **not production-engageable**.

## 3. Mandatory controlled-fork attestation

Run the integration harness only against a local Anvil fork, never directly against a public/mainnet RPC.

Required outcome:

- exact repayment succeeds and produces a receipt;
- one-token-under repayment reverts;
- the fork snapshot restores;
- relevant balances restore;
- the evidence receives a unique validation ID.

Set only after evidence is captured:

```text
CONTROLLED_FORK_VALIDATED=true
CONTROLLED_FORK_VALIDATION_ID=<attestation-id>
ATOMIC_REPAYMENT_VALIDATED=true
```

## 4. Production authorization gates

All of these must be true before a real transaction is considered executable:

```text
LIVE_EXECUTION=true
CONTROLLED_FORK_VALIDATED=true
CONTROLLED_FORK_VALIDATION_ID=<non-empty>
ATOMIC_REPAYMENT_VALIDATED=true
PRODUCTION_WALLET_AUTHORIZED=true
PRODUCTION_RISK_LIMITS_VALIDATED=true
PRODUCTION_PROFITABILITY_VALIDATED=true
PRODUCTION_SLIPPAGE_GAS_VALIDATED=true
PRODUCTION_EXECUTION_PATH_ENABLED=true
PRODUCTION_KILL_SWITCH_ENABLED=false
```

The application must continue to fail closed if any one of these is absent or false.

## 5. First live trade

The inaugural live transaction is a bounded authorization event, not an autonomous launch.

Before signing:

1. Verify chain and contract addresses.
2. Verify the lender/connector evidence above.
3. Re-quote the complete route immediately before execution.
4. Calculate net profit after swap fees, flash-loan fee, gas, slippage, and safety reserve.
5. Confirm net profit is above `MIN_NET_PROFIT_USD`.
6. Confirm trade notional is inside the production risk limit.
7. Confirm the kill switch is available and operator-visible.
8. Explicitly authorize the transaction from the connected wallet.

After submission:

1. Poll for the receipt.
2. Require a successful receipt before marking the trade successful.
3. Reconcile actual token/gas deltas.
4. Record realized P&L and the transaction hash.
5. Stop immediately on any unexpected revert, loss, route mismatch, or repayment anomaly.

## 6. Continuous target attainment

Target attainment is a scanner/executor loop, not a requirement to trade continuously.

```text
TARGET
  -> discover opportunities
  -> executable quote
  -> all-cost net-profit model
  -> repayment proof gate
  -> risk/nonce/allowance checks
  -> explicit execution authorization
  -> receipt confirmation
  -> realized P&L
  -> target progress
  -> repeat only while every gate remains valid
```

The loop must stop when the target is reached, a risk limit is breached, the kill switch is activated, provider verification expires, or no opportunity clears the net-profit threshold.

## 7. Current blockers

As of this runbook's creation, the repository configuration intentionally leaves the following production prerequisites unset:

- Instapool V4 deployment addresses and bytecode hashes
- controlled-fork validation attestation
- atomic repayment attestation
- production wallet authorization
- production risk/profitability/slippage validation
- production execution-path enablement

Therefore this project is **actionable for controlled validation and staged deployment, but not yet authorized for a real-money trade**.

## Done when

A real execution may be considered ready only when there is a reproducible validation artifact, verified lender deployment, passing fork evidence, passing build/deployment checks, explicit production authorization, and a bounded first-trade plan. Never enable the production flags merely to make the Vercel UI appear live.
