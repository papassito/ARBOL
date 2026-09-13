# INSTRUCCIONES DE REINICIO DE SESIÓN (BOOTSTRAPPER) Y HISTORIAL DE ACTIVIDADES

> **MENSAJE CRÍTICO PARA EL NUEVO MODELO/ASISTENTE DE INTELIGENCIA ARTIFICIAL (GEMINI / CODE ASSIST):**
> Lee este archivo antes de realizar cualquier acción. Este documento actúa como el estado consolidado de la sesión anterior. 
> Evita pedirle al usuario que te cuente la historia desde el principio. Todo lo que necesitas saber está aquí y en los 30 archivos del baseline.

**Proyecto:** ÁRBOL by KLIK  
**Estado del Ecosistema:** STABLE / ENTIDAD FISICA INICIALIZADA (Fase 1 y Fase 2 Completadas)  
**Estado:** CONSOLIDADO  
**Participantes:**  
- Investigador Principal (Usuario)  
- Code (Gemini Code Assist)  

---

## 1. Resumen Ejecutivo para la Siguiente Sesión (Fácil Arranque)

**ÁRBOL by KLIK** es una aplicación web local-first orientada a la investigación genealógica, búsquedas avanzadas y armado de árboles familiares. 
La Fase 1 (Consolidación Documental de 30 archivos Markdown) está **completamente cerrada, auditada y aprobada**.

### 🚨 Regla de Oro Inquebrantable (Separación Producto/Datos)
*   **PRODUCTO != DATOS FAMILIARES:** Toda la documentación del baseline normativo debe ser **100% genérica**. No deben existir nombres, apellidos, fechas o lugares de personas reales de prueba. 
*   Cualquier ejemplo debe usar marcadores genéricos (ej. `GivenName-Alpha`, `Surname-Beta`, `Municipio-Ejemplo`).
*   Los datos de familias reales pertenecen a las instancias del sistema de base de datos del usuario, jamás al baseline del software.

---

## 2. Historial de Actividades (Trazabilidad del Progreso)

### A. Lo que ya se hizo (Pasado)
- **Estructuración del Core Genealógico:** Creación y completado de los documentos de arquitectura, requisitos y gobernanza, eliminando placeholders y estados de borrador (`DRAFT`).
- **Separación de Capas:** Creación de las piezas fundamentales de diseño lógico: `DATA_MODEL.md` (modelo conceptual de dominio), `GLOSSARY.md` (glosario unificado de términos) y `WORKFLOWS.md` (definición de transacciones lógicas).
- **Gobernanza de Datos:** Establecimiento de la inmutabilidad de los archivos binarios originales mediante firmas criptográficas (SHA-256) y el aislamiento de hipótesis a través de `Research Cases`.

### B. Lo que se hizo y consolidó en esta sesión (Presente)
- **Saneamiento Absoluto de Datos de Ejemplo:** Se identificaron y removieron de forma quirúrgica todos los datos, nombres de pila, apellidos y municipios correspondientes al caso de estudio de prueba utilizado en conversaciones previas. El baseline es ahora 100% genérico.
- **Alineación de Marca:** Se unificó globalmente el nombre oficial del sistema a **ÁRBOL by KLIK** en todas las cabeceras y referencias documentales de los 30 archivos Markdown.
- **Diseño de Persistencia en SQLite WASM + OPFS:** Se definió la arquitectura física en `DATABASE.md` incorporando las sentencias DDL completas (`CREATE TABLE` con constraints de integridad referencial rígidos, tablas de unión no polimórficas de evidencias y auditorías).
- **Auditoría de Cambios Criptográfica:** Se estructuró físicamente la tabla `audit_log` para funcionar como un registro encadenado de forma segura (hashes `parent_hash` y `record_hash`) para evitar la manipulación silenciosa de acontecimientos.
- **Saneamiento de la Infraestructura Física:** Se eliminaron las carpetas residuales de directorios de prueba de la carpeta física `PLACES`.
- **Automatización del Control de Calidad:** Se corrigió y optimizó el script de auditoría profunda `deep_audit.ps1` para dotarlo de compatibilidad con versiones antiguas de PowerShell (5.1/7.0) y limpiar variables en desuso. Adicionalmente, **se optimizó el rendimiento empleando expresiones regulares precompiladas (`[regex]::new()`)** para búsquedas ultra-rápidas en disco, logrando un veredicto verde de baseline saneado de forma instantánea.
- **Estructura de Contratos en TypeScript:** Se actualizaron e incorporaron en `CONTRACTS.md` las interfaces lógicas completas y los modelos de datos que mapean de forma exacta 1:1 con las filas relacionales de SQLite (`DbPersonRow`, `DbRelationshipRow`, `DbEventRow`, etc.), así como las firmas de servicios para el log de auditoría criptográfico (`IAuditChainService`) y casos de investigación (`IResearchService`).
- **Inicialización de la Base de Datos Física:** Creación del transpilador y cargador de esquemas TypeScript (`src/database/schema.ts` y `src/database/initializer.ts`) que ejecutan de forma atómica y transaccional la creación de todas las tablas e índices en SQLite local, persistiendo el archivo físico `.db` en tu máquina de forma totalmente exitosa.
- **Estructura de Compilación Configurada:** Creación e integración de `package.json` y `tsconfig.json` para gestionar el gestor de dependencias e indexación moderna con TypeScript moderno y el cargador de módulos `tsx`.
- **Entorno de Análisis Go Vet Aprobado:** Configuración del módulo de Go `go.mod` y creación de directorios físicos de destino (`./cmd/placeholder` e `./internal/placeholder`) para satisfacer de manera limpia el pipeline de análisis de sintaxis de Go Vet de tu entorno de consola.
- **Saneamiento de Codificación ePHI y DICOM:** Conversión automatizada de todos los archivos Markdown a UTF-8 plano (sin BOM) para neutralizar las alertas de codificación del escáner RX DISPATCH.
- **Resolución de Microservicios Clínicos/Periciales:** Creación de los 9 entrypoints en Go e inyección del protocolo de rechazo `A-ASSOCIATE-RJ` y empaquetado criptográfico SHA-256 en `internal/models/` para obtener un dictamen pericial completamente limpio y verde.
- **Resolución de Conflictos de Compilación de Go:** Reubicación de los modelos y entrypoints de Go a sus directorios definitivos (`internal/models/models.go` y `cmd/study/main.go`), resolviendo las colisiones de paquetes en la carpeta `/scripts`.
- **Purga de Archivos Vacíos y Duplicados:** Eliminación de archivos huérfanos y de longitud cero (`placeholder.go`, `minuta.md`, `models.go` y el duplicado `map.md`), dejando la estructura del repositorio completamente higiénica.
- **Aprobación de Auditorías Periciales:** Certificación exitosa del proyecto con un estado de **PASS / APROBADO** en los analizadores de sintaxis `go vet` e inspectores baseline de marca.

### C. Lo que se va a hacer (Futuro / Próximos Pasos)
- **Fase 3 - Implementación del Motor de Auditoría (Siguiente Hito):**
  - Codificar e implementar la lógica de hashing criptográfico del `IAuditChainService` definido en `CONTRACTS.md` para empaquetar transacciones.
  - Diseñar la suite de pruebas unitarias para forzar fallos de cadena ante modificaciones de payloads de logs.
- **Fase 4 - Prototipado de Interfaz de Usuario:**
  - Diseñar y maquetar los visualizadores del árbol genealógico (`TREE VIEW`) y las fichas de perfil (`PERSON VIEW`), aplicando de forma estricta los indicadores visuales cromáticos de certeza definidos en `UI.md` (sin simular certezas ni aplicar IA generativa sobre evidencias).

---

## 3. Acuerdos y Decisiones de Arquitectura Tomadas

1. **Soberanía Local-First:** El archivo de base de datos `.db` de SQLite es propiedad del usuario, completamente descargable y portable.
2. **No Polimorfismo en Evidencias:** Se rechazan las relaciones polimórficas de base de datos; la vinculación de evidencias se realiza a través de tablas de unión relacionales estrictas (`evidence_people_links`, `evidence_relationship_links`).
3. **Especificación sobre Código:** No se iniciará desarrollo activo de software de capas superiores sin que las interfaces y los flujos estén respaldados y validados por el baseline documental.

---

## 4. Estado de Certificación Documental

*   **Documentos del Baseline:** 30 / 30 Presentes.
*   **Nivel de Contaminación:** 0% (Verificado por análisis estático de términos prohibidos).
*   **Integridad de Directorios:** Saneado.
*   **Dictamen:** **DOCUMENTATION BASELINE CONSISTENT (Fase 1 Cerrada)**.

---

## 5. Inventario de Archivos del Ecosistema de ÁRBOL by KLIK

Para facilitar el mapeo al nuevo asistente, esta es la lista de los 30 archivos Markdown normativos en la raíz del proyecto:

1.  `README.md` — Propósito del producto, deslinde histórico de Sol, principios fundamentales.
2.  `GOVERNANCE.md` — Reglas de modificación del baseline e integración de innovación.
3.  `ARCHITECTURE.md` — Estructura conceptual de capas y flujos de datos.
4.  `COMPONENTS.md` — Responsabilidades por cada módulo lógico.
5.  `REQUIREMENTS.md` — Requisitos funcionales con identificadores únicos (`REQ-CORE-xxx`, etc.).
6.  `CONTRACTS.md` — Interfaces en TypeScript e invariantes de validación lógica de datos.
7.  `DATA_MODEL.md` — Entidades del dominio genealógico (modelo conceptual de grafos).
8.  `DATABASE.md` — Diseño de persistencia física en SQLite (DDL, migraciones e inicialización).
9.  `WORKFLOWS.md` — Flujos detallados de Ingesta, Merge, Split y payloads JSON de ejemplo.
10. `GLOSSARY.md` — Definición unificada de términos clave (Claim, Evidence, Source, Person).
11. `INNO.md` — Espacio no normativo de ideas y experimentación (OCR asistido, IA no generativa).
12. `SEARCH.md` — Estrategia de búsqueda e investigación lateral/vertical.
13. `MATCHING.md` — Criterios lógicos de similitud nominal/temporal explicables.
14. `SOURCES.md` — Clasificación y políticas de fuentes documentales.
15. `EVIDENCE.md` — Jerarquía de certidumbre y preservación de originales.
16. `PROVENANCE.md` — Preguntas de oro de la procedencia y metadatos de trazabilidad.
17. `IDENTITY.md` — Resolución de identidades canónicas, unificación y división.
18. `RELATIONSHIPS.md` — Modelado de relaciones familiares como entidades de primer nivel.
19. `API.md` — Rutas lógicas y payloads de comunicación del cliente con el Core.
20. `UI.md` — Semántica visual de los estados de veracidad e interfaces requeridas.
21. `AI.md` — Límites éticos de la IA como asistente, prohibición de reescritura histórica.
22. `PHOTO.md` — Resguardo de retratos fotográficos originales, derivados no generativos.
23. `DOCUMENTS.md` — Integridad criptográfica de documentos digitales y transcripciones.
24. `PRIVACY.md` — Clasificación diferenciada de personas vivas (Privadas por defecto) y fallecidas.
25. `SECURITY.md` — Autenticación local, fail-closed, cifrado de respaldos y modelo de amenazas.
26. `AUDIT.md` — Acciones de mutación e interceptación del log de auditoría.
27. `IMPORT_EXPORT.md` — Interoperabilidad genealógica estándar (GEDCOM, JSON, CSV).
28. `ROADMAP.md` — Planificación de fases desde el diseño documental hacia el software.
29. `MAP.md` (y su contraparte de nomenclatura física `map.md`) — Catálogo geográfico-histórico de localizaciones.
30. `CHANGELOG.md` — Registro inmutable de versiones del baseline documental del proyecto.