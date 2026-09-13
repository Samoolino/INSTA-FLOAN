#!/usr/bin/env bash
# INSTA-FLOAN persistent Hummingbot + Gateway worker bootstrap.
# Run on a dedicated Linux/VPS worker, NOT in Vercel.
# This installs official Hummingbot from its public repository and leaves
# live trading disabled until INSTA-FLOAN execution gates authorize it.
set -euo pipefail

HBOT_DIR="${HBOT_DIR:-$HOME/hummingbot}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker/Compose using your OS provider, then rerun."
  exit 1
fi

if [ ! -d "$HBOT_DIR/.git" ]; then
  git clone https://github.com/hummingbot/hummingbot.git "$HBOT_DIR"
fi

cd "$HBOT_DIR"
git fetch --tags --prune

# Keep the worker deterministic when HBOT_REF is supplied; otherwise use the
# checked-out default branch. Pin a tested release before production use.
if [ -n "${HBOT_REF:-}" ]; then
  git checkout "$HBOT_REF"
fi

make setup
make deploy
make link-cli

hbot --version

echo
cat <<'EOF'
Hummingbot worker installed.

NEXT:
  1. Configure Gateway production HTTPS/certificates.
  2. Set INSTA-FLOAN bridge URL/auth on the worker.
  3. Connect CEX accounts with read+trade permissions only.
  4. Verify DEX/network/token mappings and fresh quotes.
  5. Run controlled-fork simulations and obtain an attestation.

LIVE EXECUTION REMAINS DISABLED by INSTA-FLOAN policy until every required
execution gate passes and explicit authorization is supplied.
EOF
