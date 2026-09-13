# GOVERNANCE

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Este documento establece las reglas de gobernanza, el flujo de toma de decisiones, el proceso de incorporación de nuevos requisitos y la cadena de autoridad documental del proyecto ÁRBOL by KLIK. Su objetivo es garantizar la inmutabilidad de los principios rectores y estructurar la transición desde el laboratorio experimental hacia el núcleo estable del sistema.

---

## 2. Flujo de Autoridad Documental

La toma de decisiones técnicas, metodológicas y funcionales sigue un orden jerárquico estricto. Ninguna capa inferior puede contradecir los preceptos de una capa superior:

1. **GOVERNANCE** (Este documento): Regula el marco general de toma de decisiones.
2. **REQUIREMENTS**: Traduce los principios en especificaciones obligatorias.
3. **CONTRACTS**: Define las interfaces e intercambios de datos lógicos.
4. **ARCHITECTURE**: Estructura de capas e interacción de componentes sin ataduras de frameworks.
5. **COMPONENTS**: Asigna responsabilidades lógicas específicas.
6. **DOCUMENTOS ESPECIALIZADOS**: Detalla de forma conceptual cada dominio (DATABASE, EVIDENCE, etc.).
7. **IMPLEMENTATION**: Código ejecutable (prohibido en la fase actual).

---

## 3. Integración de la Innovación (INNO.md)

El laboratorio de innovación (`INNO.md`) funciona de manera independiente al árbol normativo estable. Para promover una idea o experimento a un componente regulado del sistema, se debe cumplir el siguiente ciclo:

1. **Propuesta (IDEA):** Registro libre de la idea en `INNO.md`.
2. **Prototipo (EXPERIMENTAL):** Experimentación sin alterar el núcleo estable de datos.
3. **Evaluación de Compatibilidad (VALIDATED):**
   - Verificación de cumplimiento estricto de **ZERO SYNTHETIC**.
   - Verificación de cumplimiento estricto de **ZERO AI ON HISTORICAL EVIDENCE**.
   - Análisis de impacto en la privacidad y la soberanía Local-First.
4. **Revisión del Gobierno Documental (PROMOTED):**
   - Incorporación formal de las directrices a `REQUIREMENTS.md`.
   - Definición de contratos en `CONTRACTS.md`.
   - Actualización de los diagramas conceptuales de arquitectura.

---

## 4. Criterios de Clasificación de la Verdad Genealógica

La gobernanza establece que la interfaz y el motor de datos deben tratar cada afirmación de acuerdo con los siguientes niveles obligatorios de procedencia:

- **DOCUMENTED (Certificado):** Respaldado inequívocamente por fuentes primarias e históricas con integridad verificada.
- **FAMILY-SOURCED (Familiar):** Datos originados en registros informales de la familia.
- **TESTIMONY (Testimonio):** Memoria oral provista por un informante identificado.
- **HYPOTHESIS (Hipótesis):** Supuestos de trabajo en investigación activa.
- **CANDIDATE (Candidato / Match):** Propuestas algorítmicas sin validación humana.
- **UNKNOWN (Desconocido):** Representación explícita del vacío de información.
- **REJECTED (Descartado):** Hipótesis o coincidencias descartadas formalmente para evitar retrabajo de investigación.

---

## 5. Reglas de Modificación del Baseline

- **Preservación Histórica:** Ninguna corrección debe destruir el registro de procedencia del dato anterior.
- **Inmutabilidad de Decisiones:** Los principios fundamentales (Zero AI sobre evidencia y Local-First) no pueden ser modificados ni mitigados.
- **Control de Versiones Documentales:** Cualquier cambio en el estado del baseline documental debe ser registrado formalmente en el `CHANGELOG.md` con su respectiva justificación.
