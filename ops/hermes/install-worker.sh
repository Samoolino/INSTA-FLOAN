#!/usr/bin/env bash
set -euo pipefail

# Hermes Agent is an operator-controlled sidecar, not a Vercel/browser dependency.
# Official project: https://github.com/NousResearch/hermes-agent
# Official installer: https://hermes-agent.nousresearch.com/install.sh

HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
INSTALLER_URL="https://hermes-agent.nousresearch.com/install.sh"

printf '%s\n' '[INSTA-FLOAN] Installing Hermes Agent sidecar...'
printf '%s\n' '[INSTA-FLOAN] Hermes is intentionally isolated from live-money authorization.'

if ! command -v curl >/dev/null 2>&1; then
  echo 'curl is required.' >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo 'git is required.' >&2
  exit 1
fi

mkdir -p "$HERMES_HOME"
TMP_SCRIPT="$(mktemp)"
trap 'rm -f "$TMP_SCRIPT"' EXIT

curl -fsSL "$INSTALLER_URL" -o "$TMP_SCRIPT"
bash "$TMP_SCRIPT"

export PATH="$HOME/.local/bin:$PATH"

if ! command -v hermes >/dev/null 2>&1; then
  echo 'Hermes installation completed but the hermes command is not on PATH.' >&2
  echo 'Reload your shell with: source ~/.bashrc' >&2
  exit 1
fi

hermes doctor || true

printf '%s\n' '' '[INSTA-FLOAN] Hermes installed.'
printf '%s\n' '[INSTA-FLOAN] Next: run `hermes setup` or `hermes model`.'
printf '%s\n' '[INSTA-FLOAN] Do NOT provide Hermes with private keys, withdrawal-enabled exchange keys, or the production execution authorization token.'
