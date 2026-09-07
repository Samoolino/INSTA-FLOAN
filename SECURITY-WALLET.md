# Wallet connection and private-key security

INSTA-FLOAN supports two wallet access modes from the landing/dashboard control surface:

1. **Wallet connector** — uses the configured wagmi connectors and delegates signing to the wallet provider.
2. **Advanced private-key import** — accepts a 32-byte hexadecimal private key for a **memory-only local signer preview**.

## Private-key rules

- Never request or accept a seed phrase.
- Never persist the imported private key in localStorage, IndexedDB, cookies, URL parameters, analytics payloads, Git, or application logs.
- Never transmit the private key to a server, API route, worker, telemetry service, or third party.
- Clear the in-memory signer when the user removes it or the page/session is discarded.
- The browser UI must not enable live transaction signing solely because a private key was imported.
- Production execution should prefer a wallet/provider or dedicated server-side signer infrastructure with explicit operator controls.

## Execution boundary

Private-key import is a wallet-access option, not an authorization bypass. A transaction must still pass the complete pre-execution policy: chain/contract validation, fresh liquidity/quotes, route simulation, net-profit and safety-reserve checks, and independently verified atomic repayment enforcement.

The current UI remains simulation-first. Enabling production execution is a separate release/configuration decision and must never be inferred from the presence of a connected wallet or imported key.
