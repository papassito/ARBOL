# ÁRBOL by KLIK
# COMPONENTS.md

**Estado:** BASELINE DOCUMENTAL

---

## 1. Propósito

Este documento define los componentes conceptuales necesarios para la arquitectura de
búsqueda y armado de árbol de ÁRBOL by KLIK.

No prescribe todavía tecnologías, lenguajes, bases de datos ni
implementaciones específicas.

---

# 2. FAMILY CORE

Componente central responsable del modelo genealógico.

Gestionará conceptualmente:

- personas;
- familias;
- relaciones;
- generaciones;
- acontecimientos;
- lugares.

Debe mantener separadas identidad y parentesco.

Que dos registros correspondan a la misma persona no implica que una
relación familiar determinada esté demostrada.

---

# 3. PERSON REGISTRY

Registro canónico de personas.

Cada persona tendrá un identificador interno independiente de:

- nombre;
- apellidos;
- documentos externos;
- proveedores;
- identificadores genealógicos externos.

Permitirá registrar:

- nombre completo;
- variantes nominales;
- sexo cuando sea conocido;
- nacimiento;
- fallecimiento;
- residencia;
- relaciones;
- observaciones;
- estado de investigación.

---

# 4. RELATIONSHIP ENGINE

Representará relaciones como:

- padre;
- madre;
- hijo;
- hermano;
- pareja;
- cónyuge;
- otras relaciones familiares documentables.

Toda relación deberá poder vincularse con evidencia.

---

# 5. EVIDENCE REGISTRY

Será responsable de registrar la evidencia que respalda una afirmación.

Tipos posibles:

- acta;
- libro parroquial;
- fotografía;
- censo;
- padrón;
- periódico;
- escritura;
- carta;
- inscripción;
- testimonio;
- registro digital;
- otra fuente.

La evidencia deberá conservar procedencia.

---

# 6. SOURCE REGISTRY

Catálogo de fuentes.

Permitirá diferenciar:

FUENTE PRIMARIA
FUENTE SECUNDARIA
TESTIMONIO
REPOSITORIO EXTERNO
ÍNDICE
ÁRBOL DE TERCEROS
FUENTE DESCONOCIDA

Cada consulta deberá poder indicar de dónde procede el dato.

---

# 7. DOCUMENT ARCHIVE

Componente de preservación documental.

Administrará:

- originales;
- copias;
- transcripciones;
- metadatos;
- procedencia;
- integridad;
- relaciones con personas.

El original será inmutable desde la perspectiva del archivo.

---

# 8. PHOTO ARCHIVE

Archivo especializado en fotografías familiares.

Permitirá:

- conservar originales;
- registrar fecha aproximada;
- registrar lugar;
- registrar evento;
- identificar personas;
- registrar quién realizó una identificación;
- indicar nivel de certeza.

Las versiones mejoradas deberán mantenerse separadas del original.

---

# 9. ZERO AI RESTORATION

Componente conceptual para procesamiento conservador de fotografías.

Permitirá exclusivamente operaciones no generativas autorizadas.

Nunca deberá reemplazar la evidencia original.

---

# 10. TESTIMONY REGISTRY

Permitirá documentar memoria oral familiar.

Cada testimonio deberá registrar, cuando sea posible:

- informante;
- fecha;
- persona mencionada;
- afirmación;
- contexto;
- evidencia relacionada.

Un testimonio no se convertirá automáticamente en hecho documental.

---

# 11. PLACE REGISTRY

Catálogo histórico/geográfico.

Permitirá relacionar personas y acontecimientos con:

- país;
- estado;
- municipio;
- población;
- parroquia;
- cementerio;
- otros lugares relevantes.

Deberá contemplar cambios históricos de nombres y jurisdicciones.

---

# 12. SEARCH ENGINE

Responsable de formular y ejecutar búsquedas sobre fuentes disponibles.

Podrá utilizar:

- nombres;
- variantes ortográficas;
- fechas;
- rangos temporales;
- localidades;
- padres;
- parejas;
- hijos;
- hermanos;
- acontecimientos.

---

# 13. SOURCE CONNECTORS

Capa destinada a integrar fuentes externas.

Podrá existir un conector independiente por proveedor o repositorio.

Los conectores deberán estar desacoplados del FAMILY CORE.

La desaparición de un proveedor externo no deberá destruir el árbol
genealógico local.

---

# 14. MATCH ENGINE

Analizará posibles coincidencias entre registros.

Podrá considerar:

- nombre;
- apellidos;
- variantes;
- fechas;
- lugares;
- padres;
- hijos;
- pareja;
- hermanos;
- acontecimientos relacionados.

Su resultado será siempre una PROPUESTA DE COINCIDENCIA.

Nunca una confirmación automática.

---

# 15. RESEARCH CASES

Permitirá abrir investigaciones específicas.

Ejemplo:

CASE:
Subject-Alpha + Subject-Beta

OBJETIVO:
Localizar evidencia de unión civil o eclesiástica.

PISTAS:
Localidad-X / Localidad-Y / Rango temporal estimado.

ESTADO:
ABIERTO.

Los casos permitirán investigar sin contaminar el árbol confirmado.

---

# 16. AUDIT / PROVENANCE

Registrará:

- origen de la información;
- modificaciones;
- confirmaciones;
- descartes;
- cambios de clasificación;
- incorporación de evidencia.

El proyecto deberá poder explicar:

> ¿Por qué creemos que esta persona es quien decimos que es?

---

# 17. EXPORT / PRESERVATION

Permitirá preservar y eventualmente intercambiar información mediante
formatos documentados.

Las capacidades concretas de importación/exportación serán definidas
posteriormente.

---

# 18. HUMAN VALIDATION

La decisión final sobre una relación genealógica corresponde al proceso
de validación humana apoyado por evidencia.

AUTOMATION → PROPONE

EVIDENCE → RESPALDA

HUMAN VALIDATION → CONFIRMA

FAMILY CORE → REGISTRA