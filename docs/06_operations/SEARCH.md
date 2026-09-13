# SEARCH

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir el diseño funcional y conceptual del motor de búsquedas de ÁRBOL by KLIK. El motor debe permitir encontrar registros locales e interrogar a conectores externos empleando criterios flexibles de coincidencia sin alterar las identidades maestras.

---

## 2. Alcance de Búsqueda

El motor opera bajo dos modalidades fundamentales de expansión de redes familiares:

### Búsqueda Vertical
Permite la exploración a través de líneas sucesorias directas ascendentes y descendentes:
`Persona Objetivo` ➔ `Padres` ➔ `Abuelos` ➔ `Bisabuelos` ➔ `Tatarabuelos y Generaciones Anteriores`.

### Búsqueda Lateral
Permite explorar ramas colaterales para descubrir evidencias o registros civiles indirectos:
`Persona Objetivo` ➔ `Hermanos` ➔ `Parejas` ➔ `Hijos` ➔ `Primos` ➔ `Sobrinos`. 
*Nota:* Las ramas laterales a menudo contienen la única prueba documental superviviente sobre los padres de un ancestro directo.

---

## 3. Criterios y Parámetros de Búsqueda Soportados

El motor debe recibir una consulta estructurada que incluya:
- **Filtros Nominales:** Nombres de pila, apellidos primarios, apellidos secundarios y variantes ortográficas o fonéticas (tolerancia a errores de transcripción histórica).
- **Filtros Temporales:** Fechas exactas, rangos de años y aproximaciones basadas en hitos vitales estimados (por ejemplo, asumiendo fertilidad histórica o esperanza de vida estándar).
- **Filtros de Localidad:** Países, estados, municipios, parroquias específicas y coordenadas asociadas a eventos históricos.
- **Filtros de Relación:** Buscar candidatos condicionados a la coincidencia paralela con los nombres de sus padres, hermanos, cónyuges o hijos.

---

## 4. Reglas del Motor de Búsqueda

- **Preservación del Nombre Canónico:** El uso de variantes ortográficas para formular una consulta de búsqueda nunca debe modificar los nombres canónicos de las personas registradas localmente.
- **Tratamiento del Vacío:** Las búsquedas con rangos temporales amplios no deben forzar resultados automáticos si el dato no se encuentra en el índice local; el sistema debe reportar el resultado como `NO ENCONTRADO / UNKNOWN`.
- **Historial de Consultas:** Se conservará un historial conceptual de búsquedas asociadas a un **Research Case** para evitar repetir consultas idénticas en las bases de datos de proveedores externos.

---

## 5. Diseño Lógico del Pipeline de Búsqueda

```
  [Criterios de Entrada] (Nombre, Fechas Estimadas, Lugar)
            │
            ▼
  ┌───────────────────────────────────┐
  │      Generador de Variantes       │ ➔ (Aplica reglas fonéticas locales,
  │            Nominales              │    ej: "Surname-Variant-A" / "Surname-Variant-B")
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │   Ejecución de Consulta Local     │ ➔ Busca en Base de Datos Local
  └─────────────────┬─────────────────┘
                    │
                    ├─ [Si requiere búsqueda externa]
                    ▼
  ┌───────────────────────────────────┐
  │      Source Connectors Query      │ ➔ Interroga APIs Externas Desacopladas
  └─────────────────┬─────────────────┘
                    │
                    ▼
  ┌───────────────────────────────────┐
  │       Consolidador Lógico         │ ➔ Retorna lista clasificada como:
  │            de Resultados          │    - Registros Locales Existentes
  └───────────────────────────────────┘    - Candidatos Externos (CANDIDATE)
```
