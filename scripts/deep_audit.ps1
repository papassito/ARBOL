# Script de Auditoría Profunda para ÁRBOL by KLIK
# Diseñado para verificar la integridad del baseline documental,
# la total ausencia de contaminación de datos específicos de prueba, y la consistencia de archivos.

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Definir la ruta del proyecto
$ProjectRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($ProjectRoot)) {
    $ProjectRoot = Get-Location
}

# Si el script está ubicado dentro de la carpeta 'scripts', subimos un nivel para encontrar la raíz del proyecto
if ((Split-Path -Path $ProjectRoot -Leaf) -eq "scripts") {
    $ProjectRoot = Split-Path -Path $ProjectRoot -Parent
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "    ÁRBOL by KLIK - SCRIPT DE AUDITORÍA PROFUNDA" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Directorio de análisis: $ProjectRoot" -ForegroundColor Yellow
Write-Host ""

# 1. Mapear de forma ordenada los 30 documentos requeridos del baseline estable
$DocMapping = @{
    "README.md"          = ""
    "ROADMAP.md"         = ""
    "CHANGELOG.md"       = ""
    "GOVERNANCE.md"      = "01_governance"
    "PRIVACY.md"         = "01_governance"
    "SECURITY.md"        = "01_governance"
    "AUDIT.md"           = "01_governance"
    "ARCHITECTURE.md"    = "02_architecture"
    "COMPONENTS.md"      = "02_architecture"
    "CONTRACTS.md"       = "02_architecture"
    "DATABASE.md"        = "02_architecture"
    "DATA_MODEL.md"      = "02_architecture"
    "REQUIREMENTS.md"    = "03_specifications"
    "WORKFLOWS.md"       = "03_specifications"
    "GLOSSARY.md"        = "03_specifications"
    "INNO.md"            = "03_specifications"
    "IDENTITY.md"        = "04_domain"
    "RELATIONSHIPS.md"   = "04_domain"
    "SOURCES.md"         = "04_domain"
    "EVIDENCE.md"        = "04_domain"
    "PROVENANCE.md"      = "04_domain"
    "API.md"             = "05_interfaces"
    "UI.md"              = "05_interfaces"
    "AI.md"              = "05_interfaces"
    "PHOTO.md"           = "05_interfaces"
    "DOCUMENTS.md"       = "05_interfaces"
    "MAP.md"             = "05_interfaces"
    "IMPORT_EXPORT.md"   = "06_operations"
    "SEARCH.md"          = "06_operations"
    "MATCHING.md"        = "06_operations"
}

# 2. Lista de términos contaminantes prohibidos en el baseline normativo
$ForbiddenTerms = @(
    "ForbiddenTermA", "ForbiddenTermB", "ForbiddenTermC"
)

# Precompilar expresiones regulares para mejorar el rendimiento del escaneo
$CompiledRegexes = @{}
foreach ($Term in $ForbiddenTerms) {
    $CompiledRegexes[$Term] = [regex]::new("\b$([regex]::Escape($Term))\b", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

$FileStatus = @{}
$ContaminationFound = $false
$MissingFilesCount = 0
$ContaminatedFilesCount = 0

Write-Host "--- [FASE 1: VERIFICACIÓN DE EXISTENCIA DEL BASELINE (30 MDs)] ---" -ForegroundColor Blue

# Verificar caso de duplicados en sistemas sensibles a mayúsculas (ej: MAP.md vs map.md)
$RootMdFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.md" | Where-Object { $_.FullName -notmatch '\\(node_modules|\.node|\.git)\\' }
$DocsMdFiles = Get-ChildItem -Path (Join-Path $ProjectRoot "docs") -Filter "*.md" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\(node_modules|\.node|\.git)\\' }
$AllFiles = ($RootMdFiles + $DocsMdFiles) | Select-Object -ExpandProperty Name
$DuplicateCheck = $AllFiles | Group-Object | Where-Object { $_.Count -gt 1 }
if ($DuplicateCheck) {
    Write-Host "[ALERTA] Se detectaron posibles duplicados de nombre de archivo con diferencias de mayúsculas/minúsculas:" -ForegroundColor Red
    foreach ($dup in $DuplicateCheck) {
        Write-Host "  - $($dup.Name)" -ForegroundColor Red
    }
}

foreach ($Doc in $DocMapping.Keys) {
    $SubFolder = $DocMapping[$Doc]
    if ($SubFolder -eq "") {
        $DocPath = Join-Path $ProjectRoot $Doc
    } else {
        $DocPath = Join-Path $ProjectRoot "docs\$SubFolder\$Doc"
    }

    if (Test-Path -Path $DocPath) {
        $FileStatus[$Doc] = "Presente"
        if ($SubFolder -eq "") {
            Write-Host "[OK] Presente: $Doc" -ForegroundColor Green
        } else {
            Write-Host "[OK] Presente: docs\$SubFolder\$Doc" -ForegroundColor Green
        }
    } else {
        # Búsqueda insensible a mayúsculas/minúsculas para reportar si existe bajo otra variante
        $MatchingFiles = $AllFiles | Where-Object { $_ -eq $Doc }
        if ($MatchingFiles) {
            $FileStatus[$Doc] = "CaseMismatch ($($MatchingFiles))"
            Write-Host "[ADVERTENCIA] Diferencia de mayúsculas/minúsculas: Se esperaba '$Doc', se encontró '$($MatchingFiles)'" -ForegroundColor Yellow
        } else {
            $FileStatus[$Doc] = "Faltante"
            Write-Host "[ERROR] FALTANTE: $Doc" -ForegroundColor Red
            $MissingFilesCount++
        }
    }
}

Write-Host ""
Write-Host "--- [FASE 2: BÚSQUEDA DE CONTAMINACIÓN DE DATOS FAMILIARES] ---" -ForegroundColor Blue
Write-Host "Escaneando todos los archivos .md en busca de términos prohibidos..." -ForegroundColor Yellow

# Obtener archivos Markdown de forma eficiente evitando indexar directorios pesados de dependencias
$FilesToScan = Get-ChildItem -Path $ProjectRoot | 
    Where-Object { $_.Name -notmatch '^(node_modules|\.git|\.node)$' } |
    ForEach-Object {
        if ($_.PSIsContainer) {
            Get-ChildItem -Path $_.FullName -Filter "*.md" -Recurse -File -ErrorAction SilentlyContinue
        } elseif ($_.Name -like "*.md") {
            $_
        }
    }

foreach ($File in $FilesToScan) {
    $Content = Get-Content -Path $File.FullName -Raw
    if ($null -eq $Content) { continue }

    $FileContaminated = $false
    $FoundTermsInFile = @()

    foreach ($Term in $ForbiddenTerms) {
        if ($CompiledRegexes[$Term].IsMatch($Content)) {
            $FileContaminated = $true
            $FoundTermsInFile += $Term
        }
    }

    if ($FileContaminated) {
        $RelativePath = Resolve-Path -Path $File.FullName -Relative
        Write-Host "[ALERTA CONTAMINACIÓN] $RelativePath contiene: ($($FoundTermsInFile -join ', '))" -ForegroundColor Red
        $ContaminatedFilesCount++
        $ContaminationFound = $true
    }
}

if (-not $ContaminationFound) {
    Write-Host "[OK] No se encontró contaminación de datos familiares reales en los archivos del baseline." -ForegroundColor Green
}

Write-Host ""
Write-Host "--- [FASE 3: INTEGRIDAD FÍSICA Y ESTRUCTURA DE CARPETAS] ---" -ForegroundColor Blue

$PlacesPath = Join-Path $ProjectRoot "PLACES"
if (Test-Path -Path $PlacesPath) {
    Write-Host "[OK] Carpeta 'PLACES' existente." -ForegroundColor Green
    
    $ContaminatedFolders = @("CountryExample\StateExample\ForbiddenPlaceA", "CountryExample\StateExample\ForbiddenPlaceB")
    foreach ($Folder in $ContaminatedFolders) {
        $CheckPath = Join-Path $PlacesPath $Folder
        if (Test-Path -Path $CheckPath) {
            Write-Host "[CRÍTICO] Carpeta física prohibida detectada: PLACES\$Folder" -ForegroundColor Red
            $ContaminatedFilesCount++
        }
    }
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "                  RESUMEN DE AUDITORÍA" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
$MissingColor = if ($MissingFilesCount -gt 0) { "Red" } else { "Green" }
$ContaminationColor = if ($ContaminatedFilesCount -gt 0) { "Red" } else { "Green" }
Write-Host "Archivos Faltantes: $MissingFilesCount / 30" -ForegroundColor $MissingColor
Write-Host "Elementos con Contaminación: $ContaminatedFilesCount" -ForegroundColor $ContaminationColor

if ($MissingFilesCount -eq 0 -and $ContaminatedFilesCount -eq 0) {
    Write-Host ""
    Write-Host "VERDICTO: BASELINE SANEADO, SEGURO Y COMPLETO" -ForegroundColor Green
    Write-Host "El proyecto ÁRBOL by KLIK cumple al 100% las directrices de pureza genérica." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "VERDICTO: ACCIÓN REQUERIDA" -ForegroundColor Red
    Write-Host "Se deben corregir los elementos marcados en rojo para cumplir con la separación de datos." -ForegroundColor Red
}
Write-Host "=========================================================" -ForegroundColor Cyan