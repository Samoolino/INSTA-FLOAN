# Production Sequence — Controlled-Fork Gated

## Purpose

Production deployment and real trading are separate gates. The web/control plane may be deployed to Vercel while real-money execution remains disabled until the controlled-fork evidence is complete and the execution authorization gate explicitly accepts it.

## Required sequence

1. **Build and CI gate**
   - `npm test` and `npm run build` must pass.
   - CI must keep `LIVE_EXECUTION=false`.
   - No private key or seed phrase may enter source control, client bundles, logs, telemetry, CI artifacts, or browser persistence.

2. **Controlled-fork gate**
   - Start an isolated Anvil fork from the intended production chain/RPC.
   - Exercise the exact lender/connector route and exact repayment calldata.
   - Positive case must produce a successful transaction receipt.
   - Negative case must make the payer one token short while preserving the lender-required repayment amount; it must produce a reverted receipt and restore the fork snapshot/balances.
   - A successful `eth_call`, a final balance, or a profitable quote is not sufficient evidence of atomic lender repayment enforcement.

3. **Provider/contract verification gate**
   - Verify the selected lender/connector contract address and runtime bytecode on the intended chain.
   - Verify the exact connector route used by the strategy, not merely that the protocol exists.
   - Record chain ID, contract address, bytecode hash, fork block, route/calldata hash, positive receipt, negative receipt, and snapshot restoration evidence.

4. **Economic/risk gate**
   - Simulate the complete transaction including lender fee, DEX fees, gas, slippage, price impact, and safety reserve.
   - Require `netProfit >= MIN_NET_PROFIT_USD` and keep the configured safety reserve.
   - Enforce position/path/cycle limits and an operator kill switch.

5. **Authorization gate**
   - Only after the above evidence exists may a separately controlled live execution profile be considered.
   - Live execution must require explicit wallet authorization and a server/worker execution boundary; the browser must never receive private keys.
   - Default remains `LIVE_EXECUTION=false`.

6. **Production deployment gate**
   - Deploy the Vercel control plane from `main` only after CI and controlled-fork evidence pass.
   - Production deployment does not itself authorize trading.
   - Keep execution disabled in the Vercel web runtime; a separately governed execution worker is required for any future live profile.

7. **First live transaction gate**
   - If and only if all prior gates are green, perform one bounded, explicitly authorized transaction.
   - Monitor the submitted transaction receipt, repayment, realized gas, slippage, and P&L.
   - Stop immediately on any mismatch, revert, unexpected gas/slippage, repayment anomaly, or risk-limit breach.

8. **Continuous operation**
   - Continue scanning and ranking opportunities, but execute only when every gate remains green for that specific opportunity.
   - Never force a trade merely to reach a profit target. A target is a reporting objective, not permission to bypass risk controls.

## Current repository posture

The repository is simulation-first. `LIVE_EXECUTION=false` is the default, CI explicitly sets it to false, and the runtime API calls an execution-disabled assertion. The controlled-fork integration requires receipt-based positive and negative evidence. These controls must remain in place until an independently verified production authorization process is established.

## Vercel rule

Vercel is the control-plane deployment surface. A Vercel production deployment is considered complete only when the deployment is reported as Ready and its production domain is verified. A project dashboard URL alone is not evidence that a deployment exists.
