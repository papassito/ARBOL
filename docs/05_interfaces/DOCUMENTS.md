# DOCUMENTS

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir el modelo lógico, las reglas de preservación criptográfica y la administración del archivo de documentos históricos digitalizados (actas civiles, registros eclesiásticos, correspondencia epistolar, escrituras notariales, testamentos, etc.) en ÁRBOL by KLIK.

---

## 2. Alcance

Aplica a la especificación de almacenamiento de documentos, la trazabilidad de su origen e integridad, y la relación lógica entre documentos y acontecimientos de personas dentro de la base de datos.

---

## 3. Preservación, Integridad y Derivados

Para salvaguardar la veracidad jurídica e histórica de cada documento ingresado:

- **Inmutabilidad Absoluta:** El archivo digital de origen (ej: PDF, TIFF o imagen JPEG de alta definición) se almacena en el almacén de lectura exclusiva local. No se permiten ediciones del fichero original.
- **Huella de Integridad:** Se calculará de forma obligatoria la firma SHA-256 al importar cualquier documento digital. Si la huella no coincide durante auditorías del sistema, se marcará el documento con estado de alerta de integridad comprometida.
- **Estructura de Derivados:** Un documento original puede tener ramificados diversos archivos derivados de consulta e interpretación lógicos:
  - **Copia de Preservación:** Copia idéntica en almacenamiento seguro alternativo.
  - **Copia de Consulta:** Versión comprimida óptima para su renderizado rápido en la UI del navegador local.
  - **Transcripción Paleográfica:** Registro textual literal manuscrito por investigadores humanos, libre de cualquier adición o redondeo conceptual provisto por IA generativas.
  - **Traducción:** En caso de documentos redactados en lenguas antiguas, latín eclesiástico o lenguas extranjeras.

---

## 4. Estructura de Metadatos del Registro de Documentos

Cada documento almacenado debe registrar formalmente los siguientes atributos lógicos:

- **Identificador Único:** UUID local.
- **Metadatos Archivísticos:** Tipo de documento (acta, carta, censo, testamento), fecha de emisión original, autoridad emisora (Registro Civil, Parroquia), idioma original, volumen, libro y foja de origen físico.
- **Origen / Procedencia:** Identificador de la fuente origen (referencia directa a `SOURCES.md`).
- **Firma de Integridad:** Hash SHA-256 inmutable del binario digital original.
- **Personas Vinculadas:** Listado de identidades canónicas mencionadas de forma directa o indirecta en el texto del documento (ej: el titular, los padres, los testigos, el declarante).
- **Estado de Verificación:** Estado de confirmación de autenticidad del documento físico original (`UNVERIFIED`, `VERIFIED_GENUINE`, `PROBABLE_FORGERY`, `UNKNOWN`).

---

## 5. Diseño Lógico del Recurso Documento

```typescript
interface HistoricalDocument {
    document_id: UUID;
    original_file_hash: string; // SHA-256
    document_type: "CIVIL_ACT" | "PARISH_ACT" | "PRIVATE_LETTER" | "WILL" | "MILITARY_RECORD" | "UNKNOWN";
    source_id: UUID; // Enlace al catálogo de fuentes
    metadata_details: {
        issuer_name: string; // Oficina del registro o parroquia
        recorded_date: ApproximateDate;
        physical_location_reference?: string; // Libro, tomo, foja de archivo físico original
        language: string;
    };
    associated_people: DocumentPersonReference[];
    transcription_manual?: string;
    document_status: "UNVERIFIED" | "VERIFIED_GENUINE" | "HYPOTHETICAL" | "REJECTED";
}

interface DocumentPersonReference {
    person_id: UUID;
    role_in_document: "SUBJECT_PRIMARY" | "PARENT" | "WITNESS" | "DECLARANT" | "GODPARENT";
    is_identity_confirmed_by_human: boolean;
}
```

---

## 6. Reglas Metodológicas

- **Cotejo de Testigos:** El registro de testigos y padrinos es obligatorio al transcribir documentos clave (bautizos y matrimonios), puesto que estas identidades laterales aportan las pruebas definitivas para resolver problemas de homonimias en ramas adyacentes de la familia.
