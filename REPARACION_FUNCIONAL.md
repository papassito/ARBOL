# ÁRBOL by KLIK — Reparación funcional aplicada

Estado de esta entrega: **fuente reparada y preparada para recompilar en Windows**.

## Cambios realizados

- Se eliminó `familyData` como fuente operativa del frontend. La UI ya no arranca con familiares inventados.
- La interfaz consume la base local real mediante la API loopback `127.0.0.1:3000`.
- Se agregó backend desktop sin consola interactiva: `src/api/desktop_server.ts`.
- Se agregó `/api/health` y soporte CORS/OPTIONS para WebView2.
- Se agregó actualización real de personas (`PUT /api/people`).
- Se agregó listado de relaciones (`GET /api/relationships`).
- Se conectaron los controles visibles principales:
  - Árbol Familiar
  - Agregar información
  - Fotos y documentos
  - Historial de cambios
  - Herramientas
  - Agregar persona
  - Editar información
  - Ver todos los eventos
  - pestañas Datos/Familia/Fotos/Notas
  - búsqueda
  - zoom y centrado
  - cerrar panel derecho
- Se implementaron formularios reales para persona, parentesco, evento y fotografía.
- El flujo fotográfico preserva original y genera una derivada de brillo/contraste sin IA.
- `main.go` inicia el backend local Node antes de abrir la UI y espera su `/api/health`.
- `getBasePath()` prioriza la carpeta real del ejecutable para evitar que una instalación de prueba use por error otra base instalada.
- `setup.iss` incluye Node local, `dist` y `node_modules` necesarios para el backend SQLite existente.
- `compile_installer.ps1` fue limpiado para dejar una sola implementación y eliminar la versión vieja concatenada.
- `build.ps1` verifica `dist/api/desktop_server.js`, elimina el EXE Wails anterior antes de compilar y solo acepta el nuevo ejecutable generado.

## Validaciones realizadas en este entorno

- TypeScript compila correctamente con `tsc`.
- `dist/api/server.js` pasa verificación de sintaxis Node.
- `dist/api/desktop_server.js` pasa verificación de sintaxis Node.
- El JavaScript embebido en `index.html` pasa `node --check`.
- La base `backups/arbol_dev.db` conserva 0 personas, 0 relaciones, 0 eventos y 0 evidencias. No se insertaron datos sintéticos.

## Validación que debe ejecutarse en Windows

Este entorno no puede ejecutar Wails/Windows ni el `better-sqlite3.node` de Windows. Por tanto, el EXE e instalador incluidos originalmente no representan esta nueva fuente hasta recompilar.

Desde PowerShell en el raíz del proyecto:

```powershell
.\build.ps1
```

Después abrir:

```powershell
.\build\bin\ARBOL-by-KLIK.exe
```

Cuando la UI funcione, ejecutar:

```powershell
.\compile_installer.ps1
```

Kaspersky, Windows Security y firewall deben permanecer activos.
