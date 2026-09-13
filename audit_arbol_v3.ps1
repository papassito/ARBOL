<#
================================================================================
  ÁRBOL by KLIK :: MOTOR DE AUDITORÍA BASELINE DOCUMENTAL v3.1
  "Verificación de Evidencia, Integridad Markdown y Normativa Zero Synthetic"
================================================================================
#>

param(
    [string]$Root = "."
)

$ErrorActionPreference = "Continue"
$RepoRoot = (Resolve-Path $Root).Path
Set-Location $RepoRoot

$BaselineDocs = @(
    "README.md",
    "ARCHITECTURE.md",
    "REQUIREMENTS.md",
    "CONTRACTS.md",
    "MAP.md",
    "SECURITY.md"
)

$ForbiddenTerms = @(
    "ForbiddenTermA",
    "ForbiddenTermB"
)

$Findings = @()
$PassedChecks = 0

function Add-Finding {
    param(
        [string]$Code,
        [string]$Category,
        [string]$Description,
        [ValidateSet("INFO","LOW","MEDIUM","HIGH","CRITICAL")]
        [string]$Severity,
        [string]$EvidenceScope = "",
        [string]$Evidence = ""
    )

    $script:Findings += [PSCustomObject]@{
        Code          = $Code
        Category      = $Category
        Description   = $Description
        Severity      = $Severity
        EvidenceScope = $EvidenceScope
        Evidence      = $Evidence
        Timestamp     = (Get-Date).ToString("o")
    }
}

function Add-Pass {
    param([string]$Message)
    $script:PassedChecks++
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Show-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Show-Fail { param([string]$Message) Write-Host "[FAIL] $Message" -ForegroundColor Red }
function Show-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }

Clear-Host
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host " 🌳 ÁRBOL by KLIK :: MOTOR DE AUDITORÍA BASELINE DOCUMENTAL v3.1" -ForegroundColor Cyan
Write-Host "    'Trazabilidad, Preservación e Integridad de Evidencia'" -ForegroundColor DarkCyan
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repositorio: $RepoRoot" -ForegroundColor Gray

# 1. BASELINE DOCUMENTAL
Write-Host ""
Show-Info "[FASE 1] Verificando baseline de 6 documentos sagrados..."

foreach ($doc in $BaselineDocs) {
    $rootPath = Join-Path $RepoRoot $doc
    # Buscar recursivamente bajo la carpeta docs\ para tolerar subdirectorios ordenados
    $foundPath = Get-ChildItem -Path (Join-Path $RepoRoot "docs") -Filter $doc -Recurse -File -ErrorAction SilentlyContinue

    if ($doc -eq "README.md" -and (Test-Path $rootPath)) {
        Add-Pass "[NORMATIVA] Encontrado legítimamente en raíz: $doc"
    } elseif ($null -ne $foundPath) {
        $RelativePath = $foundPath.FullName.Substring($RepoRoot.Length).TrimStart('\')
        Add-Pass "[NORMATIVA] Encontrado correctamente en: $RelativePath"
    } else {
        Add-Finding -Code "ARBOL-DOC-001" -Category "MISSING_BASELINE_DOC" -Description "No se encontró el documento baseline $doc." -Severity "CRITICAL" -EvidenceScope $doc
        Show-Fail "[NORMATIVA] Ausente: $doc"
    }
}

# 2. FORMATO Y ARCHIVOS VACÍOS
Write-Host ""
Show-Info "[FASE 2] Analizando formato, BOM UTF-8 y archivos vacíos..."

$AllFiles = Get-ChildItem -Path $RepoRoot | 
    Where-Object { $_.Name -notmatch '^(node_modules|\.git|\.node)$' } |
    ForEach-Object {
        if ($_.PSIsContainer) {
            Get-ChildItem -Path $_.FullName -Recurse -File -ErrorAction SilentlyContinue
        } else {
            $_
        }
    }

$MdFiles = @($AllFiles | Where-Object { $_.Extension -eq ".md" })

$AllowedEmptyFiles = @(".npmrc", "__init__.py", "py.typed", ".ignore", "_update-notifier-last-checked")

foreach ($file in $AllFiles) {
    if ($file.Name -in $AllowedEmptyFiles) {
        continue
    }
    if ($file.Length -eq 0) {
        Add-Finding -Code "ARBOL-FILE-EMPTY" -Category "EMPTY_FILE" -Description "Archivo de longitud cero detectado." -Severity "MEDIUM" -EvidenceScope $file.FullName
        Show-Warn "[LIMPIEZA] Archivo vacío detectado: $($file.Name)"
    }

    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            Add-Finding -Code "ARBOL-BOM-001" -Category "UTF8_BOM" -Description "Archivo con marca BOM UTF-8." -Severity "LOW" -EvidenceScope $file.FullName
        }
    } catch {}
}

Add-Pass "[FORMATO] Evaluados $($MdFiles.Count) archivos Markdown en el repositorio."

# 3. CONTAMINACIÓN DE DATOS
Write-Host ""
Show-Info "[FASE 3] Escaneando datos no autorizados / contaminación..."

$ContaminationFound = $false
foreach ($term in $ForbiddenTerms) {
    $matches = Select-String -Path ($MdFiles.FullName) -Pattern "\b$term\b" -ErrorAction SilentlyContinue
    if ($matches) {
        $ContaminationFound = $true
        foreach ($m in $matches) {
            Add-Finding -Code "ARBOL-CONTAM-001" -Category "FORBIDDEN_TERM" -Description "Término no permitido '$term' hallado en baseline documental." -Severity "HIGH" -EvidenceScope "$($m.Filename):$($m.LineNumber)" -Evidence $m.Line.Trim()
            Show-Fail "[CONTAMINACIÓN] Hallado '$term' en $($m.Filename):$($m.LineNumber)"
        }
    }
}

if (-not $ContaminationFound) {
    Add-Pass "[PUREZA] Cero contaminación de ubicaciones o términos no autorizados."
}

# 4. PRINCIPIOS RECTORES
Write-Host ""
Show-Info "[FASE 4] Verificando presencia explícita de principios ZERO SYNTHETIC / ZERO AI..."

$ReadmePath = Join-Path $RepoRoot "README.md"
if (Test-Path $ReadmePath) {
    $readmeContent = Get-Content $ReadmePath -Raw
    
    if ($readmeContent -match "ZERO SYNTHETIC") {
        Add-Pass "[PRINCIPIO] Declaración ZERO SYNTHETIC confirmada."
    } else {
        Add-Finding -Code "ARBOL-RECTOR-001" -Category "MISSING_PRINCIPLE" -Description "Falta declaración ZERO SYNTHETIC en README.md." -Severity "HIGH"
        Show-Fail "[PRINCIPIO] ZERO SYNTHETIC no encontrado en README.md."
    }

    if ($readmeContent -match "ZERO AI") {
        Add-Pass "[PRINCIPIO] Declaración ZERO AI sobre evidencia histórica confirmada."
    } else {
        Add-Finding -Code "ARBOL-RECTOR-002" -Category "MISSING_PRINCIPLE" -Description "Falta declaración ZERO AI en README.md." -Severity "HIGH"
        Show-Fail "[PRINCIPIO] ZERO AI no encontrado en README.md."
    }
}

# RESUMEN Y ESTADO GLOBAL
$HighErrors = @($Findings | Where-Object { $_.Severity -in @("HIGH", "CRITICAL") }).Count
$Warnings   = @($Findings | Where-Object { $_.Severity -in @("LOW", "MEDIUM") }).Count

$Status = if ($HighErrors -gt 0) { "FAIL" } elseif ($Warnings -gt 0) { "PASS_WITH_WARNINGS" } else { "PASS" }

Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "               RESUMEN PERICIAL ÁRBOL by KLIK v3.1" -ForegroundColor Cyan
Write-Host "=========================================================================="
Write-Host (" Archivos Inspeccionados       : {0}" -f $AllFiles.Count)
Write-Host (" Documentos Markdown (.md)    : {0}" -f $MdFiles.Count)
Write-Host (" Comprobaciones Aprobadas     : {0}" -f $PassedChecks)
Write-Host (" Advertencias (LOW/MEDIUM)    : {0}" -f $Warnings)
Write-Host (" Errores (HIGH/CRITICAL)      : {0}" -f $HighErrors)
Write-Host ""

switch ($Status) {
    "PASS" { Write-Host " Estado Global                 : PASS" -ForegroundColor Green }
    "PASS_WITH_WARNINGS" { Write-Host " Estado Global                 : PASS_WITH_WARNINGS" -ForegroundColor Yellow }
    default { Write-Host " Estado Global                 : FAIL" -ForegroundColor Red }
}
Write-Host "=========================================================================="

$ReportPath = Join-Path $RepoRoot "audit_report_arbol.json"
$Report = [PSCustomObject]@{
    Timestamp = (Get-Date).ToString("o")
    Status    = $Status
    Metrics   = [PSCustomObject]@{
        TotalFiles   = $AllFiles.Count
        MdFiles      = $MdFiles.Count
        PassedChecks = $PassedChecks
        HighErrors   = $HighErrors
        Warnings     = $Warnings
    }
    Findings  = $Findings
}
$Report | ConvertTo-Json -Depth 5 | Set-Content -Path $ReportPath -Encoding UTF8
Write-Host "`n[REPORTE JSON] $ReportPath" -ForegroundColor Green
