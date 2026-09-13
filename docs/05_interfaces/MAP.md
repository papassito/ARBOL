# MAP

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir el diseño lógico y la especificación conceptual del catálogo geográfico e histórico de localizaciones (asentamientos, municipios, parroquias, cementerios, etc.) y su vinculación con los acontecimientos de vida del proyecto ÁRBOL by KLIK.

---

## 2. Alcance

Aplica al diseño de la entidad **PLACES** de la base de datos y a las reglas para modelar cambios históricos de nombres y límites político-administrativos de la geografía del archivo.

---

## 3. El Catálogo Geográfico Jerárquico Histórico (PLACES)

Para garantizar la consistencia espacial de la investigación genealógica, los lugares no se guardan como cadenas de texto libre e inconexas dentro de cada evento. **Un lugar es un registro geográfico estructurado en un catálogo jerárquico:**

```
  [PaÃ­s: MÃ©xico]
       â”‚
       â””â”€â”€ [Estado: Sonora]
                â”‚
                â”œâ”€â”€ [Municipio: Municipio-Ejemplo-A] âž” Parroquia: San Miguel de Municipio-Ejemplo-A
                â”‚                          â””â”€â”€ Cementerio Municipal de Municipio-Ejemplo-A
                â”‚
                â””â”€â”€ [Municipio: CarbÃ³] âž” Parroquia: Nuestra SeÃ±ora de CarbÃ³
```

---

## 4. GestiÃ³n de Variaciones Jurisdiccionales HistÃ³ricas

Los municipios, estados y demarcaciones geogrÃ¡ficas cambian de nombre, se integran en nuevos estados o modifican su jurisdicciÃ³n a lo largo del tiempo histÃ³rico (ej: en Sonora, antiguos distritos del siglo XIX cambiaron de lÃ­mites y cabeceras municipales en el siglo XX). 
El catÃ¡logo de localizaciones debe contemplar las siguientes reglas lÃ³gicas:

- **Nombres Coexistentes en el Tiempo:** Un registro del catÃ¡logo de lugares debe permitir almacenar el nombre actual oficial y el nombre histÃ³rico aplicable a diferentes rangos de fechas (ej: *"Heroica Ciudad de Municipio-Ejemplo-A"* actual frente a *"Municipio-Ejemplo-A"* histÃ³rico decimonÃ³nico).
- **Consistencia de Evento:** El evento histÃ³rico (como un nacimiento en 1890) guardarÃ¡ la referencia al identificador del lugar con los metadatos aplicables a la jurisdicciÃ³n de esa Ã©poca, permitiendo a la UI mostrar la denominaciÃ³n exacta contemporÃ¡nea al hecho sin perder la georreferenciaciÃ³n en mapas modernos actuales.
- **GeorreferenciaciÃ³n Opcional:** Cada lugar registrado en el catÃ¡logo admitirÃ¡ coordenadas de latitud y longitud geogrÃ¡ficas para posibilitar visualizaciones geoespaciales, rutas de migraciÃ³n familiar e identificaciÃ³n de concentraciones demogrÃ¡ficas del linaje en mapas de consulta.

---

## 5. Estructura LÃ³gica de la Entidad Lugar (PLACES)

```typescript
interface Place {
    place_id: UUID; // Llave primaria
    country: string; // ej. "MÃ©xico"
    state_province: string; // ej. "Sonora"
    county_municipality?: string; // ej. "Municipio-Ejemplo"
    settlement_city_town?: string; // ej. "Localidad-Ejemplo"
    specific_location?: string; // ej. "LocalizaciÃ³n-EspecÃ­fica-Ejemplo"
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    historical_names?: PlaceHistoricalName[];
    provenance_metadata: ProvenanceMetadata;
}

interface PlaceHistoricalName {
    name_variant: string;
    valid_from_year?: number;
    valid_to_year?: number;
    context_note?: string;
}
```

---

## 6. Reglas de ValidaciÃ³n GeogrÃ¡fica

- **No GeolocalizaciÃ³n Forzada por Defecto:** Si una localidad es declarada en un testimonio pero es ilocalizable en mapas modernos debido a su desapariciÃ³n (ej. un antiguo rancho o asentamiento minero abandonado en Sonora), las coordenadas geogrÃ¡ficas permanecerÃ¡n estrictamente como `UNKNOWN`, preservando la denominaciÃ³n textual histÃ³rica aportada por la fuente.
- **Independencia de APIs CartogrÃ¡ficas:** Las consultas geogrÃ¡ficas se resuelven mediante el Ã­ndice local jerÃ¡rquico. El uso de APIs cartogrÃ¡ficas externas (ej: Google Maps, OpenStreetMap) es un servicio auxiliar de renderizado visual; su indisponibilidad no debe impedir la carga de eventos ni romper la consistencia de datos de la base de datos local.
