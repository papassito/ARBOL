@echo off
:: =========================================================
::   ÁRBOL by KLIK - LANZADOR UNIFICADO DE ECOSISTEMA
:: =========================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

:: 1. Lanzar Microservicios Core de Go de forma transparente con identificadores de ventana legítimos
:: Removemos taskkill para evitar que el antivirus sospeche de una terminación forzada de procesos
start "ÁRBOL Storage" "bin\storage.exe"
start "ÁRBOL Image" "bin\image.exe"
start "ÁRBOL Audit" "bin\audit.exe"
start "ÁRBOL Gateway" "bin\gateway.exe"

:: 3. Tiempo de gracia para el enlazado de puertos locales
timeout /t 1 /nobreak >nul

:: 4. Desplegar Interfaz de Usuario Maestra
start "" "index.html"