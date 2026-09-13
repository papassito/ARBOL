# forensic_audit.ps1 - Auditoría Periférica Forense, Lógica y Profunda para ÁRBOL by KLIK
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Determinar la raíz del proyecto de forma segura
$ScriptRoot = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptRoot)) {
   $ScriptRoot = Get-Location
}
if ((Split-Path -Path $ScriptRoot -Leaf) -eq "scripts") {
   $ScriptRoot = Split-Path -Path $ScriptRoot -Parent
}

# Auto-detectar e inyectar Node.js LTS portable si existe en el workspace
$portableNodeDir = Join-Path $ScriptRoot ".node\node-v22.12.0-win-x64"
if (Test-Path (Join-Path $portableNodeDir "node.exe")) {
   $env:PATH = "$portableNodeDir;$env:PATH"
}

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   AUDITORÍA PERIFÉRICA, FORENSE Y LÓGICA DE SISTEMA    " -ForegroundColor Cyan
Write-Host "                    ÁRBOL BY KLIK                      " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# FASE 1: Higiene del Entorno de Ejecución
Write-Host "`n[FASE 1/5] Verificando legitimidad de motores de ejecución..." -ForegroundColor Yellow
$nodePath = Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
$goPath = Get-Command go -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

if ($nodePath) {
   Write-Host " -> Binario Node activo: $nodePath" -ForegroundColor Gray
} else {
   Write-Error "✖ No se detecta un binario activo de Node.js."
}
if ($goPath) {
   Write-Host " -> Binario Go activo:   $goPath" -ForegroundColor Gray
}

# FASE 2: Firma Física de la Base de Datos (Magic Bytes Verification)
Write-Host "`n[FASE 2/5] Analizando estructura física del archivo SQLite..." -ForegroundColor Yellow
$dbPath = Join-Path $ScriptRoot "backups/arbol_dev.db"

if (Test-Path $dbPath) {
   $fileSize = (Get-Item $dbPath).Length
   Write-Host " -> Archivo detectado: $dbPath ($($fileSize / 1KB) KB)" -ForegroundColor Gray
   
   # Leer cabecera física de forma segura con tolerancia a bloqueos activos (FileShare.ReadWrite)
   $stream = New-Object System.IO.FileStream($dbPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
   try {
       $buffer = New-Object byte[] 16
       $null = $stream.Read($buffer, 0, 16)
   } finally {
       $stream.Close()
   }
   
   $hexHeader = ($buffer | ForEach-Object { "{0:X2}" -f $_ }) -join " "
   # Estándar SQLite format 3: 53 51 4c 69 74 65 20 66 6f 72 6d 61 74 20 33 00
   if ($hexHeader -eq "53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00") {
       Write-Host "✔ Magic Bytes validados: Coincide con la firma física legítima de SQLite v3." -ForegroundColor Green
   } else {
       Write-Error "✖ ALERTA FORENSE: El archivo backups/arbol_dev.db no posee firma SQLite válida. Posible corrupción o suplantación."
   }
} else {
   Write-Host "ℹ No existe base de datos física en backups/. Se omiten análisis físicos." -ForegroundColor Cyan
}

# FASE 3: Consistencia Lógica y Verificación de Cadena de Hashes (Audit Log)
Write-Host "`n[FASE 3/5] Comprobando integridad relacional y cadena criptográfica..." -ForegroundColor Yellow

if (Test-Path $dbPath) {
   # Generamos un archivo JS temporal para realizar las consultas de integridad física
   $tempJsCheck = Join-Path $ScriptRoot "scripts/.temp_forensic_db.js"
   $checkScript = @"
import Database from 'better-sqlite3';
import crypto from 'crypto';

try {
   const db = new Database('$($dbPath.Replace('\', '/'))');
   
   // 1. Verificar corrupción física interna
   const integrity = db.prepare('PRAGMA integrity_check').get();
   if (integrity.integrity_check !== 'ok') {
       console.log('CRITICAL_CORRUPTION: ' + JSON.stringify(integrity));
       process.exit(2);
   }
   
   // 2. Verificar inconsistencias de llaves foráneas
   const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
   if (fkCheck.length > 0) {
       console.log('FK_VIOLATION: ' + JSON.stringify(fkCheck));
       process.exit(3);
   }
   
   // 3. Verificar inmutabilidad criptográfica en audit_log
   const logs = db.prepare('SELECT * FROM audit_log ORDER BY timestamp ASC').all();
   let computedParentHash = null;
   
   for (let i = 0; i < logs.length; i++) {
       const log = logs[i];
       
       // Re-calcular hash del registro
       const payload = log.id + log.timestamp + log.user_identity + log.action_type + 
                       log.entity_name + log.entity_id + (log.payload_before || '') + 
                       log.payload_after + log.justification + (log.parent_hash || '');
                       
       const hash = crypto.createHash('sha256').update(payload).digest('hex');
       
       if (hash !== log.record_hash) {
           console.log('LOG_TAMPERED: Registro ID ' + log.id + ' ha sido modificado. Hash guardado: ' + log.record_hash + ', Calculado: ' + hash);
           process.exit(4);
       }
       
       if (i > 0 && log.parent_hash !== computedParentHash) {
           console.log('LOG_CHAIN_BROKEN: Ruptura en la secuencia temporal en el registro ' + log.id);
           process.exit(5);
       }
       
       computedParentHash = log.record_hash;
   }
   
   console.log('OK_INTEGRITY');
   db.close();
} catch (err) {
   console.log('ERROR: ' + err.message);
   process.exit(1);
}
"@
   $Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
   [System.IO.File]::WriteAllText($tempJsCheck, $checkScript, $Utf8NoBom)
   
   # Ejecutar la verificación lógica con el Node activo
   $jsResult = node $tempJsCheck 2>&1
   Remove-Item -Path $tempJsCheck -Force -ErrorAction SilentlyContinue
   
   if ($jsResult -eq "OK_INTEGRITY") {
       Write-Host "✔ PRAGMA integrity_check: OK" -ForegroundColor Green
       Write-Host "✔ PRAGMA foreign_key_check: Sin violaciones de consistencia" -ForegroundColor Green
       Write-Host "✔ Cryptographic Audit Chain: Cadena de firmas inmutable y verificada sin alteraciones." -ForegroundColor Green
   } else {
       Write-Error "✖ ALERTA LÓGICA: $jsResult"
   }
} else {
   Write-Host "ℹ No existe base de datos física para análisis lógicos." -ForegroundColor Cyan
}

# FASE 4: Análisis Periférico de Archivos Estáticos (Type Spoofing Detection)
Write-Host "`n[FASE 4/5] Escaneando blob_store (Prevención de suplantación de extensiones)..." -ForegroundColor Yellow
$blobDirs = @("blob_store/photos", "blob_store/documents")

foreach ($dir in $blobDirs) {
   $fullDir = Join-Path $ScriptRoot $dir
   if (Test-Path $fullDir) {
       $files = Get-ChildItem -Path $fullDir -File -Recurse
       Write-Host " Analizando $dir ($($files.Count) archivos)..." -ForegroundColor Gray
       
       foreach ($file in $files) {
           if ($file.Length -eq 0) {
               Write-Warning " ⚠ Archivo vacío detectado: $($file.Name)"
               continue
           }
           
           # Leer los primeros 4 bytes para validar firmas de archivos comunes (Magic Numbers)
           $fs = [System.IO.File]::OpenRead($file.FullName)
           $fBuf = New-Object byte[] 4
           $null = $fs.Read($fBuf, 0, 4)
           $fs.Close()
           
           $fHex = ($fBuf | ForEach-Object { "{0:X2}" -f $_ }) -join ""
           $extension = $file.Extension.ToLower()
           
           # Validaciones de firmas conocidas
           if ($extension -eq ".jpg" -or $extension -eq ".jpeg") {
               if ($fHex.Substring(0,6) -ne "FFD8FF") {
                   Write-Error "✖ ALERTA FORENSE: Spoofing detectado en $($file.Name). Extensión JPG pero firma física incorrecta: $fHex"
               }
           }
           elseif ($extension -eq ".png") {
               if ($fHex -ne "89504E47") {
                   Write-Error "✖ ALERTA FORENSE: Spoofing detectado en $($file.Name). Extensión PNG pero firma física incorrecta: $fHex"
               }
           }
           elseif ($extension -eq ".pdf") {
               if ($fHex -ne "25504446") { # %PDF
                   Write-Error "✖ ALERTA FORENSE: Spoofing de formato en $($file.Name). Extensión PDF pero firma física incorrecta: $fHex"
               }
           }
       }
   } else {
        Write-Host " ℹ Canal de periférico '$dir' no inicializado." -ForegroundColor Cyan
   }
}

# FASE 5: Reporte de Conclusiones
Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "             AUDITORÍA FORENSE FINALIZADA               " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
