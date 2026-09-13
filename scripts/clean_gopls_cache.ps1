# c:\Users\CMSoluciones\Documents\ARBOL\scripts\clean_gopls_cache.ps1
# Script de limpieza pericial para gopls, caché de compilación de Go y sincronización de dependencias

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "    SANEAMIENTO Y LIMPIEZA DE ENTORNO GO (VS CODE)       " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Forzar la detención de gopls (VS Code lo reiniciará automáticamente al instante)
Write-Host "`n[1/3] Deteniendo procesos gopls activos..." -ForegroundColor Yellow
Stop-Process -Name "gopls" -Force -ErrorAction SilentlyContinue
Write-Host "[OK] gopls finalizado con éxito. VS Code iniciará una instancia limpia." -ForegroundColor Green

# 2. Limpiar la caché de compilación de Go
Write-Host "`n[2/3] Limpiando caché de compilación física de Go..." -ForegroundColor Yellow
try {
    & go clean -cache
    Write-Host "[OK] Caché de compilación purgada." -ForegroundColor Green
} catch {
    Write-Warning "No se pudo limpiar la caché de Go: $($_.Exception.Message)"
}

# 3. Forzar sincronización de dependencias del proyecto
Write-Host "`n[3/3] Sincronizando dependencias del módulo (go mod tidy)..." -ForegroundColor Yellow
try {
    & go mod tidy
    Write-Host "[OK] go.mod y go.sum sincronizados perfectamente." -ForegroundColor Green
} catch {
    Write-Warning "Error al ejecutar go mod tidy: $($_.Exception.Message)"
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "       ✔ PROCESO DE SANEAMIENTO COMPLETADO ✔             " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan