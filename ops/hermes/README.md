# Hermes Agent sidecar

Hermes Agent is integrated as an operator-controlled persistent worker for INSTA-FLOAN. It is **not** installed into the Vercel browser bundle and is not part of the live-money authorization path.

Official Hermes Agent repository: https://github.com/NousResearch/hermes-agent

Official documentation: https://hermes-agent.nousresearch.com/docs/

## Install

### Linux / macOS / WSL2

```bash
cd ~/INSTA-FLOAN
git pull origin main
chmod +x ops/hermes/install-worker.sh
./ops/hermes/install-worker.sh
```

### Native Windows

Run PowerShell from the repository:

```powershell
cd .\INSTA-FLOAN
git pull origin main
Set-ExecutionPolicy -Scope Process Bypass
.\ops\hermes\install-worker.ps1
```

The native Windows installer is included in the repository. Hermes' official installer supports a separate native-Windows path.

## Configure

After installation:

```text
hermes setup
```

or choose a model directly:

```text
hermes model
```

For the INSTA-FLOAN worker, begin with read-only/diagnostic capabilities:

- inspect repository state;
- inspect scanner output;
- inspect Hummingbot health;
- analyze opportunity quality;
- prepare audit/evidence reports;
- propose remediation actions.

Do not grant Hermes:

- wallet private keys;
- seed phrases;
- exchange withdrawal permission;
- unrestricted production execution tokens;
- autonomous transaction submission authority.

## MCP boundary

Hermes supports MCP servers. If MCP is enabled for this project, expose only the minimum read/diagnostic tools required for the worker. Do not place secrets in repository configuration.

A project-local MCP configuration should remain a template; actual credentials belong in the operator's Hermes configuration under `~/.hermes/`.

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
    +-- kill switch
    |
    v
Hummingbot / DEX execution boundary
```

Hermes is therefore an **agentic operations/assurance layer**, not an authorization bypass.
