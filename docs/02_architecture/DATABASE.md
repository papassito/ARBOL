# DATABASE

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE FISICO

---

## 1. Propósito y Enfoque de Persistencia

Definir el diseño lógico, las entidades, relaciones, invariantes de datos y mecanismos de integridad para la base de datos de ÁRBOL by KLIK. 
El enfoque de diseño es **local-first** y **relacional-grafo**, estructurando la persistencia de forma que admita datos ausentes (`UNKNOWN`), preservando la inmutabilidad de la auditoría y aislando la selección de la base de datos física del modelado de negocio.

---

## 2. Invariantes de Datos e Integridad

Para cumplir con los principios rectores de **ZERO SYNTHETIC** y **ZERO AI**, se imponen las siguientes restricciones sobre el diseño lógico de la base de datos:

- **Admisibilidad de Datos Vacíos:** Ningún campo de la base de datos que represente fechas, lugares o parentescos de personas tendrá valores de relleno automatizados o cadenas por defecto ficticias. Si el dato no existe, se guardará como `NULL` o `UNKNOWN` de forma explícita.
- **Inmutabilidad del Blob Store original:** Los ficheros binarios asociados a evidencias se almacenan de forma local en un directorio de datos dedicado, referenciados mediante su firma criptográfica (SHA-256). Cualquier modificación del fichero cambia el hash, lo que invalida de inmediato la relación de evidencia asociada, previniendo alteraciones accidentales.
- **Restricción de Cascada de Eliminaciones (No-Cascade on Delete):** La eliminación accidental de un registro externo o un conector jamás provocará el borrado en cascada de personas, relaciones o evidencias dentro del archivo maestro. Las eliminaciones de entidades maestras están severamente restringidas y deben ser inscriptas en el log de auditoría.

---

## 3. Entidades del Modelo Lógico (Esquema Conceptual)

```
  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
  │     PLACES      │◄───────┤     EVENTS      │◄───────┤     PEOPLE      │
  │ (Places Catalog)│        │ (Acontecimientos)│        │ (Canonical)     │
  └─────────────────┘        └────────┬────────┘        └────────┬────────┘
                                      │                          │
                                      ▼                          ▼
  ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
  │     SOURCES     │◄───────┤    EVIDENCE     │◄───────┤  RELATIONSHIPS  │
  │ (Fuentes Catalog)│       │  (Evidencias)   │        │ (Parent/Spouse) │
  └─────────────────┘        └────────┬────────┘        └─────────────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │ DOCUMENTS/PHOTOS│
                             │ (Physical Files)│
                             └─────────────────┘
```

---

## 4. Estructura Conceptual de Tablas/Colecciones Lógicas

### Tabla: `people`
- `id`: UUID (Llave primaria, autogenerada de forma local y unívoca)
- `canonical_name`: Texto (Nombre representativo para visualización)
- `gender`: Cadena ("MALE", "FEMALE", "UNKNOWN")
- `state`: Cadena ("LIVING", "DECEASED", "UNKNOWN")
- `research_status`: Cadena ("DOCUMENTED", "FAMILY-SOURCED", "HYPOTHESIS", "UNKNOWN")
- `created_at`: Marca de tiempo
- `updated_at`: Marca de tiempo

### Tabla: `name_variants`
- `id`: UUID
- `person_id`: UUID (Llave foránea a `people.id`)
- `given_names`: Texto
- `last_names`: Texto
- `is_primary`: Booleano
- `provenance_id`: UUID

### Tabla: `relationships`
- `id`: UUID (Llave primaria)
- `person_a_id`: UUID (Llave foránea a `people.id`)
- `person_b_id`: UUID (Llave foránea a `people.id`)
- `type`: Cadena ("PARENT_CHILD", "SPOUSAL", "SIBLING_LATERAL")
- `verification_level`: Cadena ("DOCUMENTED", "FAMILY-SOURCED", "HYPOTHESIS", "REJECTED")
- `provenance_id`: UUID

### Tabla: `events`
- `id`: UUID
- `person_id`: UUID (Opcional, llave foránea a `people.id`)
- `relationship_id`: UUID (Opcional, llave foránea a `relationships.id`)
- `type`: Cadena ("BIRTH", "BAPTISM", "MARRIAGE", "DEATH", "BURIAL", "RESIDENCE")
- `event_date`: Estructura ApproximateDate (Campos de año, mes, día y aproximación)
- `place_id`: UUID (Opcional, llave foránea a `places.id`)
- `provenance_id`: UUID

### Tabla: `evidence`
- `id`: UUID (Llave primaria)
- `source_id`: UUID (Llave foránea a `sources.id`)
- `type`: Cadena ("CIVIL_RECORD", "PARISH_BOOK", "PHOTO", "TESTIMONY", "OTHER")
- `confidence_rating`: Cadena ("HIGH", "MEDIUM", "LOW")
- `file_hash`: Cadena (Opcional, hash del binario original)
- `transcription`: Texto (Opcional, transcripción paleográfica manual)
- `provenance_id`: UUID

### Tabla: `evidence_links`
- `id`: UUID
- `evidence_id`: UUID (Llave foránea a `evidence.id`)
- `target_entity_type`: Cadena ("PEOPLE", "RELATIONSHIPS", "EVENTS")
- `target_entity_id`: UUID (UUID de la entidad correspondiente)

### Tabla: `audit_log`
- `id`: UUID (Llave primaria)
- `timestamp`: Marca de tiempo
- `user_identity`: Texto (Identidad del investigador local)
- `action_type`: Cadena ("CREATE", "UPDATE", "CONFIRM", "REJECT", "MERGE", "SPLIT", "LINK", "UNLINK")
- `entity_name`: Cadena (Tabla afectada)
- `entity_id`: UUID (ID de la entidad afectada)
- `payload_before`: JSON / Texto (Representación del estado previo)
- `payload_after`: JSON / Texto (Representación del estado posterior)
- `justification`: Texto (Motivo documentado por el usuario humano)

### Tabla: `citations`
- `id`: UUID (Llave primaria)
- `evidence_id`: UUID (Llave foránea a `evidence.id`)
- `volume`: Texto (Opcional, volumen físico/digital de la fuente)
- `book`: Texto (Opcional, libro físico/digital)
- `page_number`: Texto (Opcional, número de página)
- `entry_number`: Texto (Opcional, número de acta o entrada)
- `custom_reference`: Texto (Opcional, referencia en formato libre)

### Tabla: `research_cases`
- `id`: UUID (Llave primaria)
- `title`: Texto (Título representativo del caso de investigación)
- `objective`: Texto (Objetivo o pregunta de investigación planteada)
- `status`: Cadena ("OPEN", "RESOLVED", "ABANDONED")
- `created_at`: Marca de tiempo
- `updated_at`: Marca de tiempo

### Tabla: `research_case_links`
- `research_case_id`: UUID (Llave foránea a `research_cases.id`)
- `target_entity_type`: Cadena ("PEOPLE", "RELATIONSHIPS", "EVENTS", "EVIDENCE")
- `target_entity_id`: UUID (ID de la entidad mapeada en el caso)
- `role_in_case`: Cadena ("HYPOTHESIS", "CANDIDATE", "EVIDENCE", "EXCLUDED")

---

## 5. Selección de Arquitectura de Persistencia Física

Se autoriza y define **SQLite** como el motor de persistencia maestro de **ÁRBOL by KLIK**.

### Justificación de Ingeniería:
1. **Soberanía y Portabilidad (Local-First):** Toda la base de datos se compila en un único archivo físico transferible, facilitando respaldos locales en frío y la propiedad absoluta del usuario.
2. **Plataforma Web (SQLite WASM + OPFS):** Permite ejecutar un motor SQL relacional completo directamente en el navegador del usuario utilizando el *Origin Private File System* para lecturas/escrituras rápidas y persistentes, sin necesidad de servidores intermedios.
3. **Integridad Relacional Real:** Soporte nativo de llaves foráneas (`FOREIGN KEY`) y transacciones atómicas (`ACID`), críticas para la estabilidad del árbol y la traza de auditoría.

---

## 6. Esquema Físico SQL (DDL de SQLite)

Las sentencias a continuación estructuran el esquema de persistencia física. El uso de llaves foráneas está estrictamente configurado para evitar la propagación de borrados en cascada (`ON DELETE RESTRICT` / `ON DELETE SET NULL`).

```sql
-- Habilitar soporte de llaves foráneas en tiempo de ejecución (Mandatorio para SQLite)
PRAGMA foreign_keys = ON;

-- Catálogo Jerárquico de Lugares (PLACES)
CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY, -- Almacena UUID v4 como TEXT (36 caracteres)
    country TEXT NOT NULL,
    state_province TEXT NOT NULL,
    county_municipality TEXT,
    settlement_city_town TEXT,
    specific_location TEXT,
    latitude REAL,
    longitude REAL,
    created_at TEXT DEFAULT (datetime('now', 'utc'))
);

-- Registro Canónico de Personas (PEOPLE)
CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    gender TEXT CHECK(gender IN ('MALE', 'FEMALE', 'UNKNOWN')) NOT NULL DEFAULT 'UNKNOWN',
    state TEXT CHECK(state IN ('LIVING', 'DECEASED', 'UNKNOWN')) NOT NULL DEFAULT 'UNKNOWN',
    research_status TEXT CHECK(research_status IN ('DOCUMENTED', 'FAMILY-SOURCED', 'HYPOTHESIS', 'UNKNOWN')) NOT NULL DEFAULT 'UNKNOWN',
    created_at TEXT DEFAULT (datetime('now', 'utc')),
    updated_at TEXT DEFAULT (datetime('now', 'utc'))
);

-- Variantes Nominales de Personas
CREATE TABLE IF NOT EXISTS name_variants (
    id TEXT PRIMARY KEY,
    person_id TEXT NOT NULL,
    given_names TEXT NOT NULL,
    last_names TEXT NOT NULL,
    is_primary INTEGER CHECK(is_primary IN (0, 1)) NOT NULL DEFAULT 0,
    provenance_id TEXT,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE RESTRICT
);

-- Registro de Relaciones Familiares (RELATIONSHIPS)
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    person_a_id TEXT NOT NULL,
    person_b_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('PARENT_CHILD', 'SPOUSAL', 'SIBLING_LATERAL', 'OTHER')) NOT NULL,
    verification_level TEXT CHECK(verification_level IN ('DOCUMENTED', 'FAMILY-SOURCED', 'HYPOTHESIS', 'REJECTED', 'UNKNOWN')) NOT NULL DEFAULT 'UNKNOWN',
    provenance_id TEXT,
    created_at TEXT DEFAULT (datetime('now', 'utc')),
    FOREIGN KEY (person_a_id) REFERENCES people(id) ON DELETE RESTRICT,
    FOREIGN KEY (person_b_id) REFERENCES people(id) ON DELETE RESTRICT
);

-- Catálogo de Fuentes (SOURCES)
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    classification TEXT CHECK(classification IN ('PRIMARY', 'SECONDARY', 'TESTIMONY', 'EXTERNAL_REPO', 'INDEX', 'THIRD_PARTY_TREE', 'UNKNOWN')) NOT NULL,
    repository_reference TEXT,
    created_at TEXT DEFAULT (datetime('now', 'utc'))
);

-- Registro de Evidencias y Preservación Digital (EVIDENCE)
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('CIVIL_RECORD', 'PARISH_BOOK', 'PHOTO', 'TESTIMONY', 'OTHER')) NOT NULL,
    confidence_rating TEXT CHECK(confidence_rating IN ('HIGH', 'MEDIUM', 'LOW')) NOT NULL,
    file_hash TEXT, -- Firma criptográfica SHA-256 (64 caracteres) del archivo físico local
    file_path TEXT, -- Ruta física local segura en el Blob Store
    transcription TEXT,
    provenance_id TEXT,
    created_at TEXT DEFAULT (datetime('now', 'utc')),
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE RESTRICT
);

-- Catálogo de Citaciones de Evidencias (CITATIONS)
CREATE TABLE IF NOT EXISTS citations (
    id TEXT PRIMARY KEY,
    evidence_id TEXT NOT NULL,
    volume TEXT,
    book TEXT,
    page_number TEXT,
    entry_number TEXT,
    custom_reference TEXT,
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE RESTRICT
);

-- Acontecimientos Históricos (EVENTS)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    person_id TEXT,
    relationship_id TEXT,
    type TEXT CHECK(type IN ('BIRTH', 'BAPTISM', 'MARRIAGE', 'DEATH', 'BURIAL', 'RESIDENCE', 'MIGRATION')) NOT NULL,
    event_year INTEGER NOT NULL,
    event_month INTEGER CHECK(event_month BETWEEN 1 AND 12),
    event_day INTEGER CHECK(event_day BETWEEN 1 AND 31),
    is_approximate INTEGER CHECK(is_approximate IN (0, 1)) NOT NULL DEFAULT 0,
    confidence_range_years INTEGER,
    place_id TEXT,
    provenance_id TEXT,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE RESTRICT,
    FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE RESTRICT,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL
);

-- Tablas de Asociación para Evidencias (Strict Foreign Keys)
CREATE TABLE IF NOT EXISTS evidence_people_links (
    evidence_id TEXT NOT NULL,
    person_id TEXT NOT NULL,
    PRIMARY KEY (evidence_id, person_id),
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE RESTRICT,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS evidence_relationship_links (
    evidence_id TEXT NOT NULL,
    relationship_id TEXT NOT NULL,
    PRIMARY KEY (evidence_id, relationship_id),
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE RESTRICT,
    FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE RESTRICT
);

-- Registro de Casos de Investigación (RESEARCH_CASES)
CREATE TABLE IF NOT EXISTS research_cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT CHECK(status IN ('OPEN', 'RESOLVED', 'ABANDONED')) NOT NULL DEFAULT 'OPEN',
    created_at TEXT DEFAULT (datetime('now', 'utc')),
    updated_at TEXT DEFAULT (datetime('now', 'utc'))
);

-- Enlaces de Entidades con Casos de Investigación (RESEARCH_CASE_LINKS)
CREATE TABLE IF NOT EXISTS research_case_links (
    research_case_id TEXT NOT NULL,
    target_entity_type TEXT CHECK(target_entity_type IN ('PEOPLE', 'RELATIONSHIPS', 'EVENTS', 'EVIDENCE')) NOT NULL,
    target_entity_id TEXT NOT NULL,
    role_in_case TEXT CHECK(role_in_case IN ('HYPOTHESIS', 'CANDIDATE', 'EVIDENCE', 'EXCLUDED')) NOT NULL,
    PRIMARY KEY (research_case_id, target_entity_type, target_entity_id),
    FOREIGN KEY (research_case_id) REFERENCES research_cases(id) ON DELETE RESTRICT
);

-- Diario de Auditoría Encadenada Criptográficamente (AUDIT_LOG)
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT DEFAULT (datetime('now', 'utc')),
    user_identity TEXT NOT NULL,
    action_type TEXT CHECK(action_type IN ('CREATE', 'UPDATE', 'CONFIRM', 'REJECT', 'MERGE', 'SPLIT', 'LINK', 'UNLINK')) NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload_before TEXT, -- Estado previo representado en formato JSON
    payload_after TEXT NOT NULL,  -- Estado posterior representado en formato JSON
    justification TEXT NOT NULL,
    parent_hash TEXT, -- SHA-256 del registro de auditoría inmediatamente anterior
    record_hash TEXT NOT NULL, -- SHA-256 resultante de: SHA-256(id + payload_after + parent_hash)
    UNIQUE(record_hash)
);

---

## 7. Inicialización y Estrategia de Migraciones (Local-First)

Dado que la base de datos corre directamente en el entorno local de la aplicación cliente (navegador mediante SQLite WASM + OPFS o aplicación de escritorio), la inicialización y el versionado deben autogestionarse de forma robusta y fail-closed:

### Inicialización Atómica
Al arrancar la aplicación, se debe verificar la existencia de las tablas principales en una sola transacción SQL. Si el archivo `.db` está en blanco, se ejecutarán las sentencias DDL completas dentro de una transacción `BEGIN TRANSACTION` / `COMMIT`.

### Control de Versiones del Esquema
La base de datos utiliza la directiva nativa de SQLite `user_version` para controlar y auditar la versión actual de la persistencia:

```sql
-- Consultar la versión de base de datos actual
PRAGMA user_version;

-- Incrementar la versión tras aplicar una migración (Ejemplo: Versión 2)
PRAGMA user_version = 2;
```

### Mecanismo de Migraciones Progresivas
1. Las migraciones se definen como scripts SQL puros e idempotentes identificados secuencialmente (ej. `0001_initial.sql`, `0002_add_index.sql`).
2. La aplicación cliente lee la versión actual mediante `PRAGMA user_version`.
3. Si la versión es inferior al número de la migración, la ejecuta secuencialmente.
4. Si alguna migración falla, la base de datos ejecuta un rollback completo y entra en modo de solo lectura o emite alerta crítica, asegurando que el archivo no quede corrupto o inconsistente.

### Descarga y Respaldos del Fichero Físico
- El archivo de base de datos `.db` residente en OPFS debe poder exportarse/descargarse como un flujo binario directo de bytes a petición del usuario.
- La UI facilitará un disparador para generar copias en frío locales y permitir al investigador cargar directamente su archivo `.db` soberano para restaurar la sesión en cualquier dispositivo.
```
