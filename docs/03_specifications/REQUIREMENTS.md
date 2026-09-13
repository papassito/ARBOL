# ÁRBOL by KLIK
# REQUIREMENTS.md

**Estado:** BASELINE DOCUMENTAL

---

# 1. Requisitos fundamentales

## REQ-CORE-001 — Persona canónica

Cada persona deberá disponer de una identidad interna única.

Los nombres no deberán utilizarse como identificadores únicos.

---

## REQ-CORE-002 — Datos desconocidos

El sistema deberá permitir datos desconocidos.

No deberá fabricar valores para completar campos.

---

## REQ-CORE-003 — Relaciones explícitas

Las relaciones familiares deberán representarse explícitamente.

---

## REQ-CORE-004 — Evidencia de relación

Toda relación confirmada deberá poder asociarse con una o más fuentes
o con una clasificación explícita de procedencia.

---

# 2. Evidencia

## REQ-EVD-001 — Procedencia

Todo dato incorporado deberá poder indicar su procedencia.

---

## REQ-EVD-002 — Clasificación

La información deberá poder clasificarse como:

- DOCUMENTADA
- INFORMACIÓN FAMILIAR
- TESTIMONIO
- HIPÓTESIS
- COINCIDENCIA
- DESCONOCIDA
- DESCARTADA

---

## REQ-EVD-003 — Originales

Los documentos históricos originales deberán conservarse sin
modificaciones destructivas.

---

## REQ-EVD-004 — Derivados

Las transcripciones, restauraciones y copias deberán distinguirse del
original.

---

## REQ-EVD-005 — Integridad

El sistema deberá permitir mecanismos para comprobar la integridad de
archivos originales.

---

# 3. Fotografías

## REQ-PHO-001 — Preservación

La fotografía original deberá conservarse intacta.

---

## REQ-PHO-002 — ZERO AI

No deberá utilizarse generación para reconstruir información visual
inexistente en una fotografía tratada como evidencia histórica.

---

## REQ-PHO-003 — Identificación

La identificación de una persona dentro de una fotografía deberá
registrar su nivel de certeza y procedencia.

---

## REQ-PHO-004 — Identidades inciertas

Una identidad probable no deberá convertirse automáticamente en una
identidad confirmada.

---

# 4. Investigación

## REQ-RES-001 — Casos de investigación

El sistema deberá permitir investigar hipótesis sin incorporarlas al
árbol confirmado.

---

## REQ-RES-002 — Variantes nominales

Las búsquedas deberán admitir variantes ortográficas y nominales.

Una variante utilizada durante una búsqueda no deberá modificar el
nombre canónico de una persona.

---

## REQ-RES-003 — Rangos temporales

Las búsquedas deberán permitir fechas aproximadas y rangos.

---

## REQ-RES-004 — Relaciones como pistas

El sistema deberá poder utilizar padres, hijos, hermanos y parejas para
refinar una búsqueda.

---

## REQ-RES-005 — Búsqueda lateral

El sistema deberá permitir investigar familiares laterales para obtener
evidencia sobre una persona objetivo.

---

# 5. Fuentes externas

## REQ-SRC-001 — Desacoplamiento

Ningún proveedor externo deberá convertirse en dependencia obligatoria
del núcleo genealógico.

---

## REQ-SRC-002 — Autoridad local

El archivo familiar mantendrá su propio registro canónico.

Los identificadores externos serán referencias.

---

## REQ-SRC-003 — Fuente identificable

Cada resultado externo deberá conservar información suficiente para
identificar su procedencia.

---

## REQ-SRC-004 — Proveedores gratuitos

El sistema deberá poder operar inicialmente utilizando fuentes
familiares, públicas y gratuitas.

Los servicios comerciales serán opcionales.

---

## REQ-SRC-005 — Restricciones externas

El sistema deberá respetar las condiciones de acceso, privacidad,
licencias y términos aplicables a cada fuente.

---

# 6. Matching

## REQ-MAT-001 — Coincidencias

El sistema podrá calcular posibles coincidencias entre registros.

---

## REQ-MAT-002 — Factores

El análisis podrá considerar:

- nombres;
- apellidos;
- fechas;
- lugares;
- padres;
- parejas;
- hijos;
- hermanos;
- otros acontecimientos relacionados.

---

## REQ-MAT-003 — No confirmación automática

Una puntuación de coincidencia nunca deberá convertirse por sí sola en
confirmación genealógica.

---

## REQ-MAT-004 — Explicabilidad

Toda coincidencia propuesta deberá poder explicar qué elementos
contribuyeron a ella.

---

# 7. ZERO SYNTHETIC

## REQ-ZS-001

El sistema no deberá inventar personas.

## REQ-ZS-002

El sistema no deberá inventar relaciones.

## REQ-ZS-003

El sistema no deberá inventar fechas.

## REQ-ZS-004

El sistema no deberá inventar lugares.

## REQ-ZS-005

El sistema no deberá inventar documentos o fuentes.

## REQ-ZS-006

La ausencia de información deberá representarse como ausencia de
información.

---

# 8. Auditoría y trazabilidad

## REQ-AUD-001

Toda modificación relevante del árbol deberá ser trazable.

---

## REQ-AUD-002

Deberá poder conocerse qué evidencia provocó una confirmación.

---

## REQ-AUD-003

Los descartes deberán conservar su justificación cuando resulte
relevante para evitar repetir investigaciones.

---

## REQ-AUD-004

Una corrección histórica no deberá borrar silenciosamente la procedencia
del dato anterior.

---

# 9. Privacidad

## REQ-PRV-001

La información de personas vivas deberá recibir tratamiento diferenciado
respecto de registros históricos de personas fallecidas.

---

## REQ-PRV-002

La publicación de información familiar no será automática.

---

## REQ-PRV-003

La existencia de información en una fuente externa no implicará
autorización automática para republicarla.

---

## REQ-PRV-004

Los datos especialmente sensibles requerirán controles adicionales antes
de su incorporación, procesamiento o publicación.

---

# 10. Baseline inicial de investigación

## CASE-001

Objetivo:

Investigar de forma sistemática y documentar una estructura familiar de prueba.

Información inicial (Ejemplo genérico):
- Persona de Referencia A (procedencia estimada).
- Persona de Referencia B (procedencia estimada).
- Descendencia preliminar reportada por tradición oral.

Objetivos iniciales del caso:
1. Localizar evidencia del evento de nacimiento del primogénito.
2. Localizar evidencia de matrimonio o unión de los progenitores.
3. Identificar ascendientes directos utilizando fuentes primarias.
4. Verificar geografía y cronología lógica de todos los acontecimientos.

Estado:

OPEN / FAMILY-SOURCED / DOCUMENTARY VERIFICATION PENDING