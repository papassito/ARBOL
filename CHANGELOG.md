# CHANGELOG

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Registrar el historial de versiones, adiciones, correcciones y cambios estructurales realizados sobre el baseline documental y la arquitectura del proyecto ÁRBOL by KLIK.

---

## 2. Registro Histórico de Versiones

### [v0.1.0-draft] — Versión Inicial del Borrador
- Estructura inicial del README.md, COMPONENTS.md y REQUIREMENTS.md.
- Definición conceptual inicial de los requerimientos y módulos del núcleo de datos genealógico.
- Creación de los placeholders de documentos de arquitectura especializados en estado de borrador (*DRAFT*).

### [v1.0.0-baseline] — Cierre de Baseline Documental (Versión Actual)
- **Fecha:** Actualización actual.
- **Autor:** Gemini Code Assist.
- **Nota de Saneamiento:** Se realiza una limpieza documental completa (DOCUMENTATION BASELINE CLEANUP) para retirar todo el contenido de ejemplo y asegurar una especificación de producto 100% genérica.
- **Hitos Alcanzados:**
  - **Llenado Completo del Baseline:** Se expandieron y completaron exhaustivamente todos los archivos `.md` de diseño técnico, conceptual y de gobernanza que se encontraban pendientes de definición.
  - **Corrección y Limpieza de Datos de Entrada:** Eliminación sistemática de datos familiares reales de la documentación del producto (Garantizando separación absoluta entre producto y datos).
  - **Creación de Documentos Clave:** Incorporación de `DATA_MODEL.md`, `WORKFLOWS.md` y `GLOSSARY.md` para cerrar la especificación lógica.
  - **Alineación de Marca:** Renombrado oficial del producto a **ÁRBOL by KLIK**.
  - **Alineación de Reglas de Oro:** Integración sistemática de los principios **ZERO SYNTHETIC**, **ZERO AI ON EVIDENCE**, **LOCAL-FIRST** y **SOURCE-FIRST** en la arquitectura lógica del sistema, la base de datos, la API y la UI.
  - **Formalización de Procesos de Identidad y Relaciones:** Definición de diferencias conceptuales rígidas entre *Person*, *Record*, e *Identity* en `IDENTITY.md` y representación de relaciones familiares como entidades del dominio en `RELATIONSHIPS.md`.
  - **Especificación de Motores de Datos:** Definición del esquema lógico relacional sin prescribir motores físicos en `DATABASE.md`.
  - **Detalle de Seguridad, Privacidad y Auditoría:** Formalización de la traza de auditoría encadenada criptográficamente en `AUDIT.md`, tratamiento diferenciado de personas vivas en `PRIVACY.md` y fail closed en `SECURITY.md`.
  - **Establecimiento de Roadmap y Mapa:** Detalle del mapa geográfico-histórico en `MAP.md` y planificación secuencial de desarrollo en `ROADMAP.md`.

---

## 3. Reglas de Registro en el Changelog

- Cada modificación futura de este baseline documental o de los componentes de implementación física de software del proyecto debe registrarse en la sección superior de este documento mediante un incremento formal de versión de acuerdo al estándar de versionado semántico (*Semantic Versioning*).
- Ninguna versión del software se publicará o implementará sin actualizar de forma correspondiente el registro detallado en este diario de cambios.
