# INSTA-FLOAN Operational Action Matrix

The control plane must convert every assurance response into an explicit, actionable procedure without fabricating liquidity or bypassing execution gates.

| State | Meaning | Operator action | Automatic action | Execution |
|---|---|---|---|---|
| `CONFIGURATION_BLOCKED` | Required runtime/config is missing | Configure RPC, route registry, liquidity registry, token metadata | Re-check configuration | Blocked |
| `NO_LIVE_ROUTES` | No verified venue route exists | Add independently verified `LIVE_QUOTE_ROUTES` entries and attach liquidity assets | Validate route schema/address/chain | Blocked |
| `NO_FRESH_QUOTES` | Routes exist but observations are stale/invalid | Verify RPC/router/token path and refresh | Re-query quotes and freshness | Blocked |
| `VENUE_COVERAGE_INCOMPLETE` | Some configured venues are not actively quoting | Activate missing venues or rotate stale routes | Re-scan and report missing venues | Blocked |
| `PARTIAL_COVERAGE` | Some enabled flash-liquidity assets lack fresh route coverage | Add token×venue×network routes | Rebuild route graph | Blocked |
| `NO_PROFITABLE_PATHS` | Coverage is healthy but no safe positive-net path exists | Continue scanning/rotation; do not weaken profit floor | Refresh quotes and recompute | Blocked |
| `COVERAGE_READY` | Fresh coverage and positive-net candidates exist | Select candidate for simulation | Revalidate immediately | Still gated |
| `READY_FOR_AUTHORIZATION` | Deterministic safety gates pass | Explicitly authorize the selected transaction | None | Not submitted |
| `AUTHORIZED` | Explicit authorization exists but autonomous submission is disabled | Operator may review/submit through the approved execution path | None | Submission disabled |
| `SUBMISSION_ENABLED` | All submission controls enabled | Monitor receipt/finality | Executor may submit only when policy permits | Requires production authorization |
| `CONFIRMED` | Transaction receipt/finality observed | Reconcile actual PnL | Record receipt and balances | Complete |
| `TARGET_REACHED` | Target attainment confirmed by realized PnL | Stop target cycle and reconcile | No forced follow-up trade | Stop |

## Safe executable control-plane actions

- `DISCOVER`: perform a live read-only scan.
- `REFRESH_QUOTES`: re-query configured routes.
- `ROTATE_ROUTES`: re-evaluate stale/unavailable routes and return required configuration changes.
- `CONFIGURE_VENUE`: validate a proposed route and produce the exact environment configuration needed; it does not silently persist credentials or fabricate addresses.
- `ATTACH_LIQUIDITY`: validate lender/chain/token linkage and return the required configuration record.
- `START_TARGET`: run discovery against a supplied positive target; it does not submit a transaction.
- `ARM_EXECUTION`: evaluate every execution gate and return the exact blocking gate. It never self-authorizes.
- `STOP`: return a stop/kill-switch acknowledgement for the operator layer.

The action endpoint is intentionally a control-plane mechanism. Production transaction submission remains fail-closed behind controlled-fork attestation, explicit authorization, wallet authorization, risk/profitability validation, slippage/gas validation, execution-path enablement and the production kill switch.

## Venue setup rule

A venue becomes **available** only when its configured route is verified for the selected chain, its RPC is reachable, the router/token path is valid, a fresh on-chain quote is returned, and the route is connected to an enabled flash-liquidity asset. Configuration alone never creates an opportunity.

## Target procedure

`TARGET → DISCOVER → ROTATE → QUOTE → SIMULATE → RISK GATE → AUTHORIZE → EXECUTE → VERIFY PnL`.

If no safe positive-net candidate exists, the correct operational response is `WAITING_FOR_OPPORTUNITY`; the engine must continue discovery rather than force a trade.
