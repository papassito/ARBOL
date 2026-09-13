# c:\Users\CMSoluciones\Documents\ARBOL\scripts\detect_locations.ps1
# Script de Diagnóstico Pericial y Detección de Ubicaciones Erróneas o Anómalas
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
        # Fallback al directorio de inicio si alcanzamos la raíz del disco sin éxito
        $ScriptRoot = $StartPath
        break
    }
    $ScriptRoot = $Parent
}

$PlacesRoot = Join-Path $ScriptRoot "PLACES"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "     DIAGNÓSTICO Y DETECCIÓN DE UBICACIONES ERRÓNEAS     " -ForegroundColor Cyan
Write-Host "                    ÁRBOL BY KLIK                      " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Directorio de análisis: $PlacesRoot" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path $PlacesRoot)) {
    Write-Error "✖ Error crítico: El directorio maestro de ubicaciones '/PLACES' no existe en la raíz."
    exit 1
}

# Cargar términos prohibidos para verificar contaminación en rutas físicas
$ForbiddenTerms = @("ForbiddenTermA", "ForbiddenTermB", "ForbiddenTermC")
$AnomaliesFound = 0
$TotalDirectoriesAnalyzed = 0

# 1. Obtener todas las carpetas bajo PLACES
$AllDirs = Get-ChildItem -Path $PlacesRoot -Recurse -Directory -ErrorAction SilentlyContinue

Write-Host "[1/5] Verificando colisiones de nombres (Case Sensitivity)..." -ForegroundColor Yellow
# Agrupar por ruta en minúsculas para encontrar carpetas con el mismo nombre pero diferente casing
$Collisions = $AllDirs | Group-Object { $_.FullName.ToLower() } | Where-Object { $_.Count -gt 1 }
if ($Collisions) {
    foreach ($Col in $Collisions) {
        Write-Host " -> ALERTA: Colisión de capitalización física detectada en:" -ForegroundColor Red
        foreach ($Item in $Col.Group) {
            Write-Host "    * $($Item.FullName)" -ForegroundColor Red
        }
        $AnomaliesFound++
    }
} else {
    Write-Host "✔ Cero colisiones de nombres en el árbol jerárquico." -ForegroundColor Green
}

Write-Host "`n[2/5] Analizando consistencia de profundidad de la jerarquía..." -ForegroundColor Yellow
# El estándar exige: PLACES \ <País> \ <Estado> \ <Localidad> (profundidad relativa = 3)
foreach ($Dir in $AllDirs) {
    $TotalDirectoriesAnalyzed++
    
    # Calcular la profundidad relativa de forma inmune a la ruta de ejecución de la consola
    $PlacesRootNormalized = $PlacesRoot.TrimEnd('\').TrimEnd('/')
    $RelativePathInPlaces = $Dir.FullName.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
    $Parts = $RelativePathInPlaces -split '[\\/]' | Where-Object { $_ -ne "" }
    $Depth = $Parts.Count

    if ($Depth -lt 3) {
        # Es un nivel incompleto (ej: Solo PLACES\País o PLACES\País\Estado sin localidades hijas)
        $SubItems = Get-ChildItem -Path $Dir.FullName -Force
        if ($SubItems.Count -eq 0) {
            Write-Host " -> ANOMALÍA: Rama huérfana incompleta detectada: PLACES\$RelativePathInPlaces (Nivel $Depth/3 vacío)" -ForegroundColor Yellow
            $AnomaliesFound++
        }
    }
    elseif ($Depth -gt 3) {
        Write-Host " -> ADVERTENCIA: Profundidad no estándar detectada (> 3 niveles): PLACES\$RelativePathInPlaces (Nivel $Depth)" -ForegroundColor Gray
    }
}
if ($TotalDirectoriesAnalyzed -eq 0) {
    Write-Host "ℹ No se han encontrado subdirectorios en PLACES." -ForegroundColor Cyan
} else {
    Write-Host "✔ Análisis de profundidad completado para $TotalDirectoriesAnalyzed carpetas." -ForegroundColor Green
}

Write-Host "`n[3/5] Escaneando caracteres no seguros e ilegales..." -ForegroundColor Yellow
# Caracteres que causan problemas en sistemas multiplataforma o rotura de strings de consulta
$IllegalPattern = '[~#%&*{}\\:<>?/|+"]'
foreach ($Dir in $AllDirs) {
    if ($Dir.Name -match $IllegalPattern) {
        Write-Host " -> ALERTA CRÍTICA: Nombre de ubicación inválido (caracteres prohibidos): $($Dir.Name)" -ForegroundColor Red
        Write-Host "    Ubicación física: $($Dir.FullName)" -ForegroundColor Gray
        $AnomaliesFound++
    }
    # Detectar espacios al inicio o al final
    if ($Dir.Name.Trim() -ne $Dir.Name) {
        Write-Host " -> ALERTA: Nombre con espacios huérfanos detectado: '$($Dir.Name)'" -ForegroundColor Red
        $AnomaliesFound++
    }
}
if ($AnomaliesFound -eq 0) {
    Write-Host "✔ Todas las carpetas utilizan caracteres multiplataforma seguros." -ForegroundColor Green
}

Write-Host "`n[4/5] Comprobando contaminación de términos prohibidos..." -ForegroundColor Yellow
$ContaminatedPaths = 0
foreach ($Dir in $AllDirs) {
    foreach ($Term in $ForbiddenTerms) {
        if ($Dir.Name -like "*$Term*") {
            Write-Host " -> ALERTA CONTAMINACIÓN: Término no autorizado '$Term' encontrado en el directorio: $($Dir.FullName)" -ForegroundColor Red
            $ContaminatedPaths++
            $AnomaliesFound++
        }
    }
}
if ($ContaminatedPaths -eq 0) {
    Write-Host "✔ Saneamiento confirmado: Ninguna ruta contiene términos o ubicaciones familiares prohibidas." -ForegroundColor Green
}

Write-Host "`n[5/5] Buscando directorios hoja totalmente vacíos..." -ForegroundColor Yellow
$EmptyLeaves = 0
foreach ($Dir in $AllDirs) {
    $PlacesRootNormalized = $PlacesRoot.TrimEnd('\').TrimEnd('/')
    $RelativePathInPlaces = $Dir.FullName.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
    $Parts = $RelativePathInPlaces -split '[\\/]' | Where-Object { $_ -ne "" }
    $Depth = $Parts.Count

    # Solo validar como localidad vacía si el nodo está realmente al nivel de Localidad (Depth >= 3)
    if ($Depth -ge 3) {
        # Verificar si es un directorio hoja (no tiene subcarpetas)
        $SubFolders = Get-ChildItem -Path $Dir.FullName -Directory -ErrorAction SilentlyContinue
        if ($SubFolders.Count -eq 0) {
            $Files = Get-ChildItem -Path $Dir.FullName -File -ErrorAction SilentlyContinue
            if ($Files.Count -eq 0) {
                Write-Host " -> ADVERTENCIA: Carpeta de localidad vacía (sin evidencias ni metadatos): PLACES\$RelativePathInPlaces" -ForegroundColor Yellow
                $EmptyLeaves++
                $AnomaliesFound++
            }
        }
    }
}
if ($EmptyLeaves -eq 0 -and $TotalDirectoriesAnalyzed -gt 0) {
    Write-Host "✔ Todos los nodos hoja de ubicación contienen datos o archivos de control." -ForegroundColor Green
}

Write-Host "`n[6/5] Censo de Ubicación de Archivos (Quién está en su casa y quién no)..." -ForegroundColor Yellow
$MisplacedFiles = 0
$WellPlacedFiles = 0
$PlacesRootNormalized = $PlacesRoot.TrimEnd('\').TrimEnd('/')

# Obtener todos los archivos físicos bajo PLACES
$AllFiles = Get-ChildItem -Path $PlacesRoot -Recurse -File -ErrorAction SilentlyContinue
foreach ($File in $AllFiles) {
    $RelativePath = $File.FullName.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
    $Parts = $RelativePath -split '[\\/]' | Where-Object { $_ -ne "" }
    # El archivo en sí es la última parte, restamos uno para obtener la profundidad de directorios
    $Depth = $Parts.Count - 1

    if ($Depth -lt 3) {
        Write-Host " -> ALERTA FUERA DE CASA: Archivo fuera de su nivel jerárquico estándar (Nivel $Depth, debe ser >= 3): PLACES\$RelativePath" -ForegroundColor Red
        $MisplacedFiles++
        $AnomaliesFound++
    } else {
        $WellPlacedFiles++
    }
}
Write-Host " -> Análisis de residencia completado:" -ForegroundColor Gray
Write-Host "    ✔ Archivos en su casa (Ubicación jerárquica correcta): $WellPlacedFiles" -ForegroundColor Green
if ($MisplacedFiles -gt 0) {
    Write-Host "    ❌ Archivos fuera de su casa (Ubicación errónea): $MisplacedFiles" -ForegroundColor Red
}

Write-Host "`n[7/5] Detección de Archivos Duplicados (Nombre y Contenido)..." -ForegroundColor Yellow
if ($AllFiles.Count -gt 0) {
    # 1. Agrupar y detectar duplicados por NOMBRE físico en disco
    $NameDuplicates = $AllFiles | Group-Object Name | Where-Object { $_.Count -gt 1 }
    if ($NameDuplicates) {
        Write-Host " -> ALERTA: Archivos duplicados detectados por NOMBRE:" -ForegroundColor Red
        foreach ($Group in $NameDuplicates) {
            Write-Host "    * Archivo: '$($Group.Name)' ($($Group.Count) copias encontradas)" -ForegroundColor Red
            foreach ($Item in $Group.Group) {
                $RelativePath = $Item.FullName.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
                Write-Host "      - PLACES\$RelativePath" -ForegroundColor Gray
            }
            $AnomaliesFound++
        }
    } else {
        Write-Host "✔ Cero colisiones de nombre de archivo físico." -ForegroundColor Green
    }

    # 2. Agrupar y detectar duplicados por CONTENIDO (Hash criptográfico MD5 rápido)
    Write-Host " -> Calculando firmas digitales de archivos para verificar duplicados por contenido..." -ForegroundColor Gray
    $FileHashes = @()
    foreach ($File in $AllFiles) {
        try {
            $HashObj = Get-FileHash -Path $File.FullName -Algorithm MD5
            $FileHashes += [PSCustomObject]@{
                Path = $File.FullName
                Hash = $HashObj.Hash
                Name = $File.Name
            }
        } catch {}
    }

    $HashDuplicates = $FileHashes | Group-Object Hash | Where-Object { $_.Count -gt 1 }
    if ($HashDuplicates) {
        Write-Host "`n -> ALERTA: Contenido duplicado idéntico detectado (mismo archivo en diferentes rutas):" -ForegroundColor Red
        foreach ($Group in $HashDuplicates) {
            Write-Host "    * Firma de archivo (MD5 Hash): $($Group.Name)" -ForegroundColor Red
            foreach ($Item in $Group.Group) {
                $RelativePath = $Item.Path.Substring($PlacesRootNormalized.Length).TrimStart('\').TrimStart('/')
                Write-Host "      - PLACES\$RelativePath ('$($Item.Name)')" -ForegroundColor Gray
            }
            $AnomaliesFound++
        }
    } else {
        Write-Host "✔ Cero duplicados lógicos por firma de contenido (MD5)." -ForegroundColor Green
    }
} else {
    Write-Host "ℹ No se han encontrado archivos en PLACES para analizar duplicados." -ForegroundColor Cyan
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "              RESUMEN DE DIAGNÓSTICO DE PLACES           " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
if ($AnomaliesFound -eq 0) {
    Write-Host "VERDICTO: ENTORNO DE PLACES SANO Y CONSISTENTE" -ForegroundColor Green
    Write-Host "No se han detectado inconsistencias ni anomalías geohistóricas en el disco." -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Cyan
} else {
    Write-Host "VERDICTO: REVISIÓN REQUERIDA ($AnomaliesFound anomalías detectadas)" -ForegroundColor Red
    Write-Host "=========================================================" -ForegroundColor Cyan
}