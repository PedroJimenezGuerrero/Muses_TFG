# Acta de Constitución: Digitalización de Muses Usando Tecnologías Web

## Propósito del Proyecto

**Justificación y Caso de Negocio**
Este proyecto nace de la oportunidad de transformar un juego de mesa en formato *Print & Play* (P&P) en una aplicación digital interactiva. Actualmente, los juegos P&P requieren que el usuario asuma costes de impresión, montaje y espacio físico, además de la limitación de juego presencial. La digitalización elimina estas barreras, permitiendo una distribución global, la automatización de reglas complejas para evitar errores humanos y la posibilidad de jugar en entornos digitales modernos.

Desde el punto de vista académico, el proyecto justifica su necesidad al aplicar un marco de gestión profesional (PMBOK 6) y una metodología de desarrollo ágil (FDD), demostrando el dominio de los conocimientos adquiridor a lo largo del grado de Ingeniería de Software.

**Objetivos de Negocio**
Los objetivos de este proyecto son los siguientes:
- Digitalizar el 100% de los componentes esenciales del juego original en un plazo de 4 meses.
- Implementar un sistema de reglas automatizado que reduzca el tiempo de aprendizaje del jugador.
- Lograr un despliegue funcional en entorno web que sea fácilmente accesible para el tribunal evaluador.

## Descripción del Proyecto

El proyecto consiste en el diseño, desarrollo y despliegue de una versión digital del juego de mesa *Muses*. Utilizando los frameworks *Next.js* y *Springboot*, se transformarán los assets del P&P en una interfaz de usuario dinámica. El desarrollo se basará en el modelo de dominio del juego y se ejecutará mediante iteraciones basadas en características (FDD), asegurando que cada funcionalidad añadida aporte valor jugable.

### **Objetivos del Proyecto y Criterios de Éxito**
Para asegurar el éxito del proyecto, se deben cumplir los siguientes objetivos dentro de los plazos y recursos asignados:
- Definir el modelo de dominio y la lista maestra de características en los primeros 15 días.
- Completar la lógica de juego programada (mecánicas core) antes de la semana 10.
- Lograr una interfaz de usuario funcional que permita completar una partida de principio a fin sin errores críticos.
- Realizar el despliegue en el dominio final al menos 15 días antes de la entrega de la memoria técnica.

### **Requisitos**
*Requisitos Funcionales (Core del Juego)*

- **Gestión de Partida:** El sistema debe permitir configurar partidas para 3-5 jugadores, incluyendo un modo de juego en solitario con IA simple o, en su defecto, un modo multijugador local ("hotseat").
- **Automatización de Reglas:** El software debe controlar el flujo de turnos, el reparto de cartas y la validación de acciones según el manual original, impidiendo acciones no permitidas por el reglamento.
- **Interacción con Componentes:** El usuario debe poder manipular los elementos del juego (tokens, cartas) mediante una interfaz que responda en tiempo real.
- **Condiciones de Victoria:** El sistema debe monitorizar los estados del juego y declarar automáticamente el ganador o el fin de la partida al cumplirse los requisitos establecidos.

*Requisitos Técnicos y de Calidad*

- **Interfaz de Usuario (UI):** El diseño debe ser responsivo y optimizado para resoluciones web estándar, manteniendo la estética y legibilidad de los assets gráficos originales.
- **Despliegue y Disponibilidad:** La aplicación debe ser accesible vía navegador web sin requerir configuraciones de entorno complejas por parte del usuario final.
- **Mantenibilidad:** El código debe estar estructurado modularmente siguiendo el modelo de dominio para facilitar futuras actualizaciones de reglas o componentes.


### **Restricciones**
- El proyecto debe ser realizado íntegramente por un único desarrollador.
- La fecha límite de entrega es inamovible, sujeta al calendario académico de la universidad.
- El presupuesto para adquisiciones externas (dominio, hosting) no debe exceder los 50€.

### **Supuestos**
- Se asume que el autor del juego original permite el uso de los assets para fines académicos.
- El tutor del proyecto proporcionará las revisiones necesarias en los plazos acordados.
- El hardware y software de desarrollo actuales son suficientes para completar el proyecto sin adquisiciones adicionales de equipo.

### **Enunciado de Alcance Preliminar**
El proyecto incluye el análisis de reglas, la digitalización de assets, la programación de la lógica de juego, el diseño de la interfaz de usuario y el despliegue final. Se considera completado una vez que el juego sea plenamente funcional según el manual original, se haya redactado la memoria técnica del TFG y se haya realizado el despliegue en el entorno de producción. Quedan excluidos del alcance inicial los modos multijugador online masivos o el desarrollo de aplicaciones móviles nativas, salvo que el tiempo de desarrollo permita su inclusión como mejora.

## Riesgos

- **Complejidad técnica:** Riesgo de que alguna mecánica del juego sea más difícil de programar de lo previsto inicialmente.
- **Scope Creep:** Tendencia a añadir funcionalidades adicionales que retrasen la entrega final.
- **Calidad de los assets:** Posibilidad de que las imágenes originales del P&P requieran un procesado gráfico exhaustivo para lucir correctamente en formato digital.
- **Imprevistos en el despliegue:** Riesgo de que a la hora de desplegar el proyecto ocurra algún imprevisto que lo deje inoperable.
- **Autor disconforme:** Existe la posibilidad de que el autor no esté de acuerdo con la digitalización de su juego.
- **Catástrofes globales:** En el improvable caso de que ocurra una catástrofe a escala global (como una pandemia mundial), el desarrollo del proyecto podría verse afectado.

## Entregables del Proyecto

- Aplicación funcional del juego Muses.
- Memoria técnica del TFG documentando la gestión y el desarrollo.
- Lista de Características (Diccionario de la EDT) e historial de cambios.
- Código fuente alojado en repositorio remoto (Github).

## Cronograma de Hitos Resumido

| Hito del Proyecto | Fecha Objetivo (dd/mm/aaaa) |
| :--- | :--- |
| Inicio del Proyecto | 19/01/2026 |
| Modelo de Dominio y Lista de Características completa | 26/01/2026 |
| Prototipo funcional (Mecánicas básicas) | 20/03/2026 |
| Arte y UI final integrados | 17/04/2026 |
| Finalización de Pruebas y Playtesting | 24/04/2026 |
| Despliegue en Dominio y Entrega de Memoria | 20/05/2026 |
| Defensa del TFG | [Por determinar] |

## Presupuesto Resumido

| Componente del Proyecto | Coste Estimado |
| :--- | :--- |
| Recursos de Personal (Desarrollador) | 0€ |
| Adquisición de Dominio y Hosting | 15€ |
| Software y Licencias | 0€ (Versiones estudiante/Open Source) |
| **Total** | **15€** |

## Requisitos de Aprobación del Proyecto

El éxito se alcanzará cuando el juego digitalizado cumpla con todos los requisitos mecánicos y técnicos, y la documentación asociada sea validada por el tutor. La aprobación final del proyecto será otorgada por el Tribunal de Grado tras la defensa pública del trabajo.

## Director del Proyecto

**Pedro Jiménez Guerrero** es el Director del Proyecto y desarrollador principal. Es responsable de gestionar todas las tareas, el cronograma y la comunicación. Tiene autoridad para gestionar el presupuesto asignado y decidir sobre modificaciones en el alcance técnico para asegurar el cumplimiento de la fecha de entrega. Proporcionará actualizaciones periódicas al tutor del proyecto.

## Interesados del Proyecto (Stakeholders)

En esta sección se identifican las partes clave que influyen en el desarrollo y éxito del proyecto, así como sus principales expectativas.

| Interesado | Rol en el Proyecto | Expectativas Clave |
| :--- | :--- | :--- |
| **Desarrollador (Autor)** | Gestor, diseñador y programador. | Finalizar el proyecto en plazo, aplicar las metodologías PMBOK/FDD y obtener el título de Grado. |
| **Tutor Académico** | Supervisor y guía técnico/metodológico. | Cumplimiento del rigor académico, seguimiento de hitos y calidad en la redacción de la memoria. |
| **Tribunal de Evaluación** | Evaluador final del trabajo. | Claridad en la exposición, cumplimiento de requisitos técnicos y coherencia metodológica. |
| **Autor del Juego Original** | Propietario de la Propiedad Intelectual. | Respeto a las mecánicas originales y correcta atribución de autoría en la documentación. |
| **Usuarios / Betatesters** | Jugadores externos para pruebas. | Interfaz intuitiva, ausencia de bugs críticos y una experiencia de juego fiel al original. |

## Matriz de Poder e Interés (Resumen)

Para la gestión de estos interesados, se seguirá la siguiente estrategia:
- **Gestionar de Cerca:** Tutor y Tribunal (Alto poder y alto interés).
- **Mantener Informados:** Usuarios de prueba (Bajo poder y alto interés).
- **Monitorizar / Respetar:** Autor original (Interés en la integridad del juego).