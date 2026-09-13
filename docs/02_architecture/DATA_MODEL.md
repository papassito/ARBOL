# DATA_MODEL

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Este documento define el modelo conceptual de dominio para ÁRBOL by KLIK. Su objetivo es delimitar las entidades de negocio genealógico, sus atributos abstractos, sus relaciones de cardinalidad y sus invariantes lógicas, con total independencia técnica de la persistencia física final.

---

## 2. Entidades de Dominio

### Persona (Person)
Representa a un individuo único en el árbol lógico.
- `id`: UUID (Estable e inmutable).
- `canonical_name`: Estructura o referencia al nombre principal determinado por evidencias de alta confianza.
- `state`: Estado vital actual (`LIVING`, `DECEASED`, `UNKNOWN`).
- `gender`: Sexo registrado en su nacimiento u origen (`MALE`, `FEMALE`, `UNKNOWN`).

### Identidad (Identity)
Conjunto de atributos y variantes nominales vinculados a una persona. Una Persona puede tener múltiples identidades registradas que posteriormente se resuelven o unifican.

### Relación Familiar (Relationship)
Entidad de primer nivel que modela el enlace entre dos identidades de personas.
- `id`: UUID.
- `type`: Tipo de relación (`PARENT_CHILD`, `SPOUSAL`, `SIBLING_LATERAL`, `OTHER`).
- `verification_level`: Grado de veracidad y confianza asignada (`DOCUMENTED`, `FAMILY-SOURCED`, `HYPOTHESIS`, `REJECTED`, `UNKNOWN`).

### Acontecimiento (Event)
Un hito histórico ocurrido en la cronología de una persona o de una relación familiar.
- `id`: UUID.
- `type`: Tipo de acontecimiento (`BIRTH`, `BAPTISM`, `MARRIAGE`, `DEATH`, `BURIAL`, `RESIDENCE`, `MIGRATION`).
- `date`: Fecha aproximada o exacta.
- `place_id`: Referencia opcional a un lugar del catálogo.

### Lugar (Place)
Localización estructurada de forma jerárquica (País -> Provincia/Estado -> Municipio -> Localidad -> Lugar Específico). Admite alias históricos independientes de la cartografía moderna.

### Fuente (Source)
Identificación del repositorio u origen físico/digital de la información (Registro Civil, Archivo Parroquial, Testimonio Oral, etc.).

### Citación (Citation)
La referencia exacta que permite localizar un registro o elemento de evidencia dentro de una Fuente determinada (ej. Tomo 4, Libro 12, Acta 85).

### Evidencia (Evidence)
El activo físico, digital o testimonial que respalda o contradice una Afirmación (Claim) en el sistema.
- `id`: UUID.
- `file_hash`: Hash criptográfico SHA-256 de integridad para archivos originales.
- `type`: Clasificación de procedencia de la prueba.

### Afirmación (Claim)
Toda proposición de hecho susceptible de ser evaluada (ej. "Persona X nació el 12 de octubre de 1900"). Los Claims no se asumen como verdades absolutas, sino que se vinculan a Evidencias para determinar su estado de verificación.

### Caso de Investigación (Research Case)
Expediente dinámico donde se agrupan hipótesis, búsquedas y candidatos sin alterar el árbol de datos de producción.

---

## 3. Relaciones de Cardinalidad Conceptual

```
  [Person] (1) <─────── (1..*) [NameVariant]
  [Person] (1) <─────── (0..*) [Event]
  [Relationship] (1) <─ (0..*) [Event]
  
  [Event] (0..*) ───────> (0..1) [Place]
  
  [Claim] (1..*) <───── (1..*) [Evidence]
  [Evidence] (1..*) ───> (1) [Source]
  [Evidence] (1..*) ───> (0..1) [Citation]
```

---

## 4. Invariantes del Modelo de Dominio

1. **Invariante de Identidad:** Dos personas canónicas distintas no pueden compartir el mismo identificador UUID de sistema bajo ninguna circunstancia.
2. **Invariante de Evidencia:** No se permite la existencia de una evidencia en estado `DOCUMENTED` que no cuente con una referencia de procedencia válida a una `Source` y opcionalmente a un archivo inmutable digital con firma de integridad.
3. **Invariante de Consistencia Cronológica:** El sistema debe alertar sobre acontecimientos imposibles (ej. defunción anterior al nacimiento, o relaciones de filiación donde el progenitor nació después del descendiente), sin impedir la captura de la transcripción literal del documento origen.