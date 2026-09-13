# UI

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir conceptualmente la estructura, organización de pantallas, navegación y requisitos visuales de la interfaz de usuario (UI) de ÁRBOL by KLIK.

---

## 2. Alcance

Aplica al diseño lógico de todos los componentes visuales necesarios para la visualización del árbol genealógico, la gestión de investigaciones y la visualización interactiva de evidencias sin prescribir el uso de frameworks de Frontend específicos.

---

## 3. Vistas Obligatorias del Sistema (Vistas de Interfaz)

La interfaz del usuario debe organizarse conceptualmente en torno a los siguientes tableros y módulos:

1. **DASHBOARD (Panel Principal):** Muestra el estado global del archivo, estadísticas de nivel de verificación general, accesos directos a casos de investigación abiertos y alertas de nuevas sugerencias de coincidencia.
2. **TREE VIEW (Vista de Árbol):** Representación gráfica e interactiva de las relaciones de parentesco (vistas de ancestros directos, vistas descendientes y visualización en abanico).
3. **PERSON VIEW (Perfil de Persona):** Ficha individualizada que expone: nombres, variantes ortográficas, acontecimientos vitales, listado de familiares directos, catálogo de evidencias vinculadas y traza de procedencia de sus datos.
4. **FAMILY VIEW (Vista de Núcleo Familiar):** Vista dedicada a una pareja y sus hijos, ideal para cotejar la consistencia de eventos cronológicos familiares.
5. **SEARCH (Centro de Búsquedas):** Panel de consulta con filtros estructurados de búsqueda nominal, geográfica, temporal y relacional.
6. **RESEARCH CASES (Casos de Investigación):** Tablero kanban para organizar investigaciones complejas en curso (ej: localizar el matrimonio de Person-Alpha y Person-Beta) sin mezclar hipótesis con el árbol consolidado.
7. **SOURCES (Catálogo de Fuentes):** Lista navegable de los repositorios físicos y digitales asociados.
8. **EVIDENCE REGISTRY (Registro de Evidencias):** Panel de control para cargar evidencias, visualizar actas originales, cotejar transcripciones paleográficas y comprobar hashes criptográficos.
9. **DOCUMENTS / PHOTOS ARCHIVE:** Biblioteca visual de archivos digitales y fotografías históricas con visualizadores integrados de zoom sin procesamientos generativos.
10. **PLACES (Catálogo Geográfico):** Visualización de asentamientos históricos estructurados jerárquicamente por país, estado y municipio.
11. **TIMELINE (Línea de Tiempo):** Representación cronológica ordenada de los acontecimientos de una persona o de una familia completa.
12. **MATCH REVIEW (Evaluador de Coincidencias):** Interfaz para comparar de forma paralela el registro local con propuestas externas de matching con desglose de razones explicables y controles para aceptar fusión o descartar.
13. **AUDIT LOG (Visor de Auditoría):** Monitor del diario inmutable de operaciones del sistema.

---

## 4. Requisitos de Diferenciación Visual de Niveles de Certeza

La UI de ÁRBOL by KLIK tiene prohibido simular certezas donde no las hay. No se permite representar una inferencia u opinión familiar como un hecho probado. 
El sistema utilizará colores, marcas de agua, texturas o símbolos inequívocos en todos los árboles y fichas para identificar los siguientes estados de los datos:

- **DOCUMENTED (Sustentado):** Representado con indicadores estables de color verde o iconos de escudo verificado. Transmite solidez y certificación absoluta.
- **FAMILY-SOURCED (Tradición Familiar):** Representado con colores suaves o tramas específicas (ej: amarillo tenue). Indica información con alta plausibilidad pero pendiente de verificación en archivo primario.
- **HYPOTHESIS (Investigación / Hipótesis):** Representado mediante líneas discontinuas, bordes punteados o iconos de interrogante de investigación activa (ej: naranja o azul grisáceo).
- **UNKNOWN (Desconocido):** Representación explícita con la etiqueta "DESCONOCIDO" en tipografía cursiva gris, evitando rellenar vacíos.
- **REJECTED (Descartado):** Elementos tachados visualmente o marcados con indicadores de advertencia de descarte (ej: rojo) para alertar al investigador sobre caminos cerrados de búsqueda.

---

## 5. Principio de Presentación Visual

> **La interfaz de usuario nunca convertirá una hipótesis o una inferencia en un hecho mediante su presentación visual.**

Si un parentesco es puramente hipotético, el enlace de línea del árbol genealógico se pintará de forma punteada y requerirá un aviso explícito flotante indicando que no cuenta con actas de confirmación.
