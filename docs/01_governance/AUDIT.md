# AUDIT

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir las especificaciones lógicas, estructuras de datos y mecanismos operativos para el registro, consulta y preservación inmutable de la traza de auditoría de ÁRBOL by KLIK. El diario de auditoría permite responder metodológicamente a la pregunta: *¿Por qué creemos que esta persona o parentesco es quien decimos que es, y cómo ha evolucionado esa afirmación?*

---

## 2. Alcance

Aplica de forma obligatoria a todas las operaciones de modificación, inserción, fusión, división, confirmación o descarte de identidades, relaciones, eventos y evidencias en la base de datos local.

---

## 3. Acciones de Mutación Auditadas

El motor de auditoría interceptará de manera sistemática las siguientes acciones lógicas:

- **CREATE:** Creación inicial de una identidad de persona, relación de parentesco, evento o registro de fuente.
- **UPDATE:** Modificación de metadatos asociados, corrección ortográfica o adición de información nominal o temporal.
- **CONFIRM:** Elevación verificada del nivel de veracidad de un registro o relación (ej: pasar de `FAMILY-SOURCED / UNVERIFIED` a `DOCUMENTED`) tras análisis de evidencias.
- **REJECT:** Descarte formal de un candidato de matching o una relación familiar hipotética que se comprueba que es errónea.
- **MERGE:** Unificación física en base de datos de dos registros correspondientes a la misma persona canónica física.
- **SPLIT:** Desunión física de un registro erróneamente unificado previamente, restaurando la segregación de identidades.
- **LINK:** Asociación física de un archivo de evidencia o una fuente de información a un evento, relación o identidad.
- **UNLINK:** Desvinculación de una evidencia de una entidad tras descubrir inconsistencias o errores.

---

## 4. Reglas del Motor de Auditoría

- **No Borrados Silenciosos:** Queda estrictamente prohibida la corrección de errores históricos o filiaciones falsas mediante eliminaciones o actualizaciones que limpien silenciosamente el estado anterior de la base de datos. El estado previo debe preservarse en el registro de auditoría, detallando la procedencia del dato corregido.
- **Explicabilidad Obligatoria:** Toda operación que modifique estados de veracidad o ejecute procesos de fusión/división de identidades requerirá de forma obligatoria la introducción manual por parte del usuario de una justificación explicativa que quedará inscrita de forma inmutable en el log de auditoría.

---

## 5. Estructura Lógica de un Registro de Auditoría

```typescript
interface AuditEntry {
    audit_entry_id: UUID; // Llave primaria inmutable
    timestamp: Date;
    operator_identity: string; // Nombre del investigador local o conector
    action: "CREATE" | "UPDATE" | "CONFIRM" | "REJECT" | "MERGE" | "SPLIT" | "LINK" | "UNLINK";
    target_resource_type: "PEOPLE" | "RELATIONSHIPS" | "EVENTS" | "EVIDENCE" | "SOURCES";
    target_resource_id: UUID; // Enlace físico a la entidad modificada
    state_before_json?: string; // Captura en bruto del estado previo de la entidad (nulo en CREATE)
    state_after_json: string; // Captura en bruto del estado posterior a la transacción
    human_justification: string; // Explicación obligatoria provista por el investigador
    parent_audit_entry_hash?: string; // Hash encadenado criptográfico de la transacción de auditoría anterior
}
```

---

## 6. Flujo de Compromiso en Base de Datos (Audit Commit Loop)

```
  [Petición de Modificación] (ej: Confirmar parentesco)
              │
              ▼
  ┌───────────────────────────────────┐
  │    Verificación de Requisitos     │ ➔ (¿Contiene justificación humana?
  │          de Auditoría             │    ¿Se asocian evidencias?)
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │ Generación de AuditEntry y Hash   │ ➔ Calcula Hash encadenado al log previo
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │ Escritura Simultánea Atómica (DB) │ ➔ Inscribe Registro en Core de Datos
  │                                   │    e inscribe la AuditEntry en el Log
  └───────────────────────────────────┘
