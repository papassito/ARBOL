# SOURCES

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir la clasificación, el catálogo y las políticas de administración de fuentes de información del proyecto ÁRBOL by KLIK. Las fuentes proveen el sustento para cada una de las evidencias registradas.

---

## 2. Clasificación Conceptual de Fuentes

Para estructurar correctamente la confiabilidad, las fuentes se catalogan bajo las siguientes categorías obligatorias:

1. **FUENTE PRIMARIA:** Registro contemporáneo al hecho, emitido por una entidad autorizada o testigo directo del evento (ej: actas del Registro Civil, partidas parroquiales de bautizo originales, testimonios orales del propio protagonista).
2. **FUENTE SECUNDARIA:** Transcripciones posteriores, compilaciones, estudios históricos publicados u obras que interpretan fuentes primarias.
3. **TESTIMONIO:** Declaración directa y oral de familiares sobre recuerdos o tradiciones heredadas.
4. **REPOSITORIO EXTERNO:** Archivos públicos, bases documentales digitales públicas (ej: FamilySearch, archivos estatales de Sonora) y repositorios oficiales.
5. **ÍNDICES:** Listas de nombres, resúmenes de actas o bases de datos comerciales de búsqueda. Un índice guía la búsqueda de la fuente primaria, pero no la sustituye.
6. **ÁRBOL DE TERCEROS:** Árboles familiares cargados en plataformas comerciales o públicas por otros usuarios de internet. Se consideran hipótesis hasta localizar las fuentes directas.
7. **FUENTE DESCONOCIDA:** Aquella de la que se posee información histórica, pero su origen de extracción es ilocalizable.

---

## 3. Catálogo Inicial de Fuentes Asociadas

El sistema permite registrar y catalogar fuentes de diversa índole a través de metadatos configurables. 
Las fuentes iniciales modeladas incluyen colecciones de archivos de Registro Civil, archivos parroquiales, 
censos nacionales e históricos, así como colecciones documentales y fotográficas familiares de carácter privado.

---

## 4. Reglas de Administración de Fuentes

- **Soberanía del Core:** Ninguna fuente externa es depositaria de la verdad de ÁRBOL by KLIK. Los datos de proveedores externos se guardan localmente en forma de referencias de procedencia.
- **Identificación Unívoca:** Cada fuente registrada en el catálogo debe poseer un identificador local único (UUID), nombre estructurado, ámbito geográfico e información de contacto o localización del repositorio físico o digital original.
- **Inmutabilidad:** Las fuentes registradas no se borran; si un repositorio digital desaparece o cambia sus enlaces, el registro de la fuente se conserva localmente como referencia histórica obligatoria del hallazgo.

---

## 5. Estructura Conceptual del Catálogo

```
  [CATÁLOGO DE FUENTES]
           │
           ├── Fuente 001: Registro Civil - Localidad Genérica (FUENTE PRIMARIA)
           │      │
           │      └── Evidencia E-101: Acta de Nacimiento (1931)
           │
           ├── Fuente 002: Censo de Población Nacional Histórico (REPOSITORIO EXTERNO / ÍNDICE)
           │      │
           │      └── Evidencia E-102: Hoja de Registro de Familia
           │
           └── Fuente 003: Testimonio Oral - Informante A (TESTIMONY)
                  │
                  └── Evidencia E-103: Grabación y Transcripción de Audio
```
