# PHOTO

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir el modelo lógico, las reglas de preservación y los metadatos asociados al archivo de fotografías históricas de la familia dentro de ÁRBOL by KLIK.

---

## 2. Conservación y Principio Zero AI

Las fotografías familiares históricas constituyen evidencia genealógica directa de fisonomía, relaciones afectivas, estatus socioeconómico y costumbres de época. Por tanto, están sujetas al principio de **preservación intacta del original**:

- **Original Intacto:** La imagen digitalizada tal como fue extraída del escáner o cámara de preservación debe ser resguardada en formato de alta calidad y de solo lectura. No se permiten sobrescrituras destructivas sobre este fichero original.
- **Prohibición de Generación Artificial:** Está rotundamente prohibido utilizar técnicas de inteligencia artificial generativa sobre el archivo original para inventar, recrear o reescribir información visual inexistente (rostros completos destruidos por el paso del tiempo, detalles de fondos borrosos, etc.).
- **Mejoras No Generativas Autorizadas:** Se permite la creación de copias de visualización derivadas que empleen técnicas tradicionales de conservación fotográfica digital:
  - Corrección de niveles, brillo y contraste.
  - Modificaciones del histograma cromático o balance de blancos para paliar la degradación química de la imagen.
  - Enfoques suaves, nitidez lineal y reducción de ruido analógico tradicional.
  - Escalados lineales algorítmicos convencionales (sin autocompletado generativo de píxeles artificiales).

---

## 3. Metadatos Asociados a las Fotografías

Para que una fotografía funcione como evidencia genealógica válida, debe poder registrar de forma estructurada los siguientes metadatos conceptuales:

- **Identificador Único:** UUID local autogenerado.
- **Enlace al Archivo de Preservación:** Ruta local y firma criptográfica SHA-256 del fichero fotográfico original digitalizado.
- **Fecha de Captura:** Fecha conocida o rango aproximado estimado (ej: década de 1940).
- **Ubicación Geográfica:** Lugar de la captura asociado al catálogo de lugares (PLACES).
- **Acontecimiento o Contexto:** Evento social o familiar en el cual se capturó la fotografía (ej: matrimonio, festividad, retrato de estudio).
- **Procedencia / Donante:** Miembro de la familia o archivo del cual proviene la copia física original digitalizada.
- **Identificación de Personas:** Mapeo de coordenadas visuales (cajas delimitadoras bidimensionales) asociando zonas de la imagen con personas canónicas de la base de datos, incorporando:
  - Nivel de certeza de la identificación (ej. *Confirmado por testimonio*, *Identidad muy probable*, *Desconocido*).
  - Identidad de la persona que realizó la identificación visual humana en el sistema.

---

## 4. Estructura Conceptual del Registro de Fotografía

```typescript
interface PhotoMetadata {
    photo_id: UUID;
    original_file_hash: string; // SHA-256
    estimated_date?: ApproximateDate;
    captured_place_id?: UUID;
    provenance_donated_by: string;
    original_physical_format?: "BROWN_PRINT" | "DAGUERREOTYPE" | "FILM_NEGATIVE" | "PRINT_PAPER" | "DIGITAL";
    identified_regions: PhotoPersonLink[];
    derivative_versions: PhotoDerivative[];
}

interface PhotoPersonLink {
    region_coordinates: { x: number; y: number; width: number; height: number }; // Caja visual
    person_id: UUID; // Llave foránea a PEOPLE
    certainty_level: "DOCUMENTED_VERIFIED" | "FAMILY_CONFIRMED" | "PROBABLE" | "UNKNOWN";
    identified_by_user: string;
    identification_date: Date;
}

interface PhotoDerivative {
    derivative_id: UUID;
    file_hash: string;
    applied_filters: string[]; // ej: ["CONTRAST_ENHANCE", "NOISE_REDUCE"]
    is_active_for_preview: boolean;
}
```

---

## 5. Visualización Diferenciada en la UI

La interfaz de visualización de fotos siempre mostrará la etiqueta **"ORIGINAL PRESERVADO"** o **"RESTAURACIÓN DIGITAL (ZERO AI)"** según corresponda, impidiendo que el investigador confunda versiones mejoradas con la evidencia física en bruto.
