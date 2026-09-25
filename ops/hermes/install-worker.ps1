$ErrorActionPreference = 'Stop'

# INSTA-FLOAN Hermes Agent sidecar installer for native Windows.
# Hermes remains outside the Vercel/browser bundle and outside the live-money
# authorization boundary.
$InstallerUrl = 'https://hermes-agent.nousresearch.com/install.ps1'

Write-Host '[INSTA-FLOAN] Installing Hermes Agent sidecar...'
Write-Host '[INSTA-FLOAN] Hermes is intentionally isolated from live-money authorization.'

$script = Invoke-RestMethod -Uri $InstallerUrl
Invoke-Expression $script

if (-not (Get-Command hermes -ErrorAction SilentlyContinue)) {
  Write-Error 'Hermes installation completed but the hermes command is not on PATH. Restart PowerShell and run: hermes doctor'
}

hermes doctor
Write-Host ''
Write-Host '[INSTA-FLOAN] Hermes installed.'
Write-Host '[INSTA-FLOAN] Next: run `hermes setup` or `hermes model`.'
Write-Host '[INSTA-FLOAN] Do NOT provide Hermes with private keys, withdrawal-enabled exchange keys, or the production execution authorization token.'
