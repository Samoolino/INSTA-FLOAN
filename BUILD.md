# INSTA-FLOAN Build & Distribution

INSTA-FLOAN uses a build-system style workflow so the same project can be operated as a web deployment, an installable PWA, or a future desktop/mobile shell without moving execution credentials into the client.

## Profiles

### `web`

Production Next.js deployment. The browser is the control/monitoring surface; transaction authorization remains wallet-mediated and server-side secrets are never exposed to the browser.

```bash
npm run build
npm start
```

### `pwa`

The web application can be installed from a supporting browser as an app-like experience. The PWA surface must remain a UI/control plane; it must never contain a private key or seed phrase.

### `desktop`

Reserved for a future Tauri/Electron wrapper. The wrapper should call the same web/API contracts and must not duplicate trading logic or embed credentials.

## Release pipeline

```text
source
  -> lint/typecheck/test
  -> production build
  -> controlled integration tests (opt-in Anvil only)
  -> release artifact
  -> web/PWA deployment
  -> optional desktop packaging
```

## Runtime safety profiles

`LIVE_EXECUTION=false` is the default and must remain the default in development, preview, CI, and downloadable artifacts.

A live profile is a separately controlled deployment concern. It must require explicit wallet authorization, verified chain/contract registry, successful simulation, independently verified atomic repayment enforcement, risk limits, profitability thresholds, slippage/gas limits, and an operator kill switch. The client bundle must never receive private keys or seed phrases.

## Docker

The repository includes a minimal container build for reproducible web deployment. Runtime configuration is supplied through environment variables; secrets must be injected by the hosting platform and never committed.

## Distribution rule

Every distributable artifact is a client/control-plane artifact. Trading authorization is an explicit, auditable runtime action and is never enabled merely because an application was installed or deployed.
