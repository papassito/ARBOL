# use_lts.ps1 - Configuración portable de Node.js LTS para solucionar la instalación de better-sqlite3
$ErrorActionPreference = "Stop"

$ScriptRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptRoot)) {
    $ScriptRoot = Get-Location
}

$NodeFolder = Join-Path $ScriptRoot ".node"
$ZipPath = Join-Path $ScriptRoot "node-lts.zip"
$NodeVersion = "v22.12.0"
$DownloadUrl = "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-win-x64.zip"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "        CONFIGURACIÓN PORTABLE DE NODE.JS LTS            " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Descargar Node LTS Portable si no existe
if (-not (Test-Path $NodeFolder)) {
    New-Item -ItemType Directory -Path $NodeFolder | Out-Null
}

$ExtractedFolder = Join-Path $NodeFolder "node-$NodeVersion-win-x64"

if (-not (Test-Path (Join-Path $ExtractedFolder "node.exe"))) {
    Write-Host "Descargando Node.js LTS portable ($NodeVersion) de forma directa..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
    
    Write-Host "Extrayendo archivos binarios en el espacio de trabajo..." -ForegroundColor Yellow
    Expand-Archive -Path $ZipPath -DestinationPath $NodeFolder -Force
    
    Remove-Item -Path $ZipPath -Force
    Write-Host "✔ Entorno portable descargado con éxito." -ForegroundColor Green
} else {
    Write-Host "✔ Entorno portable detectado localmente." -ForegroundColor Green
}

# 2. Inyectar temporalmente el Node LTS en el PATH de la sesión actual
Write-Host "`nInyectando Node.js LTS en la sesión actual de PowerShell..." -ForegroundColor Cyan
$env:PATH = "$ExtractedFolder;$env:PATH"

Write-Host "Versión de Node activa:" -ForegroundColor Yellow
node --version

# 3. Recrear dependencias limpiamente
Write-Host "`nLimpiando instalaciones previas corruptas..." -ForegroundColor Yellow
Remove-Item -Path (Join-Path $ScriptRoot "node_modules") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Ejecutando 'npm install' con binarios precompilados estables..." -ForegroundColor Green
npm install

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "      ✔ ENTREGABLE DE ENTORNO PORTABLE INSTALADO CON LTS ✔ " -ForegroundColor Green
Write-Host " Puedes ejecutar 'npm run dev' o 'npm run build' con total seguridad." -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Green