# HISTORIA Y MEMORIAS DEL PROYECTO

**Proyecto:** ÁRBOL by KLIK  
**Naturaleza:** Memorias de desarrollo, lecciones aprendidas y evolución técnica

---

## 1. El Origen de ÁRBOL by KLIK

El proyecto nació de la necesidad de conceptualizar un sistema genealógico que rompiera con las dinámicas de las plataformas comerciales tradicionales. Mientras que la mayoría de los sistemas en la nube asumen un enfoque de conectividad permanente, dependencias de APIs centralizadas y unificación descuidada de identidades, **ÁRBOL by KLIK** se diseñó bajo las premisas de soberanía del dato (**Local-First**), privacidad estricta por diseño (**Private by Default**) y primacía de la prueba histórica sobre la suposición (**Evidence-Driven / Source-First**).

---

## 2. Metodología de Saneamiento de Datos (Separación de Conceptos)

Para evitar la mezcla de datos de prueba con la definición técnica del producto, se estableció una regla estricta de diseño de software:
- Se mantiene una separación absoluta entre el baseline normativo del software y las instancias de datos de usuarios.
- Todo el baseline fue sometido a un proceso de **Saneamiento Documental Absoluto**, eliminando cualquier referencia a personas, lugares, fechas o relaciones de prueba específicas.
- Los ejemplos de la documentación utilizan nomenclatura estrictamente abstracta y marcadores genéricos (`GivenName-Alpha`, `Surname-Beta`, `Municipio-Ejemplo`, etc.) para garantizar la reusabilidad del sistema.

---

## 3. La Creación del Script de Auditoría (`deep_audit.ps1`)

Para garantizar que el espacio de trabajo nunca volviera a verse contaminado de manera silenciosa con datos de uso particular o carpetas físicas residuales de pruebas locales, se diseñó e implementó un script de automatización estática: `deep_audit.ps1`.

Este script escanea el repositorio de forma implacable buscando términos nominales y geográficos prohibidos en los documentos Markdown, validando que existan los 30 componentes requeridos y denunciando cualquier anomalía.

El script actúa como guardián de calidad del proyecto, asegurando que no se introduzcan accidentalmente datos específicos dentro de las especificaciones y garantizando un **`BASELINE SANEADO, SEGURO Y COMPLETO`**.

---

## 4. Evolución Hacia la Persistencia Física

Una vez depurado el diseño conceptual, la transición lógica de la Fase 1 a la Fase 2 requirió la materialización de la base de datos. 
Se optó por **SQLite (WASM + OPFS)** como el motor de persistencia maestro. Esto permite que toda la base de datos se almacene de forma compacta en un único archivo físico transferible por el usuario, dándole control total sobre su información y preservando las memorias de su linaje de forma inmutable frente al paso del tiempo o caídas de servidores.

La historia de ÁRBOL by KLIK se escribe hoy bajo los principios de la honestidad técnica, la rigurosidad metodológica y la soberanía del dato. El baseline está cerrado; el software está listo para nacer.

---

## 5. De la Especidificación Conceptual a la Persistencia Física Activa

La evolución del proyecto dio un salto cuántico al pasar de la pura especificación documental al código ejecutable. Se estableció el entorno de desarrollo TypeScript moderno empleando el compilador de Node.js v24 y el motor de ejecución rápida `tsx` (TypeScript Execute) para evitar conflictos con módulos de tipo nativo ES. 

Esto permitió materializar de forma atómica el DDL relacional y crear físicamente el archivo de persistencia `arbol_dev.db` en el directorio de resguardo local `/backups`. Asimismo, se implementó compatibilidad de análisis estático multi-lenguaje inicializando un módulo nativo de Go (`go.mod`) con directorios de ejecución estructurados (`/cmd` e `/internal`), garantizando una integración fluida con herramientas automáticas de inspección de código.