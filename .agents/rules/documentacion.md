---
trigger: always_on
---

### Reglas para el Registro Automático de Devlogs

  1. Ubicación y Estructura del Archivo:
      • Los devlogs deben registrarse en docs/Monitoreo/Iteración [X]/Devlogs_sprint_[X].md.
      • Al cambiar de sprint, se debe crear el nuevo archivo siguiendo el encabezado principal # Devlogs Sprint [X].
  2. Formato de Entrada Diaria:
      • Toda nueva entrada debe comenzar con el encabezado ## Devlog [N]: [DD/MM/YYYY], donde N es el número secuencial del devlog dentro del sprint actual y DD/MM/YYYY es
      la fecha de la modificación.
      • Los cambios deben redactarse en formato de viñetas (-) con lenguaje neutro e impersonal (Se ha implementado..., Se ha refactorizado...).
      • Usar sub-viñetas sangradas para detallar aspectos técnicos:
          • Clases, métodos o controladores creados o modificados.
          • Patrones de diseño aplicados (ej. Strategy, MVC, etc.).
          • Cambios en el modelo de datos o persistencia.

  3. Registro de Prompts e Interacción con IA:
      • Si una tarea o generación de código/tests usó asistencia de IA (Antigravity, Claude, ChatGPT, etc.), se debe especificar el modelo utilizado y registrar el prompt
      exacto en un bloque de cita ( > prompt).
  4. Sección de Decisiones de Diseño:
      • Si el cambio implica una decisión arquitectónica relevante o modificación del modelo de dominio, se debe añadir un subencabezado ## Decisión de diseño bajo el devlog
      correspondiente justificando el motivo técnico.

  ──────
  ### Reglas Adicionales de Documentación Recomendadas

  1. Trazabilidad con EDT e Issues:
      • Vincular cada entrada del devlog con el número de Issue o el elemento de la EDT correspondiente (ejemplo: Issue 11: Resolver conflictos de prioridad).
  2. Registro de Cobertura y Enfoque de Pruebas (TDD):
      • Especificar cuándo se aplique TDD o se añadan tests unitarios/integración, mencionando qué edge cases o escenarios de error se han cubierto.
  3. Control de Cambios de Entorno y Base de Datos:
      • Registrar cualquier modificación en entidades JPA (@Entity), scripts de base de datos, variables de entorno (.env) o configuración de Docker (docker-compose).
  4. Sincronización con Documentos de Análisis:
      • Si se modifica la lógica de negocio o modelo de datos, se debe actualizar inmediatamente el documento correspondiente en docs/Análisis/ (Modelo de Dominio.md o Casos
      de Uso.md).