# SECURITY

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Definir las políticas, protocolos conceptuales de seguridad y directrices de protección de la infraestructura de datos local para garantizar el control de acceso, la integridad de los registros de auditoría y la resiliencia ante pérdidas físicas del proyecto ÁRBOL by KLIK.

---

## 2. Alcance

Aplica a la base de datos local, el almacén físico de documentos y fotos digitalizadas (Blob Store), la API interna y los flujos de importación y exportación de copias de seguridad.

---

## 3. Principios de Seguridad Aplicables

- **Least Privilege (Mínimo Privilegio):** La API interna y los conectores externos operan bajo el mínimo nivel de permisos lógicos necesarios sobre la base de datos maestra. Los conectores externos solo poseen capacidades de consulta en solo lectura, no pueden realizar modificaciones directas en el núcleo de datos del sistema de armado de árbol familiar.
- **Fail Closed (Fallo Seguro):** Ante cualquier fallo del sistema de integridad criptográfica, anomalía de autenticación local o incoherencia crítica de base de datos, el sistema suspenderá los accesos a los visualizadores de documentos originales, impidiendo la alteración accidental o exposición indebida de archivos de preservación.
- **Local-First & Private by Default:** Las credenciales y claves de descifrado local se almacenan única y exclusivamente en el entorno seguro del dispositivo local del investigador; no se transmiten ni guardan en servidores web de terceros.

---

## 4. Directrices de Seguridad Conceptual

### Autenticación y Autorización
- El acceso a la interfaz web local de ÁRBOL by KLIK requiere autenticación obligatoria mediante credenciales de seguridad robustas gestionadas de forma local por el sistema operativo o el entorno de ejecución seguro local.
- Se definirá un control de acceso basado en roles funcionales lógicos (ej: *Investigador Principal* con permisos de escritura y confirmación de evidencias, y *Familiares Visores* con permisos exclusivos de solo lectura sobre registros históricos autorizados).

### Integridad Criptográfica de Archivos y Base de Datos
- El sistema calculará y cotejará periódicamente las firmas SHA-256 de todas las fotos y documentos históricos.
- Cualquier anomalía o alteración detectada fuera de la aplicación de ÁRBOL by KLIK (por ejemplo, por la acción de virus de software del sistema operativo o alteración manual del disco duro) será reportada en el Dashboard de UI y bloqueará el estado de la evidencia para preservación forense.

### Diario de Auditoría Inviolable
- La base de datos local estructurará la traza de auditoría de modificaciones de tal forma que cada registro de log esté encadenado criptográficamente con el registro de log anterior (estructura tipo diario de auditoría protegido). Esto garantiza que no se puedan eliminar silenciosamente mutaciones históricas del árbol genealógico.

### Respaldos, Cifrado y Recuperación
- Las copias de respaldo (*Backups*) generadas por el sistema cifrarán de forma obligatoria los datos de la base de datos y los archivos digitales utilizando algoritmos robustos con claves administradas localmente por el usuario.
- Se implementará un mecanismo lógico de respaldo redundante en medios de almacenamiento físicos locales independientes (ej: unidades de disco duro externas locales en frío) para prevenir pérdidas ante fallas de hardware en el dispositivo primario.

---

## 5. Arquitectura Conceptual de Seguridad

```
  ┌─────────────────────────────────────────────────────────────┐
  │                   USER AUTHENTICATION                       │
  │            (Credenciales locales protegidas)                │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ (Permite acceso)
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    UI / APPLICATION LAYER                   │
  │          (Filtro de Privacidad: Vivos vs Deceased)           │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ (Llamadas API Seguras)
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    SECURITY SHIELD API                      │
  │          (Comprobación de Privilegios / Fail Closed)        │
  └──────────────────────────────┬──────────────────────────────┘
                                 ├──────────────────────────────┐
                                 ▼                              ▼
  ┌─────────────────────────────────────────────────────────────┐┌──────────────────────────────┐
  │                    DATABASE ENGINE                          ││     INMUTABLE BLOB STORE     │
  │         (Auditoría Encadenada Inviolable)                    ││ (Cotejo Periódico SHA-256)   │
  └─────────────────────────────────────────────────────────────┘└──────────────────────────────┘
```
