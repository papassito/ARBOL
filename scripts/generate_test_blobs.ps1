# c:\Users\CMSoluciones\Documents\ARBOL\scripts\generate_test_blobs.ps1
# Generador de Archivos de Prueba (Válidos y Suplantados/Spoofed) para validación forense
$ErrorActionPreference = "Stop"

$ScriptRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptRoot)) {
    $ScriptRoot = Get-Location
}
if ((Split-Path -Path $ScriptRoot -Leaf) -eq "scripts") {
    $ScriptRoot = Split-Path -Path $ScriptRoot -Parent
}

$PhotosDir = Join-Path $ScriptRoot "blob_store/photos"
$DocsDir = Join-Path $ScriptRoot "blob_store/documents"

# Asegurar que existan los directorios
if (-not (Test-Path $PhotosDir)) { New-Item -ItemType Directory -Path $PhotosDir -Force | Out-Null }
if (-not (Test-Path $DocsDir)) { New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null }

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   GENERADOR DE BLOBS DE PRUEBA PARA ANÁLISIS FORENSE    " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Crear Archivos Válidos (Firmas correctas)
Write-Host "Generando archivos válidos con firmas (Magic Bytes) legítimas..." -ForegroundColor Yellow

# PNG Válido (Firma: 89 50 4E 47)
$ValidPngPath = Join-Path $PhotosDir "valid_avatar.png"
[byte[]]$PngBytes = 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
[System.IO.File]::WriteAllBytes($ValidPngPath, $PngBytes)
Write-Host " -> Creado PNG válido: $ValidPngPath" -ForegroundColor Green

# JPG Válido (Firma: FF D8 FF)
$ValidJpgPath = Join-Path $PhotosDir "valid_portrait.jpg"
[byte[]]$JpgBytes = 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46
[System.IO.File]::WriteAllBytes($ValidJpgPath, $JpgBytes)
Write-Host " -> Creado JPG válido: $ValidJpgPath" -ForegroundColor Green

# PDF Válido (Firma: 25 50 44 46 -> %PDF)
$ValidPdfPath = Join-Path $DocsDir "valid_deed.pdf"
[byte[]]$PdfBytes = 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34
[System.IO.File]::WriteAllBytes($ValidPdfPath, $PdfBytes)
Write-Host " -> Creado PDF válido: $ValidPdfPath" -ForegroundColor Green

# 2. Crear Archivos Suplantados (Spoofed / Maliciosos para forzar detección)
Write-Host ""
Write-Host "Generando archivos suplantados (Spoofed) para pruebas de detección..." -ForegroundColor Yellow

# PNG Spoofed (Tiene firma de executable MZ pero con extensión .png)
$SpoofedPngPath = Join-Path $PhotosDir "spoofed_malware.png"
[byte[]]$FakePngBytes = 0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00
[System.IO.File]::WriteAllBytes($SpoofedPngPath, $FakePngBytes)
Write-Host " -> Creado PNG suplantado (cabecera ejecutable MZ): $SpoofedPngPath" -ForegroundColor Red

# PDF Spoofed (Archivo de texto plano renombrado a PDF)
$SpoofedPdfPath = Join-Path $DocsDir "spoofed_ransomware.pdf"
[byte[]]$FakePdfBytes = 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68
[System.IO.File]::WriteAllBytes($SpoofedPdfPath, $FakePdfBytes)
Write-Host " -> Creado PDF suplantado (cabecera texto plano): $SpoofedPdfPath" -ForegroundColor Red

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " ✔ Blobs de prueba generados exitosamente." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan