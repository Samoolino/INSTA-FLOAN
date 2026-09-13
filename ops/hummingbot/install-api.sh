#!/usr/bin/env bash
# INSTA-FLOAN Hummingbot API + PostgreSQL + EMQX worker bootstrap.
# Run on the persistent worker/VPS, never inside Vercel.
set -euo pipefail

HBOT_API_DIR="${HBOT_API_DIR:-$HOME/hummingbot-api}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker/Compose using your OS provider, then rerun."
  exit 1
fi

if [ ! -d "$HBOT_API_DIR/.git" ]; then
  git clone https://github.com/hummingbot/hummingbot-api.git "$HBOT_API_DIR"
fi

cd "$HBOT_API_DIR"
git fetch --tags --prune
if [ -n "${HBOT_API_REF:-}" ]; then
  git checkout "$HBOT_API_REF"
fi

make setup
make deploy

cat <<'EOF'
Hummingbot API worker installed.

The API is the CEX/OEMS control bridge for INSTA-FLOAN. Keep it private
behind Tailscale/private networking in production. Do not expose port 8000
publicly and do not put API credentials in NEXT_PUBLIC_* variables.

Required next steps:
  - configure API USERNAME/PASSWORD and CONFIG_PASSWORD;
  - connect exchange accounts with read + trade permissions only;
  - configure Gateway for DEX connectivity;
  - verify connector, token, network, liquidity and quote coverage;
  - run controlled-fork simulation before any production authorization.

INSTA-FLOAN remains the final risk, profitability, authorization and
kill-switch control plane. Live submission remains disabled by default.
EOF
