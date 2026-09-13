param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Command,

    [Parameter(ValueFromRemainingArguments = $true, Position = 1)]
    [string[]]$CommandArgs
)

# Runs a command with the bundled Node.js LTS first in PATH.
$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$PortableNodeDir = Join-Path $ProjectRoot ".node\node-v22.12.0-win-x64"

if (-not (Test-Path (Join-Path $PortableNodeDir "node.exe"))) {
    throw "No se encontró Node.js LTS portable en: $PortableNodeDir. Ejecuta .\use_lts.ps1 o reinstala el paquete completo."
}

$env:PATH = "$PortableNodeDir;$env:PATH"
$env:npm_config_cache = Join-Path $ProjectRoot ".npm-cache"
$env:npm_config_update_notifier = "false"

& $Command @CommandArgs
exit $LASTEXITCODE
