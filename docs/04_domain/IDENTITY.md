# IDENTITY

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir el modelo lógico para la resolución de identidades dentro de ÁRBOL by KLIK, estableciendo diferencias metodológicas insoslayables entre un registro individualizado y una persona canónica identificada.

---

## 2. Alcance

Aplica a la especificación de diseño del **Person Registry** y a los procesos lógicos de unificación de registros (*Merge*) y división de identidades (*Split*).

---

## 3. Diferenciación de Conceptos: Registro vs Persona

Para evitar la creación de personas sintéticas o asunciones falsas de filiación, el modelo conceptual divide de forma rigurosa estos tres conceptos:

- **RECORD (Registro):** La mención individualizada de una persona en un documento o fuente concreta (ej: "GivenName-Alpha Surname-Beta" mencionado en el Acta de Bautizo de GivenName-Gamma).
- **IDENTITY (Identidad):** El conjunto de atributos nominales, fechas estimadas y procedencias vinculados a un identificador lógico local único.
- **PERSON (Persona Canónica):** El ser humano físico e histórico unificado de forma verificada por la investigación. Una persona canónica puede estar vinculada a múltiples registros históricos tras un análisis de evidencias que compruebe la identidad de forma segura.

---

## 4. Reglas de Resolución de Identidad

- **Nombres No Únicos:** Los nombres de pila y apellidos no actúan como identificadores de base de datos. Se generará de forma inmutable un UUID local para cada persona canónica registrada.
- **Variantes Nominales:** Las variantes ortográficas históricas de una persona se registran como variantes asociadas y válidas del mismo individuo (ej: "Surname-Variant-1", "Surname-Variant-2", "Surname-Variant-3") para enriquecer las búsquedas, manteniendo un nombre canónico principal determinado por la evidencia de mayor confianza.
- **Fusión de Identidades (Merge):** Dos identidades locales pueden unirse si y solo si la evidencia colectiva lo respalda. El proceso genera una inhabilitación lógica de la identidad redundante y transfiere sus registros y relaciones a la identidad unificada primaria, registrando la justificación del merge de forma permanente en la auditoría.
- **División de Identidades (Split):** Si descubrimientos posteriores demuestran que dos individuos con el mismo nombre fueron fusionados erróneamente, el sistema debe permitir desvincular los registros históricos hacia una nueva identidad limpia sin alterar ni destruir la integridad del archivo histórico.

---

## 5. Invariantes de Identidad

1. No se admite el autocompletado automático de nombres de padres basándose únicamente en homonimias parciales presentes en el árbol de investigación.
2. Si la fecha o lugar de nacimiento es desconocido, el valor almacenado e indexado debe ser estrictamente `UNKNOWN`. No se infieren fechas aproximadas sin declarar explícitamente el rango de hipótesis de confianza.

---

## 6. Diagrama Conceptual de Identidad

```
   ┌─────────────────────────────┐
   │  PERSONA CANÓNICA (UUID)    │
   └──────────────┬──────────────┘
                  │ (Múltiples Enlaces Históricos Confirmados)
                  ├───────────────────────────────┐
                  ▼                               ▼
   ┌─────────────────────────────┐ ┌─────────────────────────────┐
   │  Registro Parroquial 1931   │ │   Registro Civil 1950       │
   │  (Asociado a Evidencia)     │ │   (Asociado a Evidencia)     │
   └─────────────────────────────┘ └─────────────────────────────┘
```
