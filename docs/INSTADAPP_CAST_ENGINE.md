# Instadapp Cast Engine — Version & Capability Standard

## 1. What we actually have installed

The application does **not** currently install `Instadapp/dsa-sdk` as a runtime dependency. The repository's package manifest contains `viem`, `wagmi`, React/Next.js and related dependencies, but no Instadapp SDK package. The Cast boundary is implemented directly with the `viem` ABI encoder. This is deliberate: the official `Instadapp/dsa-sdk` repository is archived and its package manifest records version **1.5.15**.

The engine in this application is therefore:

- **Engine:** `Instadapp DSL Cast`
- **Mode:** `direct-abi`
- **Cast ABI:** `cast(string[],bytes[],address)`
- **Archived SDK reference:** `Instadapp/dsa-sdk@1.5.15` — reference only, not a runtime dependency
- **Execution:** simulation-only until all production gates pass

This distinction prevents us from treating the archived SDK version as if it were the current Instadapp protocol engine.

## 2. Current Instadapp architecture used by the DApp

Instadapp's developer documentation describes `cast()` as the core composability function for a DeFi Smart Account. A smart account resolves the extension implementation from the function selector, and the extension executes the requested spell(s) using delegate calls. The important application-level boundary is therefore the target-name + encoded-calldata pair, not a hard-coded EVM connector address.

Our adapter follows that model:

```text
Smart Account
    |
    +-- cast(string[] targets, bytes[] datas, address origin)
             |
             +-- connector name, e.g. Instapool-v4
             |
             +-- connector calldata
```

For the Instapool V4 flash-loan route, the connector data is:

```text
flashBorrowAndCast(
  address token,
  uint256 amount,
  uint256 route,
  bytes data,
  bytes extraData
)
```

where `data` contains `(string[] targets, bytes[] callDatas)`.

## 3. Upgrade decision

**Do not downgrade or pin the production engine to the archived `dsa-sdk@1.5.15`.**

The upgrade is to keep the current direct-ABI engine as the production integration boundary and make its protocol version/capabilities explicit. This gives us:

1. no dependency on the archived SDK;
2. exact ABI-level encoding with `viem`;
3. explicit connector-name semantics;
4. a versioned engine status object for the dashboard/health layer;
5. a clean seam for future DSL extension modules;
6. no accidental live transaction submission during the upgrade.

## 4. Infrastructure availability model

Cast availability must be evaluated as infrastructure readiness, not assumed from the existence of an ABI encoder.

Required chain for an executable path:

```text
Cast ABI available
  -> Smart Account known
  -> connector name registered
  -> connector deployment known
  -> deployment bytecode identity verified
  -> module/signature verified
  -> flash liquidity available
  -> fresh quote available
  -> route profitable after gas/slippage/fees
  -> controlled-fork execution succeeds
  -> atomic repayment verified
  -> production wallet authorized
  -> risk + slippage/gas limits validated
  -> execution path enabled
  -> emergency kill-switch explicitly cleared
  -> ONLY THEN live execution may be enabled
```

A missing infrastructure item is a **blocked capability**, not a reason to fabricate availability.

## 5. Flash-loan extension

The repository already models Instapool V4's `flashBorrowAndCast` boundary and performs deployment/bytecode verification before constructing the verified simulation call. The verified source registry is pinned to the upstream Instadapp connector source commit recorded in `lib/instapool-v4-config.ts`.

The current implementation supports the single-asset V4 envelope and its nested Cast spell. It should be extended without bypassing verification to cover:

- multi-asset flash-borrow/cast where the verified connector supports it;
- multiple connector spells in one Cast;
- route-aware liquidity source selection;
- per-route availability and freshness reporting;
- exact repayment amount/fee verification;
- controlled-fork attestation for each supported chain;
- production execution only after all safety gates pass.

## 6. Quality rule

`Cast available` is not equivalent to `arbitrage available` and neither is equivalent to `profitable`.

The dashboard should report these independently:

- **Cast engine:** available / blocked
- **Infrastructure coverage:** complete / partial / unavailable
- **Fresh quotes:** count and freshness ratio
- **Profitable paths:** count after all modeled costs
- **Execution:** OFF until production gates pass
- **Target attainment:** WAITING when no profitable route exists

This preserves the project's fail-closed execution standard.
