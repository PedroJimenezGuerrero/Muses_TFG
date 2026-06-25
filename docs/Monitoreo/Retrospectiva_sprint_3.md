# Retrospectiva Sprint 3 - Proyecto Muses

## Features Completadas

- Feature#09: **Generar** la disposición inicial de las 9 Musas en el tablero.
- Feature#10: **Repartir** las cartas de acción iniciales a los jugadores.
- Feature#11: **Asignar** una carta de Inspiración a cada jugador.
- Feature#12: **Establecer** la posición inicial de los tokens de Sol y Luna.
- Feature#13: **Incrementar** el contador de ronda al finalizar el turno.
- Feature#14: **Finalizar** la sesión de juego al completar la novena ronda.
- Feature#15: **Contabilizar** los tokens de devoción por jugador en cada Musa.
- Feature#16: **Calcular** los puntos obtenidos por cada Musa.
- Feature#17: **Resolver** los empates de puntuación.
- Feature#18: **Calcular** la puntuación final de cada jugador.
- Feature#19: **Determinar** el ganador de la partida.

## Resumen Técnico

Este tercer sprint ha cerrado el ciclo fundamental de juego en la capa de backend, abarcando desde la inicialización completa de la partida hasta el cálculo final de puntuaciones y la actualización persistente de estadísticas. Los hitos técnicos principales han sido:

- **Desacoplamiento y Nuevo Servicio de Puntuación (`PuntuacionService`):** Se ha extraído toda la lógica de puntuación, cálculo de devoción y desempates a un nuevo servicio especializado (`PuntuacionService`). Con ello se mantiene alta cohesión y bajo acoplamiento, evitando sobrecargar `PartidaService` y cumpliendo estrictamente con el Principio de Responsabilidad Única (SRP).
- **Refactorización del Modelo de Dominio:**
  - Se ha añadido la relación `@ManyToOne Jugador jugador` a la entidad `Token`. Inicialmente, las fichas colocadas sobre el tablero no identificaban a su propietario, impidiendo computar cuántos devotos tenía cada jugador sobre una musa.
  - Se ha transformado el atributo `ganador` de `Partida` (anteriormente `@ManyToOne Usuario`) en `@ManyToMany List<Usuario> ganadores`, permitiendo modelar empates de partida con múltiples ganadores de manera nativa.
- **Motor de Resolución de Empates Escalonados (F17):** Se han implementado con exactitud matemática las complejas reglas de desempate del reglamento oficial (`Reglas.pdf`), cubriendo empates dobles y triples en primer puesto, empates en segundo puesto y empates en tercer puesto mediante divisiones enteras redondeadas hacia abajo (`floor`), excluyendo estrictamente del reparto a jugadores con 0 tokens.
- **Ciclo de Rondas y Cierre de Sesión (F13, F14):** Se ha integrado el avance automático de turno (`finalizarRonda`) al completar la fase de selección y ejecución de cartas (`gestionarSeleccionCartas`), disparando la finalización y evaluación de la partida al alcanzar la ronda 9.
- **Persistencia de Estadísticas:** Se ha completado la actualización acumulativa de la entidad `Estadisticas` de cada participante, incrementando partidas jugadas, victorias o derrotas, puntuación global, devotos colocados y tiempo total de juego.

## Problemas encontrados

1. **Ajuste de relaciones de entidad en cascada:** La transición de un único ganador a una lista de ganadores múltiples (`ganadores`) requirió refactorizar controladores, repositorios y tests previos que asumían un único ganador opcional, obligando a revisar varias clases para mantener la retrocompatibilidad.
2. **Casos borde en el cálculo de empates:** El manejo de jugadores sin tokens en casillas disputadas requirió comprobaciones adicionales previas a la aplicación de las fórmulas de división entera para evitar otorgar puntos indebidos o producir divisiones por cero cuando el número de clasificados con fichas era menor al número de plazas premiadas.
3. **Gestión de dependencias entre servicios:** Se debió cuidar especialmente la interacción entre `PartidaService` y `TableroService` / `PuntuacionService` para evitar dependencias circulares durante la inicialización y el cierre de partida, desacoplando `TableroService` a través de consultas directas al repositorio.
4. **Carga de trabajo en la documentación:** La formalización en LaTeX del pseudocódigo conceptual detallado para la feature F17, junto con el análisis de la desviación temporal, requirió más tiempo del previsto originalmente, consolidando la necesidad de redactar la memoria de forma continua durante el sprint.

## Uso de IA

1. Se utilizó **Claude Sonnet 4.6** para contrastar las reglas matemáticas de reparto de puntos en empates triples y diseñar los casos de prueba unitarios parametrizados correspondientes en `PuntuacionServiceTests`.
2. Se empleó **Gemini** para estructurar la separación de responsabilidades entre `PartidaService` y `PuntuacionService`, así como para redactar el algoritmo inicial de agrupación de tokens por jugador.
3. Se recurrió a asistencia de IA para la revisión de consistencia de la memoria en LaTeX, comprobando que se cumpliera la voz de pasiva refleja y las restricciones de estilo académico impuestas por la normativa del proyecto.
