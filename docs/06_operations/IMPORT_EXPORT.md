# IMPORT_EXPORT

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir las directrices funcionales, estándares de datos conceptuales, formatos admitidos y políticas de protección de la soberanía del archivo aplicables a los procesos de importación y exportación de ÁRBOL by KLIK.

---

## 2. Interoperabilidad con Estándares Genealógicos

Para garantizar la preservación de la memoria histórica a lo largo de las décadas y la comunicación fluida con otros investigadores, ÁRBOL by KLIK contempla conceptualmente el soporte de interoperabilidad con los siguientes formatos estándar de la industria:

- **GEDCOM (Genealogical Data Communication):** Soporte de lectura y generación para las versiones consolidadas estándar (especialmente GEDCOM 5.5.1 y especificaciones posteriores basadas en XML/JSON).
- **Esquemas Estructurados JSON/CSV:** Para la exportación ágil en forma de tablas relacionales planas de catálogos de evidencias, fuentes, listas de personas e historiales de auditoría con propósitos de análisis forense externo.
- **Formatos de Preservación de Metadatos Documentales:** Adopción conceptual de especificaciones de metadatos estables (como Dublin Core para catálogos de fuentes y documentos).

---

## 3. Políticas y Reglas de Importación

- **Soberanía Maestra Local:** El proceso de importación de cualquier árbol genealógico externo o fichero GEDCOM de terceros jamás unificará o modificará los registros locales existentes de forma automática.
- **Aislamiento en Estado Inicial (Isolation Layer):** Todo dato importado ingresa al sistema como un conjunto de registros de procedencia externa y se marca de forma global con el estado de verificación inicial **`UNVERIFIED`** o **`CANDIDATE`**.
- **Mantenimiento de Trazabilidad:** Al realizar una importación de datos, se generará de forma automática y obligatoria un registro de procedencia (`ProvenanceMetadata`) que almacenará:
  - Identificador único del sistema origen (External ID).
  - Nombre de la fuente origen (ej. "Árbol GEDCOM exportado de MyHeritage").
  - Fecha y hora exacta de la importación.
  - Identidad de la persona que autorizó la carga.
- **Conservación de Estructura de Origen:** La importación no forzará la creación de parentescos confirmados; se importan como hipótesis estructurales hasta que el investigador asocie las evidencias correspondientes localmente.

---

## 4. Políticas y Reglas de Exportación

- **Filtros de Privacidad Activos:** Antes de iniciar cualquier proceso de exportación física del archivo de datos, el sistema evaluará de forma estricta el estado vital de los registros en base a las reglas de `PRIVACY.md`.
- **Ofuscación Automática de Personas Vivas:** Cualquier registro de persona viva o asumida como viva por cronología lógica verá ofuscados de forma automática sus campos nominales y temporales por la cadena `<PERSONA VIVA / PRIVADO>` en el fichero de salida, suprimiendo la descarga de sus archivos de fotos u actas confidenciales vinculadas.
- **Inclusión Selectiva de Evidencias:** El usuario podrá elegir de forma granular en la interfaz gráfica qué ramas familiares se exportan, y si se adjuntan las imágenes digitalizadas originales o si únicamente se exportan las referencias textuales de procedencia histórica.

---

## 5. Pipeline Conceptual de Importación

```
 [Fichero Externo GEDCOM] ➔ [Analizador de Formato] ➔ [Validador de Integridad]
                                                            │
                                                            ▼ (Aísla datos importados)
 [Árbol Maestro Local] <── [Revisión Manual Humana] <── [Registros en Estado UNVERIFIED]
```
