# INSTA-FLOAN Production Channels

## Canonical Web DApp
The primary production user interface is the Next.js application deployed through the Vercel project `insta-floan` under `samoolinos-projects`.

Production web flow:

GitHub `main` → Vercel build → Preview verification → Production → wallet authorization → execution gateway.

The web deployment is a control surface. It does not by itself authorize live blockchain execution.

## Downloadable / installed application
A future PWA/desktop shell is a second interface to the same execution-control plane. It must not contain an independent unrestricted trading engine or embedded private key.

Both channels must use the same:
- controlled-fork attestation;
- lender and contract verification;
- simulation and profitability gates;
- gas/slippage/risk limits;
- wallet authorization;
- kill switch;
- execution audit and transaction reconciliation.

## Live execution gate
Live execution remains fail-closed until controlled-fork validation has produced a durable attestation proving successful exact repayment and atomic failure on insufficient repayment, with the selected production lender/contract/token/pair configuration independently verified.

`LIVE_EXECUTION=false` remains the safe default.
