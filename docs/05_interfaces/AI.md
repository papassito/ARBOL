# AI

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito y Filosofía

Definir el papel, el alcance y los límites éticos y metodológicos de la Inteligencia Artificial (IA) en ÁRBOL by KLIK. 
La IA se adopta bajo el principio inquebrantable de **tecnología como asistente de lectura y estructuración, no de reescritura de la historia ni generación de identidades sintéticas**.

---

## 2. Límites Estrictos de IA (Reglas de Oro)

- **ZERO SYNTHETIC:** Queda prohibido el uso de IA generativa para crear, completar, estimar o deducir identidades de personas, fechas de nacimiento, defunciones, parentescos u hojas de registro histórico ausentes. Si la información no existe, la IA no puede inventarla para "rellenar" la base de datos de ÁRBOL by KLIK.
- **ZERO AI ON HISTORICAL EVIDENCE:** Está prohibido aplicar modelos generativos sobre documentos históricos originales, correspondencia privada o fotografías antiguas con el fin de reconstruir rostros, expresiones, objetos o completar textos deteriorados físicamente.
- **Preservación Inmutable:** El archivo original debe guardarse inalterado. Cualquier procesamiento de mejora debe etiquetarse como versión derivada artificial y exhibirse de forma paralela en la interfaz, nunca de forma sustitutiva del documento de origen.

---

## 3. Capacidades de IA Autorizadas (Asistencia de Búsquedas)

La IA podrá utilizarse de forma exclusiva como herramienta de asistencia paleográfica, organizativa y de búsqueda, en las siguientes tareas limitadas:

1. **Transcripción Asistida (OCR / HTR):** Lectura e interpretación de textos manuscritos en actas del Registro Civil o archivos parroquiales antiguos, generando **propuestas de transcripción** de apoyo para indexación de búsquedas.
2. **Clasificación Automática de Documentos:** Análisis visual para catalogar si un archivo digital recién ingresado corresponde conceptualmente a un Acta de Bautizo, Acta de Nacimiento, Acta de Matrimonio o Censo Civil.
3. **Análisis de Coincidencias Complejas:** Identificación de posibles duplicados locales o variantes nominales en base de datos cruzando variables temporales de forma heurística para sugerir pistas.
4. **Detección de Variantes Ortográficas:** Generación automática de listas de nombres de pila o apellidos con variantes históricas locales comunes (ej: "Surname-Variant-A" y "Surname-Variant-B").
5. **Sugerencias de Próximas Búsquedas:** Analizar los vacíos de información del árbol consolidado para recomendar al usuario la consulta en colecciones eclesiásticas o civiles del municipio y rango de fechas idóneos.

---

## 4. Marco de Comportamiento Algorítmico

```
  ┌───────────────────────────────────┐
  │         ENTRADA DE DATOS          │ ➔ (Actas digitalizadas o metadatos)
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │   PROCESAMIENTO ASISTIDO POR IA   │
  │ (OCR, Clasificación, Sugerencias) │ ➔ Ejecución de modelos no generativos
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │       PROPUESTA EN INTERFAZ       │
  │     (Con aviso visual claro)      │ ➔ "AI PROPONE" - No se escribe en el Core
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │        VALIDACIÓN HUMANA          │ ➔ El investigador revisa, edita y aprueba
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │        REGISTRO EN EL CORE        │ ➔ Se inscribe en DB local con su Provenance
  └───────────────────────────────────┘
```
