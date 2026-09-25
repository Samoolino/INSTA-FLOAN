# INSTA-FLOAN — Executional & Implementation Audit

Date: 2026-09-25

## Executive status

**Architecture / implementation:** advanced staged integration.

**Opportunity discovery:** implemented for configured HTTP/on-chain routes and WebSocket CEX order books/RPC block streams.

**Live-money execution:** **NOT AUTHORIZED**.

**Reason:** the repository remains fail-closed and the mandatory production evidence has not been established in this audit.

## Implemented

- Vercel/Next.js control plane.
- Wallet identity/control-plane integration.
- Instadapp-oriented DEX/flash-liquidity opportunity architecture.
- Hummingbot API adapter boundary.
- Hummingbot persistent-worker installer/API installer.
- CEX WebSocket opportunity scanner for configured Binance/Coinbase/Bybit feeds.
- VWAP/executable-size calculation.
- Quote freshness checks.
- Fee/slippage net-profit filtering.
- EVM RPC WebSocket block monitoring.
- Unified engine view combining DEX and Hummingbot discovery.
- Unified execution endpoint with execution-truth authorization.
- Fail-closed execution gates and kill-switch model.
- Hermes Agent operator-controlled sidecar installation boundary for Linux/macOS/WSL2 and native Windows.
- Hermes is explicitly outside the Vercel/browser/live-money authorization boundary.

## Execution gates required

The current execution-truth implementation requires controlled-fork attestation, production wallet authorization, risk validation, profitability validation, slippage/gas validation and an enabled production execution path before authorization can become valid.

The execution model now separates **manual explicit authorization** from **autonomous submission**. `AUTONOMOUS_SUBMISSION=false` does not prevent a manually authorized execution from becoming submission-enabled once all deterministic gates and `LIVE_EXECUTION=true` pass. `AUTOMATION_ENABLED` is likewise not a prerequisite for a manually authorized execution.

## Audit findings

### A. Strong / implemented

1. Discovery and execution are separated.
2. Opportunity detection does not itself submit transactions.
3. Hummingbot is isolated as a persistent worker rather than embedded into Vercel.
4. WebSocket order-book data is freshness-gated.
5. Cross-venue opportunities are evaluated using executable order-book size rather than headline prices only.
6. Runtime secrets are represented through environment variables rather than committed values.
7. Hermes is isolated as an operator-controlled diagnostic/assurance worker.
8. The kill switch is now fail-closed: enabled blocks execution; disabled allows deterministic gates to continue.
9. Manual authorization and autonomous submission are independent controls.

### B. Blocking production evidence

1. No independent controlled-fork attestation artifact was verified here.
2. No verified lender/connector deployment manifest with bytecode hashes was verified here.
3. No verified production wallet authorization evidence was verified here.
4. No completed production risk-limit attestation was verified here.
5. No completed production slippage/gas attestation was verified here.
6. No production execution-path enablement evidence was verified here.
7. No first-live-trade receipt/P&L evidence exists in the repository evidence inspected for this audit.

### C. Corrected execution-truth logic

`lib/execution-truth.ts` previously treated `PRODUCTION_KILL_SWITCH_ENABLED` as a positive prerequisite and required `AUTONOMOUS_SUBMISSION=true` for `SUBMISSION_ENABLED`. Both conditions conflicted with the intended fail-closed/manual-first policy.

The implementation is now corrected:

- `killSwitchEnabled=true` blocks execution;
- `killSwitchEnabled=false` permits deterministic gates to continue;
- explicit operator authorization can enable manual submission;
- `AUTONOMOUS_SUBMISSION` remains an independent optional automation mode;
- `AUTOMATION_ENABLED=false` does not block a manually authorized execution.

## Hermes integration boundary

Hermes Agent runs as a **separate persistent AI-agent worker**, not as a Vercel dependency and not inside the browser bundle. It may inspect the repository, analyze scanner output, prepare diagnostics, generate audit/evidence reports, and operate approved MCP/tool workflows.

It must not receive exchange withdrawal permissions, raw private keys, seed phrases, or an unrestricted live-trading authorization token.

The repository now contains both shell and native Windows worker installers. The actual Hermes runtime, model credentials and user-level MCP credentials remain on the operator-controlled worker.

## Stage definition

```text
SOURCE / CONTRACT DESIGN          COMPLETE / ADVANCED
DEX + FLASH-LIQUIDITY DISCOVERY   IMPLEMENTED
CEX/DEX WS DISCOVERY               IMPLEMENTED
OPPORTUNITY SCANNING               IMPLEMENTED
PROFITABILITY FILTER               IMPLEMENTED
UNIFIED CONTROL PLANE              IMPLEMENTED
HUMMINGBOT ADAPTER                  IMPLEMENTED
EXECUTION-TRUTH GATE                IMPLEMENTED / CORRECTED
HERMES SIDE-CAR                    INSTALLER + BOUNDARY IMPLEMENTED
CONTROLLED-FORK ATTESTATION         REQUIRED / NOT EVIDENCED
PRODUCTION RISK ATTESTATION         REQUIRED / NOT EVIDENCED
PRODUCTION WALLET AUTHORIZATION     REQUIRED / NOT EVIDENCED
FIRST REAL TRANSACTION              NOT YET AUTHORIZED
```

This audit deliberately distinguishes **implemented software capability** from **verified production execution authorization**.
