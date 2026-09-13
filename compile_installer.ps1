# compile_installer.ps1
# ÁRBOL by KLIK
# COMPILADOR + VERIFICADOR REAL DE RELEASE WINDOWS
#
# Arquitectura esperada:
#   build.ps1 -> compila frontend/backend/Wails
#   build\bin\ARBOL-by-KLIK.exe -> aplicación desktop principal
#   setup.iss -> empaqueta aplicación + backend local
#   installer\arbol_by_klik_installer.exe -> instalador final
#
# REGLAS:
#
# - NO desactiva Kaspersky
# - NO desactiva Defender
# - NO modifica firewall
# - NO agrega exclusiones
# - NO mata procesos ajenos por nombre
# - SOLO detiene procesos iniciados por esta prueba
# ================================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ================================================================
# CONFIGURACION BASE
# ================================================================

$ProjectRoot = $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Get-Location).Path
}

$BuildScript = Join-Path `
    $ProjectRoot `
    "build.ps1"

$SetupIssPath = Join-Path `
    $ProjectRoot `
    "setup.iss"

$DesktopExePath = Join-Path `
    $ProjectRoot `
    "build\bin\ARBOL-by-KLIK.exe"

$InstallerDir = Join-Path `
    $ProjectRoot `
    "installer"

$InstallerName = "arbol_by_klik_installer.exe"

$InstallerPath = Join-Path `
    $InstallerDir `
    $InstallerName

$TestInstallDir = Join-Path `
    $env:LOCALAPPDATA `
    "ARBOL_BY_KLIK_TEST"

$DiagnosticRoot = Join-Path `
    $ProjectRoot `
    "diagnostics"

$RunStamp = Get-Date -Format "yyyyMMdd_HHmmss"

$DiagnosticDir = Join-Path `
    $DiagnosticRoot `
    $RunStamp

$ReportFile = Join-Path `
    $DiagnosticDir `
    "installer_diagnostic.txt"

$PreStdOut = Join-Path `
    $DiagnosticDir `
    "desktop_preinstall_stdout.log"

$PreStdErr = Join-Path `
    $DiagnosticDir `
    "desktop_preinstall_stderr.log"

$InstalledStdOut = Join-Path `
    $DiagnosticDir `
    "desktop_installed_stdout.log"

$InstalledStdErr = Join-Path `
    $DiagnosticDir `
    "desktop_installed_stderr.log"

$InnoInstallLog = Join-Path `
    $DiagnosticDir `
    "inno_install.log"

$FinalStatus = "FAIL"

$PreProcess = $null
$InstalledProcess = $null

$PushLocationActive = $false

# ================================================================
# FUNCIONES
# ================================================================

function Write-Section {

    param(
        [string]$Title
    )

    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan
}

function Write-Step {

    param(
        [string]$Message
    )

    Write-Host ""
    Write-Host $Message -ForegroundColor Yellow
}

function Add-Diagnostic {

    param(
        [string]$Message
    )

    try {

        $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"

        Add-Content `
            -Path $ReportFile `
            -Value "[$Timestamp] $Message" `
            -Encoding UTF8
    }
    catch {
        # El log nunca debe ocultar el error principal.
    }
}

function Wait-BeforeClose {

    param(
        [string]$Message = "Presiona ENTER para continuar..."
    )

    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor DarkGray
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor DarkGray

    Read-Host | Out-Null
}

function Stop-OwnedProcess {

    param(
        [System.Diagnostics.Process]$Process,
        [string]$Name
    )

    if ($null -eq $Process) {
        return
    }

    try {

        $Process.Refresh()

        if (-not $Process.HasExited) {

            Write-Host "[INFO] Deteniendo proceso de prueba: $Name PID=$($Process.Id)" -ForegroundColor Gray

            Stop-Process `
                -Id $Process.Id `
                -Force `
                -ErrorAction SilentlyContinue

            try {
                $Process.WaitForExit(3000)
            }
            catch {}

            Add-Diagnostic "Proceso detenido: $Name PID=$($Process.Id)"
        }
    }
    catch {}
}

function Show-ProcessOutput {

    param(
        [string]$StdOut,
        [string]$StdErr
    )

    if (Test-Path $StdErr) {

        $ErrContent = Get-Content `
            $StdErr `
            -ErrorAction SilentlyContinue

        if ($ErrContent) {

            Write-Host ""
            Write-Host "================ STDERR ================" -ForegroundColor DarkYellow

            foreach ($Line in $ErrContent) {

                Write-Host $Line -ForegroundColor Red
                Add-Diagnostic "STDERR: $Line"
            }
        }
    }

    if (Test-Path $StdOut) {

        $OutContent = Get-Content `
            $StdOut `
            -ErrorAction SilentlyContinue

        if ($OutContent) {

            Write-Host ""
            Write-Host "================ STDOUT ================" -ForegroundColor DarkYellow

            foreach ($Line in $OutContent) {

                Write-Host $Line -ForegroundColor Gray
                Add-Diagnostic "STDOUT: $Line"
            }
        }
    }
}

function Get-ExecutableInfo {

    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path $Path)) {

        throw "$Label no existe: $Path"
    }

    $Item = Get-Item $Path

    $Hash = Get-FileHash `
        -Path $Path `
        -Algorithm SHA256

    $Signature = Get-AuthenticodeSignature `
        -FilePath $Path

    Write-Host "[OK] $Label existe." -ForegroundColor Green
    Write-Host "     Ruta   : $Path" -ForegroundColor Gray
    Write-Host "     Tamaño : $($Item.Length) bytes" -ForegroundColor Gray
    Write-Host "     SHA256 : $($Hash.Hash)" -ForegroundColor Gray
    Write-Host "     Firma  : $($Signature.Status)" -ForegroundColor Gray

    Add-Diagnostic "$Label PATH=$Path"
    Add-Diagnostic "$Label SIZE=$($Item.Length)"
    Add-Diagnostic "$Label SHA256=$($Hash.Hash)"
    Add-Diagnostic "$Label SIGNATURE=$($Signature.Status)"

    if ($Signature.Status -eq "NotSigned") {

        Write-Host "[WARN] $Label no posee firma Authenticode." -ForegroundColor Yellow
        Add-Diagnostic "$Label no posee firma Authenticode."
    }

    return @{
        Item      = $Item
        Hash      = $Hash.Hash
        Signature = $Signature.Status
    }
}

function Test-DesktopProcess {

    param(
        [string]$ExePath,
        [string]$WorkingDirectory,
        [string]$StdOut,
        [string]$StdErr,
        [string]$Label,
        [int]$WaitSeconds = 8
    )

    Remove-Item `
        $StdOut `
        -Force `
        -ErrorAction SilentlyContinue

    Remove-Item `
        $StdErr `
        -Force `
        -ErrorAction SilentlyContinue

    Write-Host "[INFO] Iniciando $Label..." -ForegroundColor Gray

    try {

        $Process = Start-Process `
            -FilePath $ExePath `
            -WorkingDirectory $WorkingDirectory `
            -RedirectStandardOutput $StdOut `
            -RedirectStandardError $StdErr `
            -PassThru
    }
    catch {

        Add-Diagnostic "$Label no pudo iniciar: $($_.Exception.Message)"

        throw "$Label no pudo iniciarse: $($_.Exception.Message)"
    }

    Add-Diagnostic "$Label iniciado PID=$($Process.Id)"

    Write-Host "[OK] Windows creó el proceso. PID=$($Process.Id)" -ForegroundColor Green

    Start-Sleep `
        -Seconds $WaitSeconds

    try {
        $Process.Refresh()
    }
    catch {}

    if (-not (Test-Path $ExePath)) {

        Show-ProcessOutput `
            -StdOut $StdOut `
            -StdErr $StdErr

        throw "$Label desapareció del disco después del arranque."
    }

    if ($Process.HasExited) {

        $ExitCode = $null

        try {
            $ExitCode = $Process.ExitCode
        }
        catch {}

        Write-Host "[FAIL] $Label terminó prematuramente." -ForegroundColor Red
        Write-Host "ExitCode: $ExitCode" -ForegroundColor Red

        Add-Diagnostic "$Label terminó prematuramente. ExitCode=$ExitCode"

        Show-ProcessOutput `
            -StdOut $StdOut `
            -StdErr $StdErr

        throw "$Label no supera la prueba de supervivencia."
    }

    Write-Host "[OK] $Label permanece activo después de $WaitSeconds segundos." -ForegroundColor Green

    Add-Diagnostic "$Label permanece activo PID=$($Process.Id)"

    return $Process
}

# ================================================================
# CREAR AREA DE DIAGNOSTICO
# ================================================================

New-Item `
    -ItemType Directory `
    -Path $DiagnosticDir `
    -Force |
    Out-Null

Set-Content `
    -Path $ReportFile `
    -Value "ÁRBOL by KLIK - RELEASE DIAGNOSTIC`r`n" `
    -Encoding UTF8

# ================================================================
# EJECUCION PRINCIPAL
# ================================================================

try {

    Push-Location $ProjectRoot
    $PushLocationActive = $true

    Write-Section "ÁRBOL by KLIK - GENERADOR Y VERIFICADOR DE RELEASE"

    Write-Host "Proyecto:" -ForegroundColor Gray
    Write-Host "  $ProjectRoot" -ForegroundColor White

    Write-Host ""
    Write-Host "Diagnósticos:" -ForegroundColor Gray
    Write-Host "  $DiagnosticDir" -ForegroundColor White

    Add-Diagnostic "Inicio del proceso."
    Add-Diagnostic "ProjectRoot=$ProjectRoot"

    # ============================================================
    # 1. VERIFICAR ARCHIVOS FUNDAMENTALES
    # ============================================================

    Write-Step "[1/10] Verificando archivos fundamentales..."

    if (-not (Test-Path $BuildScript)) {

        throw "No existe build.ps1: $BuildScript"
    }

    if (-not (Test-Path $SetupIssPath)) {

        throw "No existe setup.iss: $SetupIssPath"
    }

    Write-Host "[OK] build.ps1" -ForegroundColor Green
    Write-Host "[OK] setup.iss" -ForegroundColor Green

    # ============================================================
    # 2. BUILD SIEMPRE
    # ============================================================

    Write-Step "[2/10] Ejecutando build maestro..."

    Add-Diagnostic "Ejecutando build.ps1."

    try {

        & $BuildScript

        if (-not $?) {

            throw "build.ps1 terminó indicando fallo."
        }
    }
    catch {

        Add-Diagnostic "build.ps1 lanzó error: $($_.Exception.Message)"

        throw
    }

    if (-not (Test-Path $DesktopExePath)) {

        throw "build.ps1 terminó, pero no generó ARBOL-by-KLIK.exe en: $DesktopExePath"
    }

    Write-Host "[OK] Build maestro completado." -ForegroundColor Green

    # ============================================================
    # 3. INFORMACION DEL EXE ORIGINAL
    # ============================================================

    Write-Step "[3/10] Validando ARBOL-by-KLIK.exe original..."

    $OriginalInfo = Get-ExecutableInfo `
        -Path $DesktopExePath `
        -Label "ARBOL-by-KLIK.exe ORIGINAL"

    # ============================================================
    # 4. PRUEBA REAL PRE-INSTALADOR
    # ============================================================

    Write-Step "[4/10] Probando aplicación desktop antes de empaquetar..."

    $DesktopWorkingDir = Split-Path `
        $DesktopExePath `
        -Parent

    $PreProcess = Test-DesktopProcess `
        -ExePath $DesktopExePath `
        -WorkingDirectory $DesktopWorkingDir `
        -StdOut $PreStdOut `
        -StdErr $PreStdErr `
        -Label "ARBOL-by-KLIK.exe ORIGINAL" `
        -WaitSeconds 8

    Write-Host "[OK] Aplicación desktop original supera prueba de arranque." -ForegroundColor Green

    # Solo detenemos el proceso creado por esta prueba.

    Stop-OwnedProcess `
        -Process $PreProcess `
        -Name "ARBOL-by-KLIK.exe ORIGINAL"

    $PreProcess = $null

    # ============================================================
    # 5. LOCALIZAR INNO SETUP
    # ============================================================

    Write-Step "[5/10] Localizando Inno Setup..."

    $InnoCandidates = @(

        "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        "C:\Program Files\Inno Setup 6\ISCC.exe",
        "C:\Program Files (x86)\Inno Setup 5\ISCC.exe"
    )

    $IsccPath = $null

    foreach ($Candidate in $InnoCandidates) {

        if (Test-Path $Candidate) {

            $IsccPath = $Candidate
            break
        }
    }

    if (-not $IsccPath) {

        $Command = Get-Command `
            "ISCC.exe" `
            -ErrorAction SilentlyContinue

        if ($Command) {

            $IsccPath = $Command.Source
        }
    }

    if (-not $IsccPath) {

        throw "No se encontró ISCC.exe de Inno Setup."
    }

    Write-Host "[OK] ISCC:" -ForegroundColor Green
    Write-Host "     $IsccPath" -ForegroundColor Gray

    Add-Diagnostic "ISCC=$IsccPath"

    # ============================================================
    # 6. COMPILAR INSTALADOR
    # ============================================================

    Write-Step "[6/10] Compilando instalador..."

    if (-not (Test-Path $InstallerDir)) {

        New-Item `
            -ItemType Directory `
            -Path $InstallerDir `
            -Force |
            Out-Null
    }

    if (Test-Path $InstallerPath) {

        Write-Host "[INFO] Eliminando instalador anterior..." -ForegroundColor Gray

        Remove-Item `
            $InstallerPath `
            -Force
    }

    & $IsccPath $SetupIssPath

    $InnoExitCode = $LASTEXITCODE

    Add-Diagnostic "ISCC ExitCode=$InnoExitCode"

    if ($InnoExitCode -ne 0) {

        throw "Inno Setup falló con código $InnoExitCode."
    }

    if (-not (Test-Path $InstallerPath)) {

        throw "Inno Setup terminó correctamente, pero no existe el instalador esperado: $InstallerPath"
    }

    Write-Host "[OK] Instalador generado." -ForegroundColor Green
    Write-Host "     $InstallerPath" -ForegroundColor Gray

    $InstallerInfo = Get-ExecutableInfo `
        -Path $InstallerPath `
        -Label "INSTALADOR"

    # ============================================================
    # 7. LIMPIAR INSTALACION TEMPORAL
    # ============================================================

    Write-Step "[7/10] Preparando instalación controlada..."

    if (Test-Path $TestInstallDir) {

        Write-Host "[INFO] Eliminando instalación temporal anterior..." -ForegroundColor Gray

        Remove-Item `
            $TestInstallDir `
            -Recurse `
            -Force `
            -ErrorAction Stop
    }

    # ============================================================
    # 8. INSTALAR
    # ============================================================

    Write-Step "[8/10] Ejecutando instalador en entorno controlado..."

    $InstallArguments = @(

        "/VERYSILENT",
        "/SUPPRESSMSGBOXES",
        "/NORESTART",
        "/SP-",
        "/DIR=$TestInstallDir",
        "/LOG=$InnoInstallLog"
    )

    try {

        $InstallProcess = Start-Process `
            -FilePath $InstallerPath `
            -ArgumentList $InstallArguments `
            -Wait `
            -PassThru
    }
    catch {

        Add-Diagnostic "Instalador no pudo iniciar: $($_.Exception.Message)"

        throw "El instalador no pudo iniciarse: $($_.Exception.Message)"
    }

    Add-Diagnostic "Installer ExitCode=$($InstallProcess.ExitCode)"

    if ($InstallProcess.ExitCode -ne 0) {

        throw "La instalación terminó con código $($InstallProcess.ExitCode)."
    }

    if (-not (Test-Path $TestInstallDir)) {

        throw "El instalador terminó, pero la carpeta de instalación no fue creada."
    }

    Write-Host "[OK] Instalación controlada completada." -ForegroundColor Green

    # ============================================================
    # 9. VALIDAR EJECUTABLE INSTALADO
    # ============================================================

    Write-Step "[9/10] Validando aplicación instalada..."

    $InstalledDesktopExe = Join-Path `
        $TestInstallDir `
        "ARBOL-by-KLIK.exe"

    if (-not (Test-Path $InstalledDesktopExe)) {

        Write-Host "[ERROR] No existe:" -ForegroundColor Red
        Write-Host "        $InstalledDesktopExe" -ForegroundColor Red

        Write-Host ""
        Write-Host "Buscando copias de ARBOL-by-KLIK.exe dentro de la instalación..." -ForegroundColor Yellow

        $FoundDesktopExe = Get-ChildItem `
            -Path $TestInstallDir `
            -Filter "ARBOL-by-KLIK.exe" `
            -Recurse `
            -File `
            -ErrorAction SilentlyContinue

        if ($FoundDesktopExe) {

            Write-Host ""
            Write-Host "Se encontraron estas ubicaciones:" -ForegroundColor Yellow

            foreach ($Found in $FoundDesktopExe) {

                Write-Host "  $($Found.FullName)" -ForegroundColor White
                Add-Diagnostic "EXE encontrado en ruta inesperada: $($Found.FullName)"
            }

            throw "setup.iss instaló ARBOL-by-KLIK.exe en una ubicación distinta a la esperada."
        }

        throw "El instalador NO instaló ARBOL-by-KLIK.exe."
    }

    $InstalledInfo = Get-ExecutableInfo `
        -Path $InstalledDesktopExe `
        -Label "ARBOL-by-KLIK.exe INSTALADO"

    # ------------------------------------------------------------
    # COMPARAR HASH
    # ------------------------------------------------------------

    Write-Host ""
    Write-Host "Comparando ejecutable compilado contra ejecutable instalado..." -ForegroundColor Cyan

    Write-Host "Original :" -ForegroundColor Gray
    Write-Host "  $($OriginalInfo.Hash)" -ForegroundColor White

    Write-Host "Instalado:" -ForegroundColor Gray
    Write-Host "  $($InstalledInfo.Hash)" -ForegroundColor White

    if ($OriginalInfo.Hash -ne $InstalledInfo.Hash) {

        throw "El SHA-256 del ejecutable instalado NO coincide con el ejecutable compilado."
    }

    Write-Host "[OK] SHA-256 idéntico." -ForegroundColor Green

    Add-Diagnostic "Hash original e instalado coinciden."

    # ============================================================
    # 10. PRUEBA REAL INSTALADA
    # ============================================================

    Write-Step "[10/10] Ejecutando aplicación instalada..."

    $InstalledProcess = Test-DesktopProcess `
        -ExePath $InstalledDesktopExe `
        -WorkingDirectory $TestInstallDir `
        -StdOut $InstalledStdOut `
        -StdErr $InstalledStdErr `
        -Label "ARBOL-by-KLIK.exe INSTALADO" `
        -WaitSeconds 10

    Write-Host ""
    Write-Host "[OK] Aplicación instalada permanece activa." -ForegroundColor Green
    Write-Host "PID: $($InstalledProcess.Id)" -ForegroundColor Gray

    Add-Diagnostic "Aplicación instalada supera prueba de ejecución."

    # ============================================================
    # CERRAR SOLO NUESTRO PROCESO
    # ============================================================

    Stop-OwnedProcess `
        -Process $InstalledProcess `
        -Name "ARBOL-by-KLIK.exe INSTALADO"

    $InstalledProcess = $null

    # ============================================================
    # RESULTADO PASS
    # ============================================================

    $FinalStatus = "PASS"

    $InstallerSizeMB = [Math]::Round(
        ((Get-Item $InstallerPath).Length / 1MB),
        2
    )

    Write-Host ""
    Write-Host "█████████████████████████████████████████████████████████" -ForegroundColor Green
    Write-Host "                  RELEASE = PASS                         " -ForegroundColor Green
    Write-Host "█████████████████████████████████████████████████████████" -ForegroundColor Green

    Write-Host ""
    Write-Host "Validaciones:" -ForegroundColor Cyan

    Write-Host " ✔ build.ps1 ejecutado" -ForegroundColor Green
    Write-Host " ✔ ARBOL-by-KLIK.exe generado" -ForegroundColor Green
    Write-Host " ✔ aplicación original arranca" -ForegroundColor Green
    Write-Host " ✔ Inno Setup compila" -ForegroundColor Green
    Write-Host " ✔ instalador generado" -ForegroundColor Green
    Write-Host " ✔ instalación silenciosa completada" -ForegroundColor Green
    Write-Host " ✔ ARBOL-by-KLIK.exe instalado" -ForegroundColor Green
    Write-Host " ✔ SHA-256 coincide" -ForegroundColor Green
    Write-Host " ✔ aplicación instalada arranca" -ForegroundColor Green
    Write-Host " ✔ proceso permanece activo" -ForegroundColor Green

    Write-Host ""
    Write-Host "Instalador:" -ForegroundColor Cyan
    Write-Host "  $InstallerPath" -ForegroundColor White

    Write-Host ""
    Write-Host "Tamaño:" -ForegroundColor Cyan
    Write-Host "  $InstallerSizeMB MB" -ForegroundColor White

    Write-Host ""
    Write-Host "SHA-256 instalador:" -ForegroundColor Cyan
    Write-Host "  $($InstallerInfo.Hash)" -ForegroundColor White

    Write-Host ""
    Write-Host "SHA-256 aplicación:" -ForegroundColor Cyan
    Write-Host "  $($OriginalInfo.Hash)" -ForegroundColor White

    Write-Host ""
    Write-Host "Diagnósticos:" -ForegroundColor Cyan
    Write-Host "  $DiagnosticDir" -ForegroundColor White

    Write-Host ""
    Write-Host "SEGURIDAD:" -ForegroundColor Yellow
    Write-Host "  Kaspersky no fue desactivado ni modificado." -ForegroundColor Yellow
    Write-Host "  Windows Defender no fue desactivado ni modificado." -ForegroundColor Yellow
    Write-Host "  El firewall no fue desactivado ni modificado." -ForegroundColor Yellow

    Add-Diagnostic "RELEASE=PASS"
}

catch {

    $FinalStatus = "FAIL"

    Write-Host ""
    Write-Host "█████████████████████████████████████████████████████████" -ForegroundColor Red
    Write-Host "                  RELEASE = FAIL                         " -ForegroundColor Red
    Write-Host "█████████████████████████████████████████████████████████" -ForegroundColor Red

    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red

    Add-Diagnostic "RELEASE=FAIL"
    Add-Diagnostic "ERROR=$($_.Exception.Message)"

    if ($_.InvocationInfo) {

        Write-Host ""
        Write-Host "Archivo:" -ForegroundColor Yellow
        Write-Host $_.InvocationInfo.ScriptName -ForegroundColor White

        Write-Host "Linea:" -ForegroundColor Yellow
        Write-Host $_.InvocationInfo.ScriptLineNumber -ForegroundColor White

        Write-Host "Comando:" -ForegroundColor Yellow
        Write-Host $_.InvocationInfo.Line -ForegroundColor White

        Add-Diagnostic "LINE=$($_.InvocationInfo.ScriptLineNumber)"
        Add-Diagnostic "COMMAND=$($_.InvocationInfo.Line)"
    }
}

finally {

    # ============================================================
    # LIMPIEZA
    # ============================================================

    Stop-OwnedProcess `
        -Process $PreProcess `
        -Name "ARBOL-by-KLIK.exe ORIGINAL"

    Stop-OwnedProcess `
        -Process $InstalledProcess `
        -Name "ARBOL-by-KLIK.exe INSTALADO"

    if ($PushLocationActive) {

        try {
            Pop-Location
        }
        catch {}
    }

    # ============================================================
    # RESUMEN
    # ============================================================

    try {

        $SummaryPath = Join-Path `
            $DiagnosticDir `
            "RESUMEN.txt"

        $Summary = @"
ÁRBOL by KLIK
RELEASE VERIFICATION
==============================================

Fecha:
$(Get-Date)

Proyecto:
$ProjectRoot

Estado:
$FinalStatus

Aplicación esperada:
$DesktopExePath

Instalador esperado:
$InstallerPath

Instalación temporal:
$TestInstallDir

Diagnósticos:
$DiagnosticDir

Seguridad:
Kaspersky no modificado.
Windows Defender no modificado.
Firewall no modificado.

==============================================
"@

        Set-Content `
            -Path $SummaryPath `
            -Value $Summary `
            -Encoding UTF8
    }
    catch {}

    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Magenta
    Write-Host " VERIFICACION DE RELEASE FINALIZADA                      " -ForegroundColor Magenta
    Write-Host "=========================================================" -ForegroundColor Magenta

    Write-Host ""
    Write-Host "ESTADO FINAL:" -ForegroundColor Cyan

    if ($FinalStatus -eq "PASS") {

        Write-Host "PASS" -ForegroundColor Green
    }
    else {

        Write-Host "FAIL" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Diagnósticos:" -ForegroundColor Cyan
    Write-Host $DiagnosticDir -ForegroundColor White

    Wait-BeforeClose "Presiona ENTER para cerrar..."
}
