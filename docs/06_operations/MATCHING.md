# MATCHING

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Establecer las reglas de negocio y los criterios lógicos para calcular e identificar posibles duplicados, identidades compartidas y coincidencia de registros tanto locales como procedentes de fuentes externas en el ecosistema ÁRBOL by KLIK.

---

## 2. Alcance

El motor de matching de ÁRBOL by KLIK evalúa similitudes de datos y genera puntuaciones explicables de afinidad para personas y relaciones familiares, sin realizar fusiones automáticas bajo ninguna circunstancia.

---

## 3. Factores de Puntuación de Coincidencias

El cálculo de similitud se pondera sobre la evaluación cruzada de los siguientes elementos de coincidencia:

1. **Similitud Nominal (Peso Medio-Alto):** Distancia fonética y ortográfica sobre nombres y apellidos, incluyendo variaciones nominales históricas (ej. "GivenName-Alpha-Variant" vs "GivenName-Alpha").
2. **Similitud Temporal (Peso Alto):** Superposición lógica de eventos de nacimiento, bautizo, matrimonio y fallecimiento. Se aplican penalizaciones estrictas si las fechas violan límites biológicos (ej. un hijo nacido después de 15 meses de la muerte de la madre).
3. **Similitud de Localización (Peso Medio):** Coincidencia de localidades, parroquias y estados administrativos a nivel histórico.
4. **Coincidencia de Red Familiar (Peso Muy Alto):** Intersección de relaciones de parentesco. Si dos registros de "GivenName-Alpha Surname-Beta" tienen padres llamados de forma idéntica "GivenName-Gamma Surname-Delta" y "GivenName-Epsilon Surname-Zeta", la certeza de coincidencia se eleva exponencialmente.

---

## 4. Reglas del Motor de Matching

- **No Confirmación Automática:** El motor puede calcular un nivel de confianza del 99.9%, pero la confirmación genealógica requiere irrevocablemente validación humana.
- **Explicabilidad Obligatoria:** Cada propuesta de coincidencia mostrada en la interfaz de ÁRBOL by KLIK debe explicar de forma comprensible por qué se considera candidata (ej. *"Se propone coincidencia por un 90% de similitud en los nombres y coincidencia de 2 familiares directos"*).
- **Gestión de Descartes:** Cuando una coincidencia sea rechazada por el usuario, el estado de la relación de matching cambia a `REJECTED` de forma permanente, registrando los motivos para evitar alertar de nuevo al investigador en el futuro.

---

## 5. Matriz Conceptual de Puntuación de Coincidencia (Matching Grid)

| Elemento Evaluado | Condición Máxima | Condición Mínima (Fallo) | Penalización Crítica |
| :--- | :--- | :--- | :--- |
| **Nombres** | Coincidencia exacta o variante documentada histórica. | Sin coincidencias de variantes o nombres incompatibles. | Nombres de pila contradictorios (ej: "Juan" vs "Pedro"). |
| **Fechas** | Diferencia menor a 1 año en nacimientos. | Diferencia mayor a 10 años en registros sin aproximación. | Hitos imposibles (ej: bautizo previo al nacimiento). |
| **Lugares** | Misma parroquia o municipio histórico. | Municipios distantes sin ruta de transporte de la época. | Diferentes continentes sin registro de emigración. |
| **Parentesco** | Ambos padres y cónyuge idénticos. | Padres o cónyuges diferentes confirmados documentalmente. | Hermano con nombre idéntico viviendo de forma concurrente. |

---

## 6. Ciclo de Vida del Matching

```
      [Identidad A]  +  [Identidad B]
              │
              ▼
    ┌───────────────────┐
    │  Evaluación de    │ ➔ Compara nombres, fechas, geografía, familiares
    │    Afinidad       │
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │  Generar Puntaje  │ ➔ Calculates % y redacta razones de coincidencia
    │   Explicable      │
    └─────────┬─────────┘
              │
              ▼
    ┌───────────────────┐
    │  Revisión en UI   │ ➔ Estado: MATCH / CANDIDATE (No afecta árbol)
    └─────────┬─────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
 [Aceptar Fusión]     [Descartar Coincidencia]
   ➔ Ejecuta MERGE      ➔ Cambia a REJECTED en Audit Log
```
