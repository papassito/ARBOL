# EVIDENCE

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Establecer la estructura conceptual, almacenamiento y gestión de la evidencia histórica. La evidencia es el pilar central sobre el cual se sustenta la veracidad y el nivel de verificación de cada afirmación dentro de ÁRBOL by KLIK.

---

## 2. Definición de Evidencia

Una evidencia es la manifestación documental, física, fotográfica o testimonial que vincula un dato específico (como un nacimiento, matrimonio, fallecimiento o relación filial) con una o más fuentes del catálogo. No se permite registrar una relación genealógica o acontecimiento confirmado sin una evidencia asociada.

---

## 3. Jerarquía y Grados de Certidumbre

Toda evidencia se asocia a un grado de certeza que evalúa de forma directa la confiabilidad de la afirmación:

1. **Evidencia Directa (Acreedora de DOCUMENTED):** Actas originales completas o registros parroquiales contemporáneos donde se atestiguan los hechos directamente (ej: Acta de Nacimiento que declara padres y abuelos).
2. **Evidencia Indirecta (Acreedora de FAMILY-SOURCED o HYPOTHESIS):** Menciones indirectas en documentos judiciales, actas de bautizo de hermanos menores, registros de defunción que mencionan filiación biológica sujeta a posible error de memoria de los declarantes.
3. **Evidencia Circunstancial (Soporta HYPOTHESIS):** Concurrencia de nombres en censos donde residen en la misma casa, pero no se describe el parentesco de manera explícita.
4. **Evidencia Oral (TESTIMONY):** Relatos directos de testigos directos o descendientes de primera generación.

---

## 4. Preservación y Tratamiento Digital de la Evidencia

Para garantizar la preservación histórica y la inmutabilidad de las fuentes primarias digitalizadas:

- **Original Intacto:** La imagen escaneada u hoja de registro digitalizada original nunca debe ser modificada destructivamente ni guardada con técnicas de compresión con pérdida excesiva.
- **Integridad Criptográfica:** Cada archivo binario de evidencia recibirá un hash único (ej: SHA-256) en el momento de su digitalización e ingreso al sistema. Cualquier cambio en los metadatos de la evidencia no debe alterar este hash original.
- **Versiones Derivadas:** Las correcciones no destructivas orientadas a mejorar la legibilidad (contraste, niveles, rotaciones) o transcripciones paleográficas se gestionarán de forma separada como recursos hijos de la evidencia original.

---

## 5. Estructura de Datos Lógica de Evidencia

```
  [EVIDENCIA MAESTRA (ID Único - UUID)]
           │
           ├── [Metadatos Básicos]
           │      ├── Tipo: ACTA_DE_MATRIMONIO
           │      ├── Nivel de confianza asignado: HIGH
           │      └── Referencia a Fuente de Origen (UUID de SOURCES)
           │
           ├── [Archivo Original Preservado]
           │      ├── Hash Criptográfico (SHA-256)
           │      └── Ruta del Archivo Local Seguro (lectura única)
           │
           ├── [Derivados Autorizados (ZERO AI)]
           │      ├── Versión restaurada de contraste
           │      └── Transcripción literal realizada por humanos
           │
           └── [Vinculaciones del Dominio]
                  ├── Enlace a Persona A (UUID)
                  ├── Enlace a Persona B (UUID)
                  └── Enlace a Relación (UUID de RELATIONSHIPS)
```

---

## 6. Reglas de Validación de Evidencias

- **Preferencia de Origen:** Una copia digitalizada de un acta parroquial o civil tiene preferencia metodológica absoluta sobre un testimonio oral y sobre cualquier árbol genealógico de terceros.
- **Soberanía Tecnológica:** Ninguna evidencia digitalizada localmente será cargada de manera automática a servidores públicos externos sin autorización explícita del investigador (local-first y private by default).
