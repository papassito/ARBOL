# PROVENANCE

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir el modelo lógico de procedencia y trazabilidad de los datos en ÁRBOL by KLIK. Toda afirmación, evento o registro debe poder responder a la interrogante: *¿De dónde surgió esta información y cuál es su camino de adquisición?*

---

## 2. Alcance

Aplica a todas las entidades del dominio de datos, forzando la obligatoriedad de conservar metadatos de trazabilidad históricos de manera inmutable.

---

## 3. Preguntas de Oro de la Procedencia

Cualquier registro del sistema debe responder automáticamente y de forma estructurada a las siguientes interrogantes:

1. **¿De dónde salió?** (Identificación de la fuente y la evidencia física o documental).
2. **¿Quién lo aportó?** (Registro del investigador, familiar o conector automatizado de búsqueda que introdujo el dato).
3. **¿Cuándo se incorporó?** (Marca de tiempo inmutable de creación y de cada actualización).
4. **¿Qué nivel de confianza tiene?** (Grado asignado de acuerdo a la jerarquía de veracidad de `EVIDENCE.md`).
5. **¿Qué evidencia directa está relacionada?** (Lista de referencias cruzadas a documentos digitales del archivo).

---

## 4. Reglas de Negocio de Provenance

- **No Datos Huérfanos:** No se admite la inserción de campos sustanciales en el registro de personas o relaciones sin poseer un identificador de procedencia.
- **Preservación frente a Modificaciones:** Si un dato es corregido (por ejemplo, se descubre un acta civil que corrige el mes de nacimiento previamente estimado por la tradición familiar), la procedencia anterior no se elimina silenciosamente; se almacena de forma inmutable en el historial de auditoría de procedencia.
- **Importaciones Seguras:** Toda importación (vía GEDCOM u otros esquemas) marcará la procedencia de la importación incluyendo la fecha, la herramienta de origen y el identificador externo, manteniendo un estado inicial de `UNVERIFIED` en todo el conjunto de datos cargado hasta su revisión manual.

---

## 5. Estructura Conceptual del Registro de Procedencia

```typescript
interface ProvenanceMetadata {
    provenance_id: UUID;
    created_at: Date;
    created_by_user: string; // Identidad del investigador local
    acquisition_channel: "MANUAL_ENTRY" | "IMPORT_GEDCOM" | "EXTERNAL_CONNECTOR_SYNC" | "ORAL_TESTIMONY";
    source_reference: {
        source_id: UUID;      // Referencia a SOURCES.md
        evidence_id?: UUID;    // Referencia a EVIDENCE.md (si existe)
    };
    original_raw_payload?: string; // Payload en bruto recibido de fuentes externas para trazabilidad exacta
    reliability_assessment: "CONFIRMED_HIGH" | "PLAUSIBLE_MEDIUM" | "SPECULATIVE_LOW" | "UNVERIFIED";
}
```

---

## 6. Flujo de Trazabilidad

```
 [Investigador Humano] ➔ Introduce dato manual ➔ Genera ProvenanceMetadata ➔ Escribe Base de Datos
 [Conector Externo]    ➔ Descubre candidato   ➔ Genera ProvenanceMetadata ➔ Escribe como CANDIDATE
```
