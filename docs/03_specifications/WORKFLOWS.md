# WORKFLOWS

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Este documento detalla los flujos de trabajo operativos de ÁRBOL by KLIK. Define el ciclo de vida de los datos desde su descubrimiento inicial, su clasificación, la recolección de evidencias lógicas y la validación manual por parte del usuario humano.

---

## 2. Flujo de Investigación Genealógica (Ciclo General)

```
  [Planteamiento de Pregunta]
               │
               ▼
    ┌─────────────────────┐
    │  Crear Research Case│ ➔ Delimita hipótesis y búsquedas (Aísla datos del árbol)
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  Ejecutar Búsqueda  │ ➔ Consulta índices locales e interroga APIs externas
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  Evaluar Candidatos │ ➔ El Match Engine propone relaciones basadas en score
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  Ingesta Evidencias │ ➔ Registro de fuente, carga de acta y cálculo de SHA-256
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │  Validación Humana  │ ➔ Comparación, descarte (REJECTED) o confirmación
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │ Incorporar al Core  │ ➔ Se escribe como DOCUMENTED en el Family Core
    └─────────────────────┘
```

---

## 3. Flujo Detallado de Operaciones Clave

### Ingesta de Documentos y Fotografías Históricas:
1. El usuario selecciona e importa un archivo binario (escáner de acta, correspondencia o retrato fotográfico).
2. El sistema calcula inmediatamente el hash SHA-256 de forma local en el navegador/dispositivo.
3. Se verifica si el hash ya existe en la base de datos (detección de duplicados físicos).
4. El archivo original se deposita en el almacén seguro local de solo lectura (*Blob Store*).
5. Se asocia el archivo a un identificador único de `EVIDENCE`.
6. Cualquier optimización visual no generativa o transcripción paleográfica manual se registra de forma ramificada como una versión derivada (`Derived`).

### Fusión de Identidades (Identity Merge):
1. Tras la identificación de duplicados nominales y temporales con alta coincidencia, el usuario inicia la fusión.
2. El sistema expone una vista paralela comparando atributos, eventos y familiares directos de ambos perfiles.
3. El investigador debe seleccionar cuál de las dos identidades es la canónica principal y proporcionar una justificación escrita manual obligatoria.
4. El motor unifica las referencias de evidencias de ambos perfiles bajo el UUID primario.
5. El perfil redundante se marca de forma lógica como inactivo (enlace de desvío de identidad).
6. Se registra el acontecimiento completo en el encadenado de `Audit Log`.

### División de Identidades (Identity Split):
1. Cuando se determina que una fusión anterior fue errónea (por ejemplo, al descubrir que existieron dos homónimos contemporáneos con diferentes cónyuges).
2. El usuario selecciona la opción de "Deshacer Fusión" desde la ficha de perfil o el log de auditoría.
3. El sistema solicita la creación de una nueva identidad limpia con su propio UUID.
4. El usuario redirige de manera selectiva las evidencias, acontecimientos y parentescos correspondientes hacia la identidad correcta.
5. Se inscribe la transacción y justificación humana obligatoria en el `Audit Log`.

### Validación y Registro de Testimonios:
1. Captura de la grabación de voz o transcripción de la tradición oral.
2. Asociación obligatoria de la identidad del informante y la fecha del testimonio (`Provenance`).
3. El testimonio se almacena de forma inalterable y se clasifica inicialmente como `TESTIMONY` (no califica como hecho certificado).
4. Se utiliza para guiar nuevas búsquedas en repositorios civiles o religiosos en búsqueda de pruebas primarias.

---

## 4. Payloads JSON y Ejemplo de Auditoría Criptográfica

Para habilitar la interoperabilidad y garantizar la consistencia en la capa lógica, se definen los siguientes formatos JSON estándar para transacciones críticas.

### Payload: Unificación de Identidades (Merge)
Este payload se envía al iniciar una fusión de dos personas homónimas que representan al mismo individuo histórico.

```json
{
  "primary_person_id": "a3b0c1d2-e3f4-5a6b-7c8d-9e0f1a2b3c4d",
  "secondary_person_id": "f5e4d3c2-b1a0-9f8e-7d6c-5b4a3f2e1d0c",
  "justification": "Fusión confirmada tras hallar coincidencia exacta en acta de defunción de 1950 que liga ambos registros de parentesco colateral.",
  "user_identity": "investigador_principal"
}
```

### Payload: División de Identidades (Split)
Este payload se envía para separar una fusión previa identificada como errónea, restaurando la segregación de identidades limpias.

```json
{
  "merged_person_id": "a3b0c1d2-e3f4-5a6b-7c8d-9e0f1a2b3c4d",
  "new_person_payload": {
    "given_names": ["GivenName-Delta"],
    "last_names": ["Surname-Epsilon"],
    "gender": "MALE",
    "state": "DECEASED"
  },
  "redirection_links": {
    "relationships": ["r1-uuid-etc"],
    "events": ["e1-uuid-etc"],
    "evidence": ["ev1-uuid-etc"]
  },
  "justification": "Fusión errónea detectada: GivenName-Delta nació en distinta localidad y año según acta de bautizo descubierta.",
  "user_identity": "investigador_principal"
}
```