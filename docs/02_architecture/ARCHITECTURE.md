# ARCHITECTURE

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Este documento define el diseño arquitectónico conceptual de ÁRBOL by KLIK. Establece la organización de capas, el flujo lógico de los datos, el enfoque *Local-First* y la soberanía del archivo local respecto a la integración de sistemas externos.

---

## 2. Alcance

Aplica a la estructuración de todos los componentes de software lógicos, el modelado del motor de relaciones y la separación de responsabilidades entre el almacenamiento local, el procesamiento auxiliar de inteligencia artificial y la capa de interacción de usuario (UI).

---

## 3. Directrices Arquitectónicas

- **Local-First por Defecto:** Todo el estado maestro del archivo se genera, procesa y almacena localmente. La conectividad a internet es un servicio opcional y complementario.
- **Soberanía del Núcleo:** Los identificadores locales de personas, familias y evidencias son completamente independientes de plataformas externas de genealogía.
- **Separación Estricta de Identidad y Relación:** Que dos registros compartan parámetros nominales similares no unifica automáticamente sus entidades en la base de datos sin un proceso explícito de validación humana guiada por evidencia.
- **Desacoplamiento de Conectores (Source Connectors):** Los motores de importación y búsqueda en fuentes externas son adaptadores desechables; su falla o eliminación no afecta la integridad ni la disponibilidad del archivo maestro local.

---

## 4. Capas del Sistema Conceptual

```
┌─────────────────────────────────────────────────────────────┐
│                       WEB UI LAYER                          │
│  (Dashboard, Arboles, Vistas, Gestión de Evidencias, etc.)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌─────────────────────────────┐
│    APPLICATION API LAYER     ││       SEARCH / MATCH        │
│  (Contracts, Command/Query)  ││       ENGINE LAYER          │
└──────────────┬───────────────┘└─────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FAMILY CORE DOMAIN                      │
│   (Person Registry, Relationship Engine, Evidence Engine,   │
│    Source Catalog, Photo/Doc Preservator, Audit Log)        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    CORE STORAGE LAYER                       │
│  (Database, Inmutable Blob Store, Provenance, Local Keys)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Flujos de Datos Clave

### Flujo de Registro de una Afirmación Histórica:
1. El usuario o un conector propone un dato (ej. nacimiento de una persona).
2. El dato se clasifica inicialmente como `CANDIDATE` u `HYPOTHESIS`.
3. El **Evidence Registry** requiere la vinculación de al menos una fuente o testimonio.
4. El usuario evalúa la evidencia vinculada.
5. Tras la validación humana, se emite un comando de confirmación.
6. El **Family Core** actualiza el estado de investigación de la persona o relación a `DOCUMENTED` o `FAMILY-SOURCED`.
7. El **Audit Engine** inscribe de forma inmutable la transición de estado, indicando quién validó, cuándo y basándose en qué evidencia.

### Flujo de Preservación de Evidencias:
1. Ingresa un archivo digital (acta manuscrita, fotografía).
2. Se genera de forma local un hash criptográfico único del archivo.
3. El archivo original se deposita en almacenamiento inmutable de lectura únicamente (*Blob Store* local).
4. Cualquier proceso de visualización mejorado, traducción u OCR se almacena de forma paralela en la rama de `Derivados`. El original permanece intocable y accesible.
