# Dynamic Opportunity Assurance

## Objective

The system must not assume that a flash-loan opportunity exists merely because a lender, token and network are configured. Conversely, it should not depend on one fixed token/venue pair. The viable model is a continuously expanding opportunity graph.

**Important:** the system can assure *coverage and continuous search readiness*, but cannot mathematically guarantee a profitable market opportunity. Profit remains market-dependent.

## Opportunity graph

`FlashLiquidityAsset -> Token/Market Graph -> Venue/Router -> Return Path -> Net Profit Gate`

A flash-loan asset is therefore an input to the search space, not the opportunity itself.

For every enabled flash-liquidity source:

1. Discover usable assets and available liquidity.
2. Map each asset to configured/verified venue routes.
3. Generate both directions where the route is valid.
4. Query fresh on-chain quotes.
5. Calculate gross spread, gas, slippage and all lender/venue fees.
6. Reject stale, incomplete, unsafe or non-positive-net paths.
7. Rank surviving paths by risk-adjusted net profit and execution quality.
8. Continue scanning even after a candidate is selected; liquidity and prices can change before execution.

## Availability adaptation

Availability should be dynamic rather than a fixed list:

- `AVAILABLE`: lender liquidity and route are currently usable.
- `DEGRADED`: quote stale, liquidity low, RPC unhealthy or route temporarily failing.
- `ROTATE`: move to another venue/path for the same flash-loan asset.
- `EXPAND`: add another verified venue/path for the asset when coverage is insufficient.
- `BLOCKED`: route fails validation, profitability or safety gates.

The UI should show coverage metrics separately from profitability metrics.

## Assurance metrics

The assurance layer reports:

- flash liquidity sources
- funded/available assets
- configured quote routes
- fresh quotes
- positive-net paths
- coverage ratio
- whether the search space is expandable

This prevents the dashboard from treating `0 opportunities` as equivalent to `0 capability`. A zero can mean no verified routes, stale quotes, or simply no current profitable spread.

## Target attainment

Target attainment remains profit-driven. The engine must never manufacture an opportunity or execute a negative-net trade just to reach the target. It should keep scanning, rotate eligible routes, and stop once cumulative **realized** net profit reaches the configured target.

If no profitable route exists, the correct state is `WAITING_FOR_OPPORTUNITY`, not forced execution.

## Current implementation boundary

The live quote adapter currently reads explicitly configured on-chain V2-compatible routes and does not fabricate quotes. This is the correct foundation for the assurance layer. The next integration step is to feed verified flash-liquidity availability into the scan endpoint and expose the assurance object on the dashboard.
