# API

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir conceptualmente la interfaz de programación de aplicaciones (API) interna del sistema ÁRBOL by KLIK. El diseño está estructurado alrededor de recursos de dominio desacoplados, consistentes con la naturaleza *local-first*.

---

## 2. Alcance

Especifica las operaciones de API lógicas requeridas por la interfaz de usuario para interactuar de forma segura con el núcleo genealógico. **No define endpoints HTTP físicos en ejecución**, sino la especificación conceptual de llamadas para los controladores lógicos del sistema.

---

## 3. Recursos de Dominio Definidos

Las operaciones del sistema deben organizarse estrictamente en torno a los siguientes recursos conceptuales:

- **`/people`:** Creación, lectura, unificación y segmentación de personas canónicas.
- **`/relationships`:** Gestión de enlaces lógicos de parentesco y vinculación de evidencias.
- **`/events`:** Creación y modificación de acontecimientos históricos de vida.
- **`/places`:** Mantenimiento del catálogo de asentamientos, municipios y parroquias históricas.
- **`/sources`:** Catálogo de repositorios, archivos parroquiales y colecciones documentales.
- **`/evidence`:** Registro e inyección de pruebas asociadas a fuentes y archivos.
- **`/documents`:** Repositorio de conservación de documentos históricos digitalizados.
- **`/photos`:** Repositorio de imágenes fotográficas familiares históricas.
- **`/testimonies`:** Almacén de registros de testimonios de memoria oral.
- **`/research-cases`:** Gestión de expedientes de casos de investigación activos.
- **`/search`:** Consultas federadas locales y activación de adaptadores de conectores externos.
- **`/matching`:** Revisión de candidatos a duplicados o parentescos sugeridos.
- **`/audit`:** Consulta de la traza de auditoría de mutaciones del archivo.

---

## 4. Operaciones Conceptuales Requeridas (Firmas Lógicas)

### People Resource
- `GET /people/{id}`: Obtiene el perfil de la persona canónica, variantes de nombre, acontecimientos vitales y procedencia.
- `POST /people`: Inserta una nueva identidad con estado de investigación `UNKNOWN` o `FAMILY-SOURCED`.
- `POST /people/merge`: Ejecuta la fusión verificada de dos personas homónimas que la evidencia demuestra que son la misma.
  - **Request Body (JSON):**
    ```json
    {
      "primary_person_id": "UUID",
      "secondary_person_id": "UUID",
      "justification": "string",
      "user_identity": "string"
    }
    ```
  - **Response (200 OK):**
    ```json
    {
      "status": "SUCCESS",
      "audit_entry_id": "UUID"
    }
    ```

- `POST /people/split`: Deshace una fusión previa, separando registros en dos identidades limpias.
  - **Request Body (JSON):**
    ```json
    {
      "merged_person_id": "UUID",
      "new_person_payload": {
        "given_names": ["string"],
        "last_names": ["string"],
        "gender": "MALE | FEMALE | UNKNOWN",
        "state": "LIVING | DECEASED | UNKNOWN"
      },
      "redirection_links": {
        "relationships": ["UUID"],
        "events": ["UUID"],
        "evidence": ["UUID"]
      },
      "justification": "string",
      "user_identity": "string"
    }
    ```
  - **Response (200 OK):**
    ```json
    {
      "status": "SUCCESS",
      "audit_entry_id": "UUID",
      "new_person_id": "UUID"
    }
    ```

### Relationships Resource
- `POST /relationships`: Crea un enlace asociativo entre personas con estado `HYPOTHESIS`.
- `POST /relationships/{id}/link-evidence`: Vincula un identificador de evidencia (UUID) a una relación existente.
- `PUT /relationships/{id}/verify`: Cambia el nivel de verificación de la relación a `DOCUMENTED` o `FAMILY-SOURCED` tras aprobación humana.

### Research Cases Resource
- `POST /research-cases`: Crea un nuevo expediente para aislar hipótesis de investigación.
  - **Request Body (JSON):**
    ```json
    {
      "title": "string",
      "objective": "string"
    }
    ```
  - **Response (201 Created):**
    ```json
    {
      "case_id": "UUID"
    }
    ```

### Audit Resource
- `GET /audit/verify`: Consulta el validador criptográfico encadenado para evaluar la integridad del log de auditoría.
  - **Response (200 OK):**
    ```json
    {
      "is_valid": true,
      "total_records": 42,
      "corrupt_entries": []
    }
    ```

### Evidence Resource
- `POST /evidence`: Incorpora una nueva prueba digital, requiere vincular un ID de Fuente del catálogo.
- `POST /evidence/{id}/original`: Almacena el fichero binario original intacto y genera su hash SHA-256.
- `POST /evidence/{id}/derivatives`: Registra una transcripción literal paleográfica o una versión de visualización optimizada.

### Search / Matching
- `GET /search`: Interroga el catálogo local y opcionalmente activa conectores en segundo plano.
- `GET /matching/candidates`: Recupera propuestas de coincidencia explicadas generadas por el Match Engine.
- `POST /matching/{id}/reject`: Descarta permanentemente un candidato a coincidencia, anotando razones.

---

## 5. Reglas de Comunicación y Manejo de Estados

- **Aislamiento de Errores (Fail Closed):** En caso de inconsistencias de datos o fallos en la comprobación criptográfica del original de un documento, la API debe bloquear el acceso a la versión de consulta para proteger la evidencia de corrupción o manipulación, marcando el estado de integridad como `COMPROMISED`.
- **Auditoría Sistemática:** No se permite que operaciones de creación, modificación, fusión o rechazo (POST/PUT/DELETE lógicos) concluyan con éxito si no emiten simultáneamente una transacción hacia el subsistema `/audit`.
