# c:\Users\CMSoluciones\Documents\ARBOL\scripts\relocate_files.ps1
# Script de Reubicación de Archivos Fuera de su Nivel Jerárquico en /PLACES
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Determinar la raíz del proyecto de forma robusta buscando hacia arriba el archivo package.json
$StartPath = $PSScriptRoot
if ([string]::IsNullOrEmpty($StartPath)) {
    $StartPath = Get-Location
}

$ScriptRoot = $StartPath
while ($null -ne $ScriptRoot -and $ScriptRoot -ne "") {
    if (Test-Path (Join-Path $ScriptRoot "package.json")) {
        break
    }
    $Parent = Split-Path -Path $ScriptRoot -Parent
    if ($Parent -eq $ScriptRoot) {
        $ScriptRoot = $StartPath
        break
    }
    $ScriptRoot = $Parent
}

$PlacesRoot = Join-Path $ScriptRoot "PLACES"
$DefaultHome = Join-Path $PlacesRoot "CountryExample\StateExample\LocalityExample"
$PlacesRootNormalized = $PlacesRoot.TrimEnd('\').TrimEnd('/')

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "    REUBICACIÓN AUTOMÁTICA DE ARCHIVOS FUERA DE LUGAR   " -ForegroundColor Cyan
Write-Host "                    ÁRBOL BY KLIK                      " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Directorio maestro: $PlacesRoot" -ForegroundColor Yellow
Write-Host "Destino de reubicación seguro: PLACES\CountryExample\StateExample\LocalityExample" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $PlacesRoot)) {
    Write-Error "✖ Error crítico: El directorio maestro '/PLACES' no existe."
    exit 1
}

# Asegurar que el hogar por defecto exista físicamente
if (-not (Test-Path $DefaultHome)) {
    New-Item -ItemType Directory -Path $DefaultHome -Force | Out-Null
    Write-Host "[OK] Creado directorio de destino seguro: PLACES\CountryExample\StateExample\LocalityExample" -ForegroundColor Green
}

# 1. Buscar todos los archivos bajo PLACES
$AllFiles = Get-ChildItem -Path $PlacesRoot -Recurse -File -ErrorAction SilentlyContinue
$MisplacedFiles = @()

foreach ($File in $AllFiles) {
    $RelativePath = $File.FullName.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
    $Parts = $RelativePath -split '[\\/]' | Where-Object { $_ -ne "" }
    $Depth = $Parts.Count - 1

    if ($Depth -lt 3) {
        $MisplacedFiles += $File
    }
}

if ($MisplacedFiles.Count -eq 0) {
    Write-Host "✔ Excelente: Todos los archivos se encuentran en su nivel jerárquico correcto (Nivel >= 3)." -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Cyan
    exit 0
}

Write-Host "Se detectaron $($MisplacedFiles.Count) archivos fuera de su localidad estándar. Procediendo a reubicación..." -ForegroundColor Yellow
Write-Host ""

$MovedCount = 0
foreach ($File in $MisplacedFiles) {
    $SourceRelative = $File.FullName.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
    $TargetFile = Join-Path $DefaultHome $File.Name
    
    # Resolver colisiones de nombres añadiendo un sufijo incremental
    if (Test-Path $TargetFile) {
        $BaseName = $File.BaseName
        $Extension = $File.Extension
        $Counter = 1
        while (Test-Path $TargetFile) {
            $TargetFile = Join-Path $DefaultHome "$BaseName`_$Counter$Extension"
            $Counter++
        }
    }

    # Mover físicamente el archivo
    Move-Item -Path $File.FullName -Destination $TargetFile -Force
    
    $DestRelative = $TargetFile.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
    Write-Host " -> [REUBICADO]: PLACES\$SourceRelative`n              => PLACES\$DestRelative" -ForegroundColor Green
    $MovedCount++
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  ✔ SANEAMIENTO COMPLETADO: Se reubicaron $MovedCount archivos." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan