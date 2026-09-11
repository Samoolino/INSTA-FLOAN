# Development RPC configuration

The application already reads the Ethereum mainnet RPC from the server-only `ETH_RPC_URL` environment variable in `lib/rpc.ts`. `/api/health` uses it for `eth_blockNumber`, and the live quote adapter uses the configured RPC transport for on-chain reads.

## Development setup

Do **not** commit the Alchemy credential into Git, `.env.example`, frontend code, or client-side bundles. Keep it in protected environment configuration.

For local development, create `.env.development.local` (covered by the repository's secret-file ignore rules) and set:

```dotenv
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<ROTATED_ALCHEMY_API_KEY>
```

Then run the normal development flow:

```bash
npm install
npm run dev
```

Validate the RPC through the application rather than exposing the key:

```bash
curl http://localhost:3000/api/health
```

A healthy response includes `ok: true`, `network: ethereum-mainnet`, and the current block number.

The underlying JSON-RPC method is `eth_blockNumber`; Alchemy documents it as a POST JSON-RPC endpoint returning the latest block as a hexadecimal quantity.

## Vercel Development environment

The same variable must be added to the Vercel **Development** environment as a secret environment variable. Use either the Vercel dashboard or the CLI:

```bash
vercel env add ETH_RPC_URL development
```

When prompted, paste the **rotated** Alchemy key-backed RPC URL. Do not put it in a `NEXT_PUBLIC_*` variable because that would expose the credential to the browser.

For local syncing from Vercel:

```bash
vercel env pull .env.development.local --environment=development --yes
```

## Security note

The RPC credential supplied during development was pasted into chat. Treat that credential as exposed and rotate/revoke it in Alchemy before using the application beyond a disposable test. After rotation, use only the replacement credential in local/Vercel Development environment variables.

## Execution gate

Adding the RPC only enables authenticated read access. It does **not** enable live trading. `LIVE_EXECUTION` remains fail-closed, and live execution still requires controlled-fork validation, repayment validation, wallet authorization, risk/profitability checks, execution-path enablement, and the kill switch to be disabled through the explicit production gate.