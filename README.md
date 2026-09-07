# INSTA-FLOAN

**Instadapp-oriented flash-loan arbitrage DApp and target-attainment control plane.**

> Development status: architecture and simulation-first foundation. Mainnet execution is disabled until route, contract, repayment, security and fork tests pass.

## 1. What this application does

INSTA-FLOAN is designed to discover and evaluate atomic borrowing/flash-liquidity opportunities, construct arbitrage routes, calculate true executable net profit, and—only after all safety gates pass—request an authorized wallet signature for execution.

The target-attainment mode does **not** mean the application trades blindly until a monetary target is reached. It means:

1. Set a target amount.
2. Discover eligible opportunities.
3. Evaluate available liquidity and strategic paths.
4. Simulate each candidate.
5. Reject any route that is not independently profitable after all modeled costs.
6. Rank executable opportunities.
7. Execute only an authorized, atomic transaction.
8. Record realized profit.
9. Continue with the next eligible opportunity until the target is reached, or stop when risk/market conditions no longer satisfy the rules.

A losing trade is never accepted merely because a later trade might recover it.

---

## 2. Wallet connection architecture

The DApp uses a **browser wallet connection layer** rather than asking users for private keys or seed phrases.

The intended flow is:

```text
User opens DApp
      |
      v
Connect Wallet
      |
      +-------------------------------+
      |                               |
 MetaMask / injected wallet     Mobile / WalletConnect
      |                               |
      +---------------+---------------+
                      |
                      v
              EVM Wallet Provider
                      |
                      v
             Wallet address + chain
                      |
                      v
                Authenticate
                      |
                      v
          Create / access user session
                      |
                      v
             Instadapp Smart Account
                      |
                      v
           Build transaction preview
                      |
                      v
               User confirms
                      |
                      v
             Wallet signs transaction
                      |
                      v
                Blockchain
```

### Important security boundary

The DApp must **never** request:

- seed phrases;
- private keys;
- wallet passwords;
- raw signing secrets;
- unrestricted server-side custody of the user's wallet.

The browser wallet remains the user's signing authority.

---

## 3. Supported wallet providers

The application is designed around the standard **EVM provider abstraction** so the UI is not hard-coded to one wallet.

### MetaMask

MetaMask can connect through its injected EVM provider or through the wallet connection layer used by the application.

Typical flow:

```text
MetaMask
   -> account selected
   -> chain checked
   -> message/signature requested
   -> authenticated session
   -> transaction preview
   -> user confirms in MetaMask
```

### Trust Wallet

Trust Wallet can participate through its supported EVM/mobile connection mechanism. On mobile, the application should use the selected wallet-connection protocol rather than assuming a desktop browser-injected provider.

### Phantom

Phantom supports EVM accounts in addition to its Solana functionality. INSTA-FLOAN treats Phantom as an EVM wallet when the user selects an EVM network. Solana functionality is outside the current Ethereum/Instadapp execution scope.

### WalletConnect-compatible wallets

The application should support WalletConnect-compatible wallets through a connector abstraction. This allows users to connect supported mobile and desktop wallets without the application implementing a separate integration for every wallet brand.

Examples may include wallets that expose Ethereum-compatible accounts through the WalletConnect ecosystem.

### Coinbase Wallet and other EVM wallets

The same abstraction can support additional EVM wallets. The application should identify the provider by capabilities, not by trusting a wallet name supplied by the browser.

---

## 4. Wallet provider vs authentication

These are separate concepts.

**Wallet connection** answers:

> Which blockchain account is connected and can it sign an EVM transaction?

**Application authentication** answers:

> Is this user authorized to use the INSTA-FLOAN application and its protected features?

Recommended authentication flow:

```text
Connect wallet
      |
      v
Server issues one-time nonce
      |
      v
User signs authentication message
      |
      v
Server verifies signature
      |
      v
Authenticated session created
```

A wallet signature for authentication is not the same thing as authorizing an arbitrage transaction.

The application should use separate, explicit signing prompts for:

1. authentication;
2. smart-account authorization where required;
3. an actual transaction.

The UI must show the user what action they are approving before a transaction is submitted.

---

## 5. Instadapp Smart Account boundary

The user's externally controlled wallet and the application's execution account are intentionally separated.

```text
             USER WALLET
        MetaMask / Phantom /
        Trust / WalletConnect
                 |
                 | authentication + authorization
                 v
        INSTA-FLOAN DApp
                 |
                 v
       Instadapp Smart Account
                 |
                 v
        Atomic DeFi execution
                 |
        +--------+--------+
        |        |        |
       DEX    Borrow    Repay
```

The exact Smart Account implementation and supported Instadapp execution primitive must be verified against the current Instadapp Developer Platform before production deployment.

---

## 6. Borrowing / flash-liquidity strategy registry

Initial strategy adapters:

1. Aave V3
2. Morpho
3. Spark
4. Compound III
5. Sky / Maker
6. Euler
7. Balancer flash liquidity
8. Uniswap V2 flash swap

Future adapters can include other lending markets and liquidity venues after their current deployments, interfaces, liquidity and risk characteristics have been verified.

A strategy adapter is not automatically enabled simply because a protocol is listed. The capability registry must verify the target chain, deployment, asset, liquidity and execution method.

---

## 7. Target-attainment engine

Target attainment is controlled by a state machine:

```text
TARGET_CONFIGURED
       |
       v
DISCOVER
       |
       v
QUOTE
       |
       v
SIMULATE
       |
       v
RISK_GATE
       |
       +---- fail ----> REJECT
       |
       v
EXECUTION_AUTHORIZATION
       |
       v
EXECUTE ATOMIC ROUTE
       |
       v
VERIFY RECEIPT + REALIZED PNL
       |
       v
TARGET REACHED?
      / \
    YES  NO
     |    |
    STOP  v
       DISCOVER NEXT ROUTE
```

### Profit gate

A route must satisfy:

```text
Net Executable Profit =
  Gross Output
- Flash-loan / borrowing fee
- DEX fees
- Gas
- Slippage
- Price impact
- Execution overhead
- Other applicable costs
- Required safety reserve
```

Only positive, executable opportunities above the configured minimum are eligible.

---

## 8. RPC and secrets

Ethereum RPC is supplied at runtime:

```bash
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<ALCHEMY_KEY>
```

Do **not** commit an Alchemy key to GitHub.

Use `.env.local`, Vercel Environment Variables, or another approved secret manager. `.env.example` should contain placeholders only.

The browser must never receive the private RPC credential if the provider requires it to remain server-side.

The application can use Ethereum JSON-RPC methods such as `eth_blockNumber`, `eth_call`, `eth_getBalance`, and gas/transaction methods for monitoring and simulation.

---

## 9. Cloud uptime architecture

```text
Vercel
 |
 +-- Web DApp
 +-- API routes
 +-- Health endpoint
 +-- Authentication boundary
 +-- Scanner orchestration
 +-- Scheduled heartbeat
 |
 +------> RPC provider
 |
 +------> Quote / simulation services
 |
 +------> Database / audit records
```

The cloud layer should monitor:

- RPC availability;
- latest block age;
- scanner status;
- strategy adapter health;
- quote freshness;
- simulation failures;
- execution state;
- target-attainment state.

Cloud uptime does **not** imply that trading is continuously enabled. Trading remains subject to the execution kill switch and all risk gates.

---

## 10. Execution safety

Default:

```text
LIVE_EXECUTION=false
```

Production execution requires all of the following:

- correct chain;
- correct verified contract addresses;
- valid wallet authorization;
- valid Smart Account configuration;
- sufficient liquidity;
- successful pre-trade simulation;
- **independently verified atomic repayment enforcement by the selected lender/connector**;
- the required repayment amount is encoded in the transaction path;
- gas and slippage within limits;
- net profit above configured threshold;
- risk limits satisfied;
- execution kill switch disabled;
- user authorization for the transaction.

A successful simulation alone is **not** accepted as repayment proof. A post-transaction token balance is also not accepted as proof because an atomic flash-loan route may repay the lender before the final balance is observed. The repayment-enforcement property must be explicitly verified for the exact lender/connector integration before it can participate in any future live authorization decision.

If any gate fails, the system does not trade.

---

## 11. Recommended project layers

```text
app/
  dashboard/
  api/
    health/
    auth/
    opportunities/
    simulate/
    execute/

lib/
  wallets/
  auth/
  instadapp/
  strategies/
  arbitrage/
  risk/
  rpc/
  simulation/
  target-engine/

contracts/
  execution/
  interfaces/
  libraries/

tests/
  unit/
  fork/
  integration/

config/
  chains/
  strategies/
  assets/
```

---

## 12. Development phases

### Phase 1 — Foundation

- Next.js dashboard
- EVM wallet connector abstraction
- authentication/session boundary
- RPC health
- strategy registry
- target configuration

### Phase 2 — Market intelligence

- live quotes
- DEX discovery
- liquidity checks
- gas estimation
- route scoring

### Phase 3 — Fork simulation

- transaction construction
- flash-liquidity simulation
- repayment validation
- slippage testing
- realized PnL calculation

### Phase 4 — Instadapp integration

- Smart Account configuration
- supported flash-loan/extension integration
- atomic operation construction
- authorization flow

### Phase 5 — Controlled execution

- execution allow-list
- small-size test transactions
- monitoring
- automatic stop conditions
- target-attainment accounting

### Phase 6 — Production cloud operation

- Vercel deployment
- protected environment variables
- persistent monitoring
- alerting
- audit trail
- operational dashboard

---

## 13. Non-negotiable operating principles

1. **No seed phrase collection.**
2. **No private keys committed to Git.**
3. **No trade solely because a price spread exists.**
4. **No execution without simulation.**
5. **No acceptance of negative expected net profit.**
6. **No cross-route loss averaging.**
7. **No automatic bypass of wallet authorization.**
8. **No assumption that a protocol is available on every chain.**
9. **No production execution while contract/address validation is incomplete.**
10. **No repayment proof from a caller-supplied final balance.**
11. **No live authorization unless the exact lender/connector repayment-enforcement semantics have been independently verified.**
12. **Target attainment stops when the target is reached or when risk conditions invalidate further execution.**

---

## 14. Current status

The repository currently represents the simulation-first application foundation. The local-fork simulator now requires successful transaction receipts and explicit snapshot restoration, while repayment proof is fail-closed unless lender/connector atomic-revert enforcement has been independently verified.

The pinned Instadapp Instapool V4 connector source confirms that `flashPayback` reads the repayment amount from Instamemory and performs a `safeTransfer` to the configured InstaPool address. That verifies the connector-side transfer mechanism, but it does **not by itself establish the complete lender-side repayment/revert invariant**. The latter remains a required verification gate before live authorization.

The next implementation milestone is therefore to build an explicit fork-pre-execution path around the verified Instadapp route envelope, validate the exact lender-side atomic repayment behavior on a controlled fork, and only then consider any live authorization layer.

**Never paste an active private key, seed phrase, or production RPC credential into source files, issues, README files, or commits.**
