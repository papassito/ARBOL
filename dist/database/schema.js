export const SQL_SCHEMA = `
-- Habilitar soporte de llaves foráneas en tiempo de ejecución
PRAGMA foreign_keys = ON;

-- Catálogo Jerárquico de Lugares (PLACES)
CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
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
    file_hash TEXT,
    file_path TEXT,
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
    payload_before TEXT,
    payload_after TEXT NOT NULL,
    justification TEXT NOT NULL,
    parent_hash TEXT,
    record_hash TEXT NOT NULL,
    UNIQUE(record_hash)
);
`;
