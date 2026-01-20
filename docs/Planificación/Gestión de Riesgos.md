
# Gestión e Identificación de Riesgos

La gestión de riesgos es vital en este TFG debido a la inclusión de funcionalidades complejas como el juego online (RF-04).

## 1. Identificación y Análisis de Riesgos

Se presenta una matriz de riesgos ampliada que integra los riesgos preliminares del Acta de Constitución junto con riesgos técnicos y de gestión identificados durante la planificación detallada.

| ID      | Riesgo                                  | Categoría | Probabilidad | Impacto  | Descripción                                                                                             |
| :------ | :-------------------------------------- | :-------- | :----------- | :------- | :------------------------------------------------------------------------------------------------------ |
| **R01** | Complejidad en la sincronización online | Técnico   | Media        | Muy Alto | Dificultad para mantener el estado de la partida sincronizado entre clientes.   |
| **R02** | Retraso en el procesado de assets       | Ejecución | Media        | Medio    | Las imágenes originales del P&P pueden requerir más retoque digital del previsto para ser funcionales.  |
| **R03** | Errores en la lógica "Revolution"       | Técnico   | Media        | Alto     | Complejidad algorítmica al desplazar cartas en la cuadrícula 3x3 manteniendo la consistencia del juego. |
| **R04** | Incapacidad de cumplir el cronograma    | Gestión   | Media        | Alto     | Falta de tiempo debido a la mala estimación de tareas.                       |
| **R05** | Scope Creep (Alcance no controlado)     | Gestión   | Media        | Alto     | Tendencia a añadir "pulido" o funciones extra que consumen tiempo crítico.           |
| **R06** | Imprevistos en el despliegue            | Técnico   | Baja         | Muy Alto | Fallos en la configuración de Vercel o en la integración del dominio que impidan la entrega.     |
| **R07** | Conflictos de Propiedad Intelectual     | Externo   | Muy Baja     | Muy Alto | Posibilidad de que el autor original revoque el permiso de uso de los assets o mecánicas.               |
| **R08** | Incompatibilidad de librerías           | Técnico   | Baja         | Alto     | Conflictos entre versiones de Next.js, React o librerías de UI que obliguen a refactorizar.             |
| **R09** | Fallo de hardware o pérdida de datos    | Técnico   | Muy Baja     | Muy Alto | Avería del equipo de desarrollo o corrupción del repositorio sin backup reciente.                       |
| **R10** | Crisis personal o de salud              | Externo   | Baja         | Alto     | Enfermedad prolongada o imprevistos personales que detengan el desarrollo por un tiempo significativo.  |


## 2. Plan de Respuesta a Riesgos

### 2.1. Estrategias de Mitigación

* **R01 (Sincronización):** Si la arquitectura de comunicación presenta cuellos de botella insalvables, se establecerá el **Modo Hotseat (Local)** como núcleo funcional, dejando el online como una "mejora" fuera del alcance mínimo.
* **R02 (Assets):** Se utilizarán placeholders (formas geométricas simples) durante la fase de desarrollo lógico para no bloquear la programación por falta de arte final.
* **R03 (Lógica Revolution):** Desarrollo dirigido por pruebas (TDD) para el algoritmo de desplazamiento de cartas, validando cada caso de borde de forma aislada.
* **R04 (Cronograma):** Seguimiento estricto del cronograma de hitos. Se ha reservado un margen al final para imprevistos.
* **R05 (Scope Creep):** No se implementará ninguna funcionalidad que no figure en la Feature List inicial sin antes haber completado el núcleo del juego.
* **R06 (Despliegue):** Configuración de un entorno de Preproducción desde la semana 4 para detectar problemas de despliegue semanas antes de la entrega formal.
* **R07 (Propiedad Intelectual):** Se contactará con el autor tras la fecha de la corrección final para evitar contratiempos durante el desarrollo y la evalucación del tribunal.
* **R08 (Incompatibilidad):** Uso de versiones fijas de dependencias y uso de un entorno de desarrollo consistente (dev container).
* **R09 (Pérdida de datos):** Uso diario de Git con pushes al repositorio remoto (GitHub) al finalizar cada sesión de trabajo.

### 2.2. Plan de Contingencia (Acciones de Disparo)

| Condición de Disparo                                    | Acción de Contingencia                                                             |
| :------------------------------------------------------ | :--------------------------------------------------------------------------------- |
| Retraso > 2 semanas en lógica de backend (R01).         | Abandono del modo online para centrarse en estabilidad local.                      |
| El autor expresa su descontento con el uso de su juego (R07). | Sustitución de assets artísticos por iconografía genérica de dominio público.      |
| Fallo crítico de hardware (R09).                        | Transición al equipo secundario (portátil) y restauración desde GitHub. |
| Bloqueo por carga de trabajo externa (R04).             | Reducción del pulido gráfico y efectos visuales para asegurar la lógica core.      |

## 3. Monitorización y Control de Riesgos

La matriz de riesgos se revisará al final de cada iteración. La aparición de un riesgo de impacto "Muy Alto" que se materialice (ej. enfermedad grave) obligará a una reunión con el tutor para renegociar el alcance o los plazos dentro de la normativa de la Universidad.