#!/usr/bin/env bash
# Verify the persistent Hummingbot + Gateway worker without enabling trading.
set -euo pipefail

HBOT_DIR="${HBOT_DIR:-$HOME/hummingbot}"
API_URL="${HUMMINGBOT_API_URL:-http://localhost:8000}"
GATEWAY_URL="${HUMMINGBOT_GATEWAY_URL:-http://localhost:15888}"

fail=0
check() {
  if "$@" >/dev/null 2>&1; then
    printf 'OK   %s\n' "$*"
  else
    printf 'FAIL %s\n' "$*"
    fail=1
  fi
}

check command -v docker
check test -d "$HBOT_DIR/.git"
check docker info
check docker ps --format '{{.Names}}'
check curl -fsS "$API_URL/"
check curl -fsS "$GATEWAY_URL/"

if command -v hbot >/dev/null 2>&1; then
  check hbot --version
else
  printf 'WARN hbot CLI not linked; run make link-cli in %s\n' "$HBOT_DIR"
fi

printf '\nExecution policy check:\n'
printf 'HUMMINGBOT_BRIDGE_ENABLED=%s\n' "${HUMMINGBOT_BRIDGE_ENABLED:-false}"
printf 'HUMMINGBOT_LIVE_TRADING_ENABLED=%s\n' "${HUMMINGBOT_LIVE_TRADING_ENABLED:-false}"
printf 'HUMMINGBOT_EXECUTION_AUTHORIZED=%s\n' "${HUMMINGBOT_EXECUTION_AUTHORIZED:-false}"
printf 'LIVE_EXECUTION=%s\n' "${LIVE_EXECUTION:-false}"
printf 'PRODUCTION_KILL_SWITCH_ENABLED=%s\n' "${PRODUCTION_KILL_SWITCH_ENABLED:-true}"

if [ "$fail" -ne 0 ]; then
  exit 1
fi

printf '\nWorker reachable. This verification does not authorize live execution.\n'
