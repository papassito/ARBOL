# Script para crear la estructura de carpetas física basada en MAP.md
$ErrorActionPreference = "Stop"

$BasePath = Join-Path $PSScriptRoot "..\PLACES"
$Folders = @(
    "México\Sonora"
)

Write-Host "Iniciando creación de directorios para el catálogo geográfico (PLACES)..." -ForegroundColor Cyan
foreach ($Folder in $Folders) {
    $FullDirectoryPath = Join-Path $BasePath $Folder
    if (-not (Test-Path -Path $FullDirectoryPath)) {
        New-Item -Path $FullDirectoryPath -ItemType Directory -Force | Out-Null
        Write-Host "[OK] Creado: PLACES\$Folder" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Ya existe: PLACES\$Folder" -ForegroundColor Yellow
    }
}