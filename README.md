# INSTA-FLOAN

**Instadapp-oriented flash-loan arbitrage DApp and target-attainment control plane.**

> Development status: architecture and simulation-first foundation. Mainnet execution is disabled until route, contract, repayment, security and fork tests pass.

## Correct production sequence

```text
code/CI
  -> controlled Anvil fork
  -> positive exact-repayment receipt
  -> negative one-token-under-repayment revert
  -> fork snapshot + balance restoration
  -> lender/connector bytecode + address verification
  -> simulation + gas/slippage/net-profit/risk gates
  -> explicit wallet authorization
  -> production execution authorization
  -> receipt + repayment + P&L reconciliation
  -> continue only while target/risk conditions remain valid
```

**The production execution layer must not be reachable merely because `LIVE_EXECUTION=true`.** It must consume a successful controlled-fork validation identifier and attestation together with every independent production gate. The controlled-fork result is a prerequisite, not a substitute for production authorization.

## Controlled Anvil fork integration

The Instapool V4 integration tests are **opt-in** and must never silently use a production RPC.

Enable them only against a local Anvil endpoint:

```bash
INSTA_FORK_INTEGRATION=true
INSTA_FORK_RPC_URL=http://127.0.0.1:8545
```

The fixture requires explicit values for the configured chain, connector, Smart Account, origin, token pair, flash amount, required repayment, expected final amount, and both swap-leg amounts. These values must come from the controlled fork deployment and must never contain private keys or seed phrases.

Do not enable the integration against a public/mainnet RPC. The harness impersonates only the configured Smart Account on the local Anvil node and restores the fork snapshot after the negative case.

The positive case must produce a successful transaction receipt for the exact repayment route. The negative case deliberately under-repays by one token and must produce a reverted receipt, followed by successful snapshot restoration and balance restoration. A successful `eth_call` alone is not sufficient evidence of lender-side atomic repayment enforcement.

## Execution safety

Default:

```text
LIVE_EXECUTION=false
```

The authorization layer now requires all of the following before a live execution path can be admitted:

- controlled-fork validation is explicitly marked passed;
- a non-empty controlled-fork validation ID and attestation are present;
- wallet authorization is explicit;
- chain/contract registry is verified;
- atomic lender/connector repayment enforcement is independently verified;
- simulation is required and has passed;
- risk controls and net-profit gates are enabled;
- an operator kill switch is enabled.

Production execution requires correct chain and verified contract addresses, Smart Account configuration, sufficient liquidity, encoded repayment, acceptable gas/slippage, positive net profit above threshold, risk limits, an enabled execution path, and user authorization.

A successful simulation or post-transaction token balance is not accepted as repayment proof. The exact lender/connector repayment-enforcement property must be explicitly verified before it can participate in live authorization.

## Security principles

1. No seed phrase collection.
2. No private keys committed to Git.
3. No execution solely because a price spread exists.
4. No execution without simulation.
5. No negative expected net profit.
6. No automatic wallet-authorization bypass.
7. No production execution while address and route validation is incomplete.
8. No caller-supplied final balance as repayment proof.
9. No live authorization unless exact lender/connector atomic repayment enforcement is independently verified.
10. Target attainment stops when the target is reached or risk conditions invalidate further execution.
11. Controlled-fork validation is a mandatory predecessor to production execution authorization.

## Current status

The repository is simulation-first. The local-fork harness is ready for controlled execution, but real lender-side atomic repayment enforcement remains a verification gate. Live execution stays disabled until the exact fork evidence is captured and consumed by the authorization layer.
