# RELATIONSHIPS

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir el modelado lógico de las relaciones de parentesco familiar y de las estructuras generacionales en ÁRBOL by KLIK, de manera independiente a la identidad pura de las personas.

---

## 2. Alcance

Aplica al diseño de almacenamiento de enlaces de parentesco en el **Relationship Engine**, y a las reglas para vincular evidencias a las conexiones genealógicas confirmadas o hipotéticas.

---

## 3. Representación de Relaciones como Entidades

En ÁRBOL by KLIK, una relación familiar no es una simple propiedad o campo de llave foránea directa dentro de la persona. **Una relación familiar es una entidad de pleno derecho en el sistema.** 
Esto permite que la relación misma tenga un ciclo de vida, un nivel de certeza individualizado y un registro completo de evidencias asociadas.

Tipos de relaciones contempladas:
- **PARENT_CHILD (Filiación):** Conexión biológica o legal entre progenitores e hijos.
- **SPOUSAL (Matrimonio / Pareja):** Conexión civil, eclesiástica o de hecho que conforma un núcleo de convivencia familiar histórico.
- **SIBLING_LATERAL (Hermanos):** Conexión lateral de hermandad (útil para registrar si comparten ambos padres o solo uno, y para guiar investigaciones indirectas).
- **OTHER (Otros):** Otras conexiones históricas formalizadas documentadas.

---

## 4. Reglas del Motor de Relaciones

- **Separación de Identidad y Parentesco:** El hecho de haber determinado de forma fidedigna la identidad de una persona de manera individual no certifica automáticamente ninguna relación de parentesco. Cada enlace familiar requiere su propia justificación documental.
- **Evidencia de Relación Obligatoria:** Ningún enlace de filiación o conyugal será elevado al nivel de `DOCUMENTED` sin estar vinculado a una evidencia válida (ej: el matrimonio de Person-Alpha y Person-Beta se mantendrá como `FAMILY-SOURCED / UNVERIFIED` hasta que se registre el acta de matrimonio correspondiente).
- **Consistencia Biológica y Lógica:** El motor de relaciones validará de forma conceptual las fechas de nacimiento y muerte de las personas vinculadas para alertar de inmediato sobre cualquier incongruencia temporal lógica (ej: padres nacidos después de sus hijos o matrimonios celebrados a edades incompatibles con el contexto histórico).

---

## 5. Ciclo de Vida de una Relación

```
   ┌─────────────────────────────┐
   │         HYPOTHESIS          │ ➔ Creada como pista de investigación.
   └──────────────┬──────────────┘
                  │ [Se localiza y asocia evidencia física]
                  ▼
   ┌─────────────────────────────┐
   │  FAMILY-SOURCED/UNVERIFIED  │ ➔ Datos tradicionales o indicios indirectos.
   └──────────────┬──────────────┘
                  │ [Validación humana de la evidencia directa]
                  ▼
   ┌─────────────────────────────┐
   │         DOCUMENTED          │ ➔ Vínculo verificado y consolidado.
   └─────────────────────────────┘
```

*Nota:* En caso de descubrirse falsedad documental o errores de homonimia en el enlace, el estado de la relación se cambia a `REJECTED`, inhabilitando el vínculo en las vistas del árbol estable pero conservando el registro y la justificación histórica de por qué se descartó.

---

## 6. Estructura Conceptual del Registro de Relación

```typescript
interface Relationship {
    relationship_id: UUID;
    person_a_id: UUID; // Persona origen (ej: Padre/Madre/Cónyuge)
    person_b_id: UUID; // Persona destino (ej: Hijo/Cónyuge)
    relationship_type: "PARENT_CHILD" | "SPOUSAL" | "SIBLING_LATERAL";
    verification_level: "DOCUMENTED" | "FAMILY-SOURCED" | "HYPOTHESIS" | "REJECTED" | "UNKNOWN";
    evidence_references: UUID[]; // Enlaces a EVIDENCE.md que sustentan la relación
    provenance_metadata: ProvenanceMetadata; // Trazabilidad de creación
    audit_history: UUID[]; // Enlaces al diario de auditoría histórica
    biological_parents_confirmed: boolean; // Si la evidencia confirma el vínculo biológico exacto
}
```
