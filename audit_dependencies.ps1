# audit_dependencies.ps1 - Auditoría de Dependencias y Actualizaciones para ÁRBOL by KLIK
$ErrorActionPreference = "Continue" # Evita que los códigos de salida informativos detengan el flujo

# Determinar la raíz del proyecto de forma segura
$ScriptRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptRoot)) {
    $ScriptRoot = Get-Location
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   AUDITORÍA DE DEPENDENCIAS Y ACTUALIZACIONES - ÁRBOL   " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Auditoría del Ecosistema Node.js / NPM
Write-Host "`n[1/2] Analizando dependencias de Node.js (package.json)..." -ForegroundColor Yellow

if (Test-Path (Join-Path $ScriptRoot "package.json")) {
    # Evitar error ENOLOCK asegurando la existencia de package-lock.json
    $LockFile = Join-Path $ScriptRoot "package-lock.json"
    if (-not (Test-Path $LockFile)) {
        Write-Host "ℹ No se encontró 'package-lock.json'. Intentando generar un lockfile rápido..." -ForegroundColor Cyan
        npm install --package-lock-only 2>$null
    }

    # Comprobar vulnerabilidades conocidas de seguridad
    Write-Host "Ejecutando 'npm audit' para detectar problemas de seguridad..." -ForegroundColor Gray
    if (Test-Path $LockFile) {
        npm audit
    } else {
        Write-Warning "⚠ Saltando 'npm audit': no se puede auditar sin un archivo 'package-lock.json' válido."
    }
    
    # Comprobar actualizaciones de librerías
    Write-Host "`nEjecutando 'npm outdated' para detectar librerías desactualizadas..." -ForegroundColor Gray
    # Nota: 'npm outdated' devuelve código de salida 1 cuando hay paquetes desactualizados, lo manejamos limpiamente
    $outdatedRaw = npm outdated 2>$null
    
    if ($LASTEXITCODE -eq 0 -and [string]::IsNullOrEmpty($outdatedRaw)) {
        Write-Host "✔ ¡Todas las dependencias de Node.js están al día!" -ForegroundColor Green
    } else {
        Write-Host "Se encontraron las siguientes actualizaciones disponibles:" -ForegroundColor Yellow
        npm outdated
    }
} else {
    Write-Warning "⚠ No se encontró package.json en la raíz del proyecto."
}

# 2. Auditoría del Ecosistema Go Modules
Write-Host "`n[2/2] Analizando módulos de Go (go.mod)..." -ForegroundColor Yellow

if (Test-Path (Join-Path $ScriptRoot "go.mod")) {
    Write-Host "Ejecutando 'go list' para verificar actualizaciones en dependencias..." -ForegroundColor Gray
    
    # go list -m -u all lista todos los módulos con sus actualizaciones disponibles indicadas entre corchetes []
    $goOutdated = go list -m -u all 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "✖ Error al ejecutar 'go list'. Asegúrate de que Go está configurado correctamente."
    } else {
        # Filtrar solo las líneas que muestran actualizaciones disponibles (contienen corchetes '[')
        $updatesFound = $goOutdated | Where-Object { $_ -match "\[" }
        
        if ($updatesFound) {
            Write-Host "Se encontraron las siguientes actualizaciones para módulos de Go:" -ForegroundColor Yellow
            foreach ($update in $updatesFound) {
                Write-Host "  - $update" -ForegroundColor Cyan
            }
        } else {
            Write-Host "✔ ¡Todas las dependencias de Go están al día!" -ForegroundColor Green
        }
    }
} else {
    Write-Warning "⚠ No se encontró go.mod en la raíz del proyecto."
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "             AUDITORÍA COMPLETADA CON ÉXITO              " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan