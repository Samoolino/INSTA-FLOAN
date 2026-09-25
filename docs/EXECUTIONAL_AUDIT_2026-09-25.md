# INSTA-FLOAN — Executional & Implementation Audit

Date: 2026-09-25

## Executive status

**Architecture / implementation:** advanced staged integration.

**Opportunity discovery:** implemented for configured HTTP/on-chain routes and WebSocket CEX order books/RPC block streams.

**Live-money execution:** **NOT AUTHORIZED**.

**Reason:** the repository intentionally remains fail-closed and the mandatory production evidence has not been established in this audit.

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

## Execution gates required

The current execution-truth implementation requires controlled-fork attestation, production wallet authorization, risk validation, profitability validation, slippage/gas validation and an enabled production execution path before authorization can become valid.

The current code also requires both live execution and autonomous submission before `SUBMISSION_ENABLED`. This is intentionally incompatible with the safer project policy where autonomous submission remains false. Therefore **manual explicit authorization and autonomous submission must be separated before real production execution can be enabled**.

## Audit findings

### A. Strong / implemented

1. Discovery and execution are separated.
2. Opportunity detection does not itself submit transactions.
3. Hummingbot is isolated as a persistent worker rather than embedded into Vercel.
4. WebSocket order-book data is freshness-gated.
5. Cross-venue opportunities are evaluated using executable order-book size rather than headline prices only.
6. Runtime secrets are represented through environment variables rather than committed values.

### B. Blocking production evidence

1. No independent controlled-fork attestation artifact was verified here.
2. No verified lender/connector deployment manifest with bytecode hashes was verified here.
3. No verified production wallet authorization evidence was verified here.
4. No completed production risk-limit attestation was verified here.
5. No completed production slippage/gas attestation was verified here.
6. No production execution-path enablement evidence was verified here.
7. No first-live-trade receipt/P&L evidence exists in the repository evidence inspected for this audit.

### C. Logic issue requiring correction before live execution

`lib/execution-truth.ts` currently treats `PRODUCTION_KILL_SWITCH_ENABLED` as a positive prerequisite for readiness while the runbook specifies `PRODUCTION_KILL_SWITCH_ENABLED=false` as the condition for real execution. The readiness predicate must be corrected so an enabled kill switch blocks execution and a disabled kill switch permits the gate to continue.

The same file currently requires `AUTONOMOUS_SUBMISSION=true` for `SUBMISSION_ENABLED`. That is incompatible with the project's stated explicit-authorization/manual-first policy. Before enabling real execution, the execution model should support:

- `AUTHORIZED` = explicit operator authorization is present;
- `SUBMISSION_ENABLED` = live execution + all deterministic gates + explicit authorization;
- `AUTONOMOUS_SUBMISSION` remains an independent optional automation mode and must not be required for a manually authorized trade.

## Hermes integration boundary

Hermes Agent should run as a **separate persistent AI-agent worker**, not as a Vercel dependency and not inside the browser bundle. It may inspect the repository, analyze scanner output, prepare diagnostics, and operate approved MCP/tool workflows. It must not receive exchange withdrawal permissions, raw private keys, or an unrestricted live-trading authorization token.

The repository will provide an installer and MCP configuration template; the actual Hermes runtime and credentials remain on the operator-controlled worker.

## Stage definition

```text
SOURCE / CONTRACT DESIGN          COMPLETE / ADVANCED
DEX + FLASH-LIQUIDITY DISCOVERY   IMPLEMENTED
CEX/DEX WS DISCOVERY               IMPLEMENTED
OPPORTUNITY SCANNING               IMPLEMENTED
PROFITABILITY FILTER               IMPLEMENTED
UNIFIED CONTROL PLANE              IMPLEMENTED
HUMMINGBOT ADAPTER                  IMPLEMENTED
HERMES SIDE-CAR                    INSTALLATION READY
CONTROLLED-FORK ATTESTATION         REQUIRED / NOT EVIDENCED
PRODUCTION RISK ATTESTATION         REQUIRED / NOT EVIDENCED
PRODUCTION WALLET AUTHORIZATION     REQUIRED / NOT EVIDENCED
FIRST REAL TRANSACTION              NOT YET AUTHORIZED
```

This audit deliberately distinguishes **implemented software capability** from **verified production execution authorization**.
