# build.ps1
# Script de compilacion maestro para ÁRBOL by KLIK (Validacion Criptografica y Desktop Activa)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptRoot = $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($ScriptRoot)) {
    $ScriptRoot = (Get-Location).Path
}

Set-Location $ScriptRoot

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "          INICIANDO BUILD - ÁRBOL BY KLIK               " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# ============================================================
# 1. NODE / GO / WAILS
# ============================================================

$portableNodeDir = Join-Path $ScriptRoot ".node\node-v22.12.0-win-x64"

if (Test-Path (Join-Path $portableNodeDir "node.exe")) {
    $env:PATH = "$portableNodeDir;$env:PATH"
}

Write-Host ""
Write-Host "[1/5] Verificando herramientas..." -ForegroundColor Yellow

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw "Node.js no está disponible."
}

$goCommand = Get-Command go -ErrorAction SilentlyContinue
if (-not $goCommand) {
    throw "Go no está disponible."
}

$wailsCommand = Get-Command wails -ErrorAction SilentlyContinue
if (-not $wailsCommand) {
    throw "Wails no está disponible. Ejecuta: go install github.com/wailsapp/wails/v2/cmd/wails@latest"
}

$nodeVersion = node -v 2>&1
$goVersion   = go version 2>&1
$wailsVersion = wails version 2>&1

Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "[OK] Go: $goVersion" -ForegroundColor Green
Write-Host "[OK] Wails: $wailsVersion" -ForegroundColor Green

# ============================================================
# 2. TYPESCRIPT
# ============================================================

Write-Host ""
Write-Host "[2/5] Compilando ecosistema TypeScript..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -ne 0) {
    throw "La compilación TypeScript falló."
}

Write-Host "[OK] TypeScript compilado correctamente." -ForegroundColor Green

$DesktopBackend = Join-Path $ScriptRoot "dist\api\desktop_server.js"
if (-not (Test-Path $DesktopBackend)) {
    throw "TypeScript terminó, pero no generó el backend desktop esperado: $DesktopBackend"
}
Write-Host "[OK] Backend local desktop generado." -ForegroundColor Green

# ============================================================
# 3. GO
# ============================================================

Write-Host ""
Write-Host "[3/5] Procesando ecosistema Go..." -ForegroundColor Yellow

Write-Host "Ejecutando go mod tidy..." -ForegroundColor Gray

go mod tidy

if ($LASTEXITCODE -ne 0) {
    throw "go mod tidy falló."
}

Write-Host "Ejecutando go vet ./..." -ForegroundColor Gray

go vet ./...

if ($LASTEXITCODE -ne 0) {
    throw "go vet falló."
}

Write-Host "[OK] Go Vet superado." -ForegroundColor Green

$binDir = Join-Path $ScriptRoot "bin"

if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$services = @(
    "audit",
    "delivery",
    "gateway",
    "image",
    "reader",
    "result",
    "security",
    "storage",
    "study"
)

Write-Host ""
Write-Host "Compilando microservicios Go..." -ForegroundColor Gray

foreach ($service in $services) {

    $entrypoint = Join-Path $ScriptRoot "cmd\$service\main.go"
    $outputBinary = Join-Path $binDir "$service.exe"

    if (-not (Test-Path $entrypoint)) {
        throw "No existe el punto de entrada requerido: $entrypoint"
    }

    Write-Host " -> [$service] => bin\$service.exe" -ForegroundColor Gray

    go build -o $outputBinary $entrypoint

    if ($LASTEXITCODE -ne 0) {
        throw "La compilación Go falló para: $service"
    }

    if (-not (Test-Path $outputBinary)) {
        throw "Go no generó el binario esperado: $outputBinary"
    }
}

Write-Host "[OK] Microservicios Go compilados." -ForegroundColor Green

# ============================================================
# 4. BASE DE DATOS
# ============================================================

Write-Host ""
Write-Host "[4/5] Verificando base de datos local..." -ForegroundColor Yellow

$dbPath = Join-Path $ScriptRoot "backups\arbol_dev.db"

if (Test-Path $dbPath) {

    $size = (Get-Item $dbPath).Length / 1KB

    Write-Host "[OK] Base de datos encontrada." -ForegroundColor Green
    Write-Host "     $dbPath" -ForegroundColor Gray
    Write-Host "     $([Math]::Round($size, 2)) KB" -ForegroundColor Gray

}
else {

    Write-Warning "Base de datos de desarrollo no encontrada: $dbPath"
}

# ============================================================
# 5. WAILS DESKTOP
# ============================================================

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "              COMPILANDO DESKTOP WAILS                  " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$WailsJson = Join-Path $ScriptRoot "wails.json"

if (-not (Test-Path $WailsJson)) {
    throw "No existe wails.json: $WailsJson"
}

Write-Host "[INFO] Ejecutando wails build..." -ForegroundColor Yellow

$DesktopExe = Join-Path $ScriptRoot "build\bin\ARBOL-by-KLIK.exe"
if (Test-Path $DesktopExe) {
    Remove-Item $DesktopExe -Force
}

wails build

if ($LASTEXITCODE -ne 0) {
    throw "wails build falló con código $LASTEXITCODE."
}

if (-not (Test-Path $DesktopExe)) {

    Write-Host ""
    Write-Host "[ERROR] Wails no generó el ejecutable esperado:" -ForegroundColor Red
    Write-Host "        $DesktopExe" -ForegroundColor Red

    Write-Host ""
    Write-Host "Contenido de build\bin:" -ForegroundColor Yellow

    Get-ChildItem `
        -Path (Join-Path $ScriptRoot "build\bin") `
        -File `
        -ErrorAction SilentlyContinue |
        ForEach-Object {
            Write-Host "  $($_.Name)" -ForegroundColor White
        }

    throw "No se generó ARBOL-by-KLIK.exe."
}

$DesktopInfo = Get-Item $DesktopExe

$DesktopHash = Get-FileHash `
    -Path $DesktopExe `
    -Algorithm SHA256

Write-Host ""
Write-Host "[OK] Aplicación desktop generada." -ForegroundColor Green
Write-Host "     $DesktopExe" -ForegroundColor White
Write-Host "     Tamaño: $($DesktopInfo.Length) bytes" -ForegroundColor Gray
Write-Host "     SHA256: $($DesktopHash.Hash)" -ForegroundColor Gray

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Green
Write-Host "        ✔ COMPILACIÓN Y VERIFICACIÓN EXITOSA ✔          " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

exit 0