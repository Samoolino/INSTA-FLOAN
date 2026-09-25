# Hermes Agent sidecar

Hermes Agent is integrated as an operator-controlled persistent worker for INSTA-FLOAN. It is **not** installed into the Vercel browser bundle.

Official Hermes Agent repository: https://github.com/NousResearch/hermes-agent

Official documentation: https://hermes-agent.nousresearch.com/docs/

## Install

On the persistent Linux/WSL2/macOS worker:

```bash
cd ~/INSTA-FLOAN
git pull origin main
chmod +x ops/hermes/install-worker.sh
./ops/hermes/install-worker.sh
```

The official installer supports Linux, macOS, WSL2 and Android/Termux; native Windows has a separate installer path.

## Configure

After installation:

```bash
hermes setup
# or
hermes model
```

Hermes supports multiple model providers and MCP servers.

For this project, start with **read-only/diagnostic capabilities**:

- inspect repository state;
- inspect scanner output;
- inspect Hummingbot health;
- analyze opportunity quality;
- prepare audit/evidence reports;
- propose remediation actions.

Do not grant:

- wallet private keys;
- seed phrases;
- exchange withdrawal permission;
- unrestricted production execution tokens;
- autonomous transaction submission authority.

## Intended architecture

```text
Hermes Agent
    |
    +-- GitHub/MCP diagnostics
    +-- INSTA-FLOAN scanner diagnostics
    +-- Hummingbot health/market diagnostics
    +-- Audit/evidence generation
    |
    v
INSTA-FLOAN Control Plane
    |
    v
ExecutionTruth
    |
    +-- controlled fork
    +-- risk
    +-- profitability
    +-- slippage/gas
    +-- wallet authorization
    +-- explicit production authorization
    |
    v
Hummingbot / DEX execution boundary
```

Hermes is therefore an **agentic operations/assurance layer**, not an authorization bypass.
