# PRIVACY

**Proyecto:** ÁRBOL by KLIK  
**Estado:** STABLE / BASELINE DOCUMENTAL

---

## 1. Propósito

Establecer las políticas lógicas de privacidad, seguridad de la información personal de familiares vivos y de protección de datos confidenciales y sensibles en el sistema ÁRBOL by KLIK.

---

## 2. Alcance

Aplica a todas las vistas, bases de datos locales, esquemas de exportación y procesos de sincronización con repositorios externos de ÁRBOL by KLIK.

---

## 3. Tratamiento Diferenciado: Personas Vivas vs Personas Fallecidas

Para garantizar la protección de la privacidad, el sistema de armado de árbol aplica políticas diferenciadas:

### Personas Vivas
- **Estado por Defecto:** Cualquier persona identificada en el sistema como viva (`state: "LIVING"`) o de la que se asuma su vida de manera implícita por contexto de edad se clasifica estrictamente como **PRIVADA POR DEFECTO**.
- **Ocultación en Exportaciones:** Sus datos nominales completos, fechas exactas de nacimiento, residencias, fotografías y correspondencia privada se omitirán u ofuscarán de forma automática en cualquier proceso de exportación pública sustituyéndolos por el literal `<PERSONA VIVA / PRIVADO>`.
- **Limitación en Sincronización:** Los conectores de bases de datos externas tienen estrictamente prohibido subir información o registros de personas vivas locales a repositorios públicos en línea.

### Personas Fallecidas e Información Histórica
- Los datos de personas fallecidas (`state: "DECEASED"`) cuya muerte esté documentada o inferida lógicamente de forma sólida por temporalidad se consideran de naturaleza histórica.
- El acceso a su información histórica y genealógica es abierto para los investigadores autorizados, permitiendo exportaciones con fines de preservación de la memoria histórica.

---

## 4. Gestión de Información Altamente Sensible

Ciertas evidencias y testimonios familiares de carácter íntimo o delicado (ej: adopciones no divulgadas formalmente, datos médicos históricos, correspondencia confidencial de disputas familiares) requieren controles de acceso adicionales:

- **Etiquetado de Sensibilidad:** Las evidencias o testimonios pueden marcarse explícitamente con el atributo `IS_SENSITIVE = TRUE`.
- **Bloqueo Local:** Los documentos marcados como sensibles requerirán autenticación local reforzada para su despliegue y lectura en la interfaz gráfica del usuario.
- **Exclusión Automatizada:** No se incluirán archivos binarios de documentos sensibles en copias de salvaguarda destinadas a nubes públicas, limitándose de forma estricta a copias físicas locales cifradas.

---

## 5. Principios de Privacidad por Diseño

1. **Private by Default:** El sistema no publica, comparte ni transmite ninguna información genealógica a servidores de terceros de manera automática o implícita. Toda acción de compartición es voluntaria, selectiva y requiere confirmación explícita e inequívoca del usuario.
2. **Local Sovereignty:** El investigador y la familia son los únicos dueños soberanos de la información y archivos depositados en el dispositivo local.

---

## 6. Esquema de Clasificación de Datos

```
  [REGISTROS DE ARBOL BY KLIK]
                 │
                 ├── Persona Viva ➔ [PRIVADO POR DEFECTO] ➔ Ofuscado en Exportación
                 │
                 ├── Evidencia Sensible ➔ [ACCESO RESTRINGIDO] ➔ Cifrado / Re-auth en UI
                 │
                 └── Registro Histórico Deceased ➔ [ACCESO INVESTIGADOR] ➔ Exportable para Preservación
```
