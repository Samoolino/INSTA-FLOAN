# INSTA-FLOAN

Instadapp-oriented flash-loan arbitrage control plane.

## Development rules

- Flash-loan / atomic borrowing strategies are simulation-first.
- The scanner can evaluate multiple paths until a configured target profit is reached, but every individual execution must pass the net-profit, liquidity, gas, slippage, repayment and safety gates.
- No private key or RPC API key is committed to GitHub.
- Ethereum RPC is supplied at runtime through `ETH_RPC_URL`.
- Mainnet execution remains disabled until fork tests, contract/address validation and explicit wallet authorization pass.

## Current application scope

1. Next.js dashboard
2. Wallet/authentication boundary
3. 8 liquidity/borrowing strategy adapters
4. Target-attainment strategy engine
5. Ethereum RPC health and block monitoring
6. Simulation-only opportunity scanner
7. Vercel cloud heartbeat
8. Instadapp/Smart Account execution integration point

See `.env.example` for runtime configuration.