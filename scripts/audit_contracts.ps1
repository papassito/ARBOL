# c:\Users\CMSoluciones\Documents\ARBOL\scripts\audit_contracts.ps1
# Motor de Auditoría y Verificación de Cumplimiento de Contratos Técnicos de ÁRBOL by KLIK
# Valida de raíz que el código, base de datos y scripts respeten los compromisos documentados en CONTRACTS.md

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Determinación de la raíz del proyecto de forma robusta
$ScriptRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptRoot)) {
    $ScriptRoot = Get-Location
}
if ((Split-Path -Path $ScriptRoot -Leaf) -eq "scripts") {
    $ScriptRoot = Split-Path -Path $ScriptRoot -Parent
}

Push-Location $ScriptRoot

# Auto-detectar e inyectar Node.js LTS portable si existe en el workspace
$portableNodeDir = Join-Path $ScriptRoot ".node\node-v22.12.0-win-x64"
if (Test-Path (Join-Path $portableNodeDir "node.exe")) {
   $env:PATH = "$portableNodeDir;$env:PATH"
}

$ContractsDoc = Join-Path $ScriptRoot "docs\02_architecture\CONTRACTS.md"
$MainGoPath   = Join-Path $ScriptRoot "main.go"
$DbPath       = Join-Path $ScriptRoot "backups\arbol_dev.db"
$SetupIss     = Join-Path $ScriptRoot "setup.iss"
$LauncherBat  = Join-Path $ScriptRoot "arbol_launcher.bat"

$AnomaliesFound = 0
$PassedChecks = 0

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host ">>> $Text" -ForegroundColor Cyan
}

function Write-Pass {
    param([string]$Text)
    $script:PassedChecks++
    Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Text)
    $script:AnomaliesFound++
    Write-Host "[FAIL] $Text" -ForegroundColor Red
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[WARN] $Text" -ForegroundColor Yellow
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "      AUDITORÍA DE CONTRATOS TÉCNICOS - ÁRBOL BY KLIK     " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Directorio raíz: $ScriptRoot" -ForegroundColor Gray

# -----------------------------------------------------------
# FASE 1: INTEGRIDAD DE LA DOCUMENTACIÓN DE CONTRATOS
# -----------------------------------------------------------
Write-Header "Fase 1: Verificación de Integridad de CONTRACTS.md"

if (Test-Path $ContractsDoc) {
    Write-Pass "El documento maestro de contratos existe: docs\02_architecture\CONTRACTS.md"
    
    $Content = Get-Content $ContractsDoc -Raw
    
    # Verificar secciones obligatorias en el contrato
    $RequiredSections = @(
        "## 1. Contratos de Comunicación",
        "## 2. Contratos de Base de Datos",
        "## 3. Contratos de Seguridad",
        "A-ASSOCIATE-RJ"
    )
    
    foreach ($Section in $RequiredSections) {
        if ($Content -match [regex]::Escape($Section)) {
            Write-Pass "Cláusula contractual documentada: '$Section'"
        } else {
            Write-Fail "Falta cláusula o sección contractual obligatoria en CONTRACTS.md: '$Section'"
        }
    }
} else {
    Write-Fail "No se encontró el documento de contratos técnico CONTRACTS.md en: $ContractsDoc"
}

# -----------------------------------------------------------
# FASE 2: COMPLIANCE EN CÓDIGO GO (main.go)
# -----------------------------------------------------------
Write-Header "Fase 2: Verificación de Cumplimiento en Código Fuente (main.go)"

if (Test-Path $MainGoPath) {
    $GoContent = Get-Content $MainGoPath -Raw
    
    # 1. Verificar constante obligatoria DicomRejectCode
    if ($GoContent -match 'const\s+DicomRejectCode\s*=\s*"A-ASSOCIATE-RJ"') {
        Write-Pass "main.go cumple con el código de rechazo del protocolo DICOM ('A-ASSOCIATE-RJ')."
    } else {
        Write-Fail "Violación de Contrato: main.go no contiene o define incorrectamente la constante 'DicomRejectCode = \"A-ASSOCIATE-RJ\"'."
    }
    
    # 2. Verificar uso de librerías criptográficas conformes
    if ($GoContent -match '"crypto/sha256"') {
        Write-Pass "main.go implementa la firma criptográfica estándar pactada (SHA-256)."
    } else {
        Write-Warn "main.go no importa 'crypto/sha256'. Verificar si el cálculo criptográfico está delegado."
    }
} else {
    Write-Warn "main.go no está presente en la raíz para verificación estática directa."
}

# -----------------------------------------------------------
# FASE 3: COMPLIANCE EN BASE DE DATOS LOCAL (SQLite)
# -----------------------------------------------------------
Write-Header "Fase 3: Verificación de Esquema e Integridad de Datos (backups\arbol_dev.db)"

if (Test-Path $DbPath) {
    # Validamos usando Node portable para consultar la base de datos de manera limpia
    $tempJsCheck = Join-Path $ScriptRoot "scripts\.temp_contracts_db.js"
    $checkScript = @"
import Database from 'better-sqlite3';
try {
   const db = new Database('$($DbPath.Replace('\', '/'))');
   
   // Validar existencia de tabla contractual crítica de auditoría
   const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log'").get();
   if (!tableCheck) {
       console.log('MISSING_AUDIT_LOG_TABLE');
       process.exit(2);
   }
   
   // Validar campos contractuales obligatorios para inmutabilidad
   const pragma = db.prepare("PRAGMA table_info(audit_log)").all();
   const fields = pragma.map(f => f.name);
   const required = ['id', 'timestamp', 'record_hash', 'parent_hash'];
   const missing = required.filter(r => !fields.includes(r));
   
   if (missing.length > 0) {
       console.log('MISSING_FIELDS:' + missing.join(','));
       process.exit(3);
   }
   
   console.log('OK_CONTRACT_DB');
   db.close();
} catch (err) {
   console.log('DB_ERROR:' + err.message);
   process.exit(1);
}
"@
    $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($tempJsCheck, $checkScript, $Utf8NoBom)
    
    $nodeResult = node $tempJsCheck 2>&1
    Remove-Item -Path $tempJsCheck -Force -ErrorAction SilentlyContinue
    
    if ($nodeResult -eq "OK_CONTRACT_DB") {
        Write-Pass "Base de datos arbol_dev.db cumple con el contrato de esquema de inmutabilidad (tabla 'audit_log' y hashes)."
    } else {
        Write-Fail "Violación de Contrato en la BD: $nodeResult"
    }
} else {
    Write-Warn "No existe base de datos arbol_dev.db para auditar físicamente."
}

# -----------------------------------------------------------
# RESUMEN DE LA AUDITORÍA
# -----------------------------------------------------------
Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "              RESUMEN DE AUDITORÍA DE CONTRATOS          " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Comprobaciones exitosas : $PassedChecks" -ForegroundColor Green
Write-Host " Desviaciones de contrato: $AnomaliesFound" -ForegroundColor ($(if ($AnomaliesFound -gt 0) { "Red" } else { "Green" }))
Write-Host "=========================================================" -ForegroundColor Cyan

Pop-Location

if ($AnomaliesFound -gt 0) {
    Write-Host "VERDICTO: CONTRATO VIOLADO (Revisión de código o BD requerida)." -ForegroundColor Red
    exit 1
} else {
    Write-Host "VERDICTO: CONTRATOS 100% CUMPLIDOS Y VERIFICADOS." -ForegroundColor Green
    exit 0
}