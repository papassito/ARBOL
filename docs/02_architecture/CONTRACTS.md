# CONTRACTS

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir las firmas de contratos conceptuales, estructuras de datos lógicas e interfaces abstractas para los principales componentes del sistema. Garantiza el desacoplamiento de las implementaciones físicas de las reglas de negocio de la genealogía.

---

## 2. Alcance

Describe los modelos de transferencia lógica y las interfaces requeridas para la intercomunicación entre el núcleo genealógico (*Family Core*), el registro de evidencias, el catálogo de fuentes y los servicios de búsqueda.

---

## 3. Interfaces de Dominio Conceptuales

### IIdentityService
Contrato para gestionar el registro maestro de identidades de personas sin presuponer su parentesco.
- `RegisterCanonicalPerson(payload: CreatePersonPayload): UUID`
- `UpdatePersonMetadata(id: UUID, payload: UpdatePersonPayload): void`
- `MarkPersonAsUnknown(id: UUID, fields: List<String>): void`
- `MergeIdentities(primaryId: UUID, secondaryId: UUID, auditReason: String): UUID`
- `SplitIdentity(mergedId: UUID, newIdentityPayload: CreatePersonPayload, auditReason: String): UUID`

### IResearchService
Contrato para aislar hipótesis y gestionar expedientes de investigación activa.
- `CreateResearchCase(title: String, objective: String): UUID`
- `UpdateCaseStatus(caseId: UUID, status: "OPEN" | "RESOLVED" | "ABANDONED"): void`
- `LinkEntityToCase(caseId: UUID, entityType: "PEOPLE" | "RELATIONSHIPS" | "EVENTS" | "EVIDENCE", entityId: UUID, role: "HYPOTHESIS" | "CANDIDATE" | "EVIDENCE" | "EXCLUDED"): void`
- `UnlinkEntityFromCase(caseId: UUID, entityType: String, entityId: UUID): void`
- `GetCaseSnapshot(caseId: UUID): ResearchCaseSnapshot`

### IRelationshipEngine
Contrato encargado de modelar y persistir las relaciones familiares y sus niveles de evidencia.
- `EstablishRelationship(personA: UUID, personB: UUID, type: RelationshipType, confidence: VerificationLevel): UUID`
- `LinkEvidenceToRelationship(relationshipId: UUID, evidenceId: UUID): void`
- `VerifyRelationship(relationshipId: UUID, validatorIdentity: String): void`
- `BreakRelationship(relationshipId: UUID, auditReason: String): void`

### IEvidenceRegistry
Contrato para registrar, catalogar y verificar las evidencias del archivo.
- `RegisterEvidence(sourceId: UUID, type: EvidenceType, metadata: EvidenceMetadata): UUID`
- `LinkFileToEvidence(evidenceId: UUID, fileHash: String, fileURI: String): void`
- `GetVerificationState(evidenceId: UUID): VerificationLevel`

### IAuditChainService
Contrato criptográfico obligatorio para la inmutabilidad de la traza de cambios (Audit Log).
- `CalculateRecordHash(payload: String, parentHash: String | null): String`
- `VerifyChainIntegrity(): boolean`
- `AppendLogEntry(entry: Omit<DbAuditLogRow, "record_hash" | "parent_hash">): DbAuditLogRow`
- `GetLatestEntryHash(): String | null`

### ISourceConnector
Interfaz abstracta obligatoria para todos los módulos de búsqueda e integración de repositorios externos (con conectores desacoplados).
- `QueryExternalSource(criteria: SearchCriteria): List<ExternalCandidate>`
- `FetchRecordDetails(externalId: String): ExternalRecordDetail`

interface ResearchCaseSnapshot {
    case_id: UUID;
    title: string;
    objective: string;
    status: "OPEN" | "RESOLVED" | "ABANDONED";
    linked_entities: {
        entity_type: "PEOPLE" | "RELATIONSHIPS" | "EVENTS" | "EVIDENCE";
        entity_id: UUID;
        role_in_case: "HYPOTHESIS" | "CANDIDATE" | "EVIDENCE" | "EXCLUDED";
    }[];
}

/**
 * Estructuras de Datos que Mapean Directamente a las Filas de SQLite (DATABASE.md)
 */
interface DbPersonRow {
    id: UUID;
    canonical_name: string;
    gender: "MALE" | "FEMALE" | "UNKNOWN";
    state: "LIVING" | "DECEASED" | "UNKNOWN";
    research_status: "DOCUMENTED" | "FAMILY-SOURCED" | "HYPOTHESIS" | "UNKNOWN";
    created_at: string; // ISO 8601 UTC
    updated_at: string; // ISO 8601 UTC
}

interface DbRelationshipRow {
    id: UUID;
    person_a_id: UUID;
    person_b_id: UUID;
    type: "PARENT_CHILD" | "SPOUSAL" | "SIBLING_LATERAL" | "OTHER";
    verification_level: "DOCUMENTED" | "FAMILY-SOURCED" | "HYPOTHESIS" | "REJECTED" | "UNKNOWN";
    provenance_id: UUID | null;
    created_at: string;
}

interface DbEventRow {
    id: UUID;
    person_id: UUID | null;
    relationship_id: UUID | null;
    type: "BIRTH" | "BAPTISM" | "MARRIAGE" | "DEATH" | "BURIAL" | "RESIDENCE" | "MIGRATION";
    event_year: number;
    event_month: number | null;
    event_day: number | null;
    is_approximate: boolean; // Mapeado a 0 | 1 en DB
    confidence_range_years: number | null;
    place_id: UUID | null;
    provenance_id: UUID | null;
}

interface DbEvidenceRow {
    id: UUID;
    source_id: UUID;
    type: "CIVIL_RECORD" | "PARISH_BOOK" | "PHOTO" | "TESTIMONY" | "OTHER";
    confidence_rating: "HIGH" | "MEDIUM" | "LOW";
    file_hash: string | null; // SHA-256
    file_path: string | null;
    transcription: string | null;
    provenance_id: UUID | null;
    created_at: string;
}

interface DbCitationRow {
    id: UUID;
    evidence_id: UUID;
    volume: string | null;
    book: string | null;
    page_number: string | null;
    entry_number: string | null;
    custom_reference: string | null;
}

interface DbAuditLogRow {
    id: UUID;
    timestamp: string;
    user_identity: string;
    action_type: "CREATE" | "UPDATE" | "CONFIRM" | "REJECT" | "MERGE" | "SPLIT" | "LINK" | "UNLINK";
    entity_name: string;
    entity_id: UUID;
    payload_before: string | null; // JSON String
    payload_after: string;       // JSON String
    justification: string;
    parent_hash: string | null;   // SHA-256
    record_hash: string;         // SHA-256
}
---

## 4. Estructuras de Datos Comunes (Payloads)

```typescript
interface CreatePersonPayload {
    given_names: string[];
    last_names: string[];
    nominal_variants?: string[];
    estimated_birth_date?: ApproximateDate;
    estimated_death_date?: ApproximateDate;
    gender: "MALE" | "FEMALE" | "UNKNOWN";
    source_provenance_id: UUID;
}

interface ApproximateDate {
    year: number;
    month?: number; // 1-12 o ausente si se desconoce
    day?: number;   // 1-31 o ausente si se desconoce
    is_approximate: boolean;
    confidence_range_years?: number;
}

interface EvidenceMetadata {
    classification: "DOCUMENTED" | "FAMILY-SOURCED" | "TESTIMONY" | "HYPOTHESIS";
    recorded_date?: ApproximateDate;
    recorded_place_id?: UUID;
    informant_name?: string;
}
```

---

## 1. Contratos de Comunicación
El intercambio de información pericial y la compatibilidad de protocolos de red exigen que cualquier rechazo de asociación de comunicación reporte explícitamente el código estándar `A-ASSOCIATE-RJ`.

## 2. Contratos de Base de Datos
Todas las transacciones y operaciones en el motor SQLite local-first deben regirse de forma estricta por los esquemas relacionales e invariantes lógicos detallados en `DATABASE.md`.

## 3. Contratos de Seguridad
La inmutabilidad del historial de auditoría y la integridad física de los archivos se garantiza mediante la validación obligatoria de firmas criptográficas SHA-256.
```

---

## 5. Reglas de Validación de Contratos

- **No Nulos por Defecto:** Los campos vacíos deben representarse explícitamente mediante estructuras que simulen la ausencia de información (`UNKNOWN` o campos nulos opcionales). No se autocompletan datos por defecto.
- **Firmas Criptográficas de Integridad:** Cualquier transferencia de archivos binarios originales hacia el almacén maestro debe calcular de forma obligatoria un Hash SHA-256 para validación del contrato de inmutabilidad.
