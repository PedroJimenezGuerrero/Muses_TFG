# Devlogs Sprint 5

## Devlog 1: 09/06/2026

- Se ha comenzado el diseño de la Iteración 5: Bot IA (F31, F32), salas de juego multijugador (F33, F34) y gestión de desconexiones con sustitución por bot (F35).
- Se ha decidido implementar el algoritmo del bot como una heurística voraz: evalúa el valor esperado de colocar fichas en Sol o Luna, prioriza musas de nivel 1 con mayor puntuación base y activa la carta de inspiración solo si la alineación de los astros coincide con el tipo geométrico requerido.
- Se ha creado el paquete `tfg.muses.bot` con la interfaz `BotService` y su implementación `BotServiceImpl`.

## Devlog 2: 10/06/2026

- Se ha implementado el método `calcularMejorJugada(Partida, Jugador)` en `BotServiceImpl`. El método ordena las cartas candidatas por utilidad calculada y desempata por prioridad oficial del enum `TipoAccion`.
- Se ha añadido tolerancia a nulos para cartas sin `id` persistido (cartas sintéticas generadas en tests de estrés).
- Se ha usado Antigravity para generar el borrador inicial de la heurística:

  > implementa en BotServiceImpl el método calcularMejorJugada que evalúa la utilidad de cada carta usando una heurística voraz: prioriza musas con mayor puntuación en nivel 1 donde el bot pueda obtener mayoría de tokens, y usa inspiración si el tipo geométrico coincide con la posición del sol

## Devlog 3: 11/06/2026

- Se ha implementado `ejecutarTurnoBot(Partida, Jugador)` con idempotencia: el bot no vuelve a seleccionar carta si ya lo hizo en la ronda actual.
- Se ha añadido la simulación marginal de puntos usando `PuntuacionService.calcularPuntosMusa` para comparar el estado de la musa antes y después de añadir las fichas del bot.
- Se han escrito los tests unitarios `BotServiceTest` (13 pruebas) y `BotServiceStressTest` (casos adversariales con tokens agotados y empates).

## Devlog 4: 12/06/2026

- Se ha revisado la estrategia de inspiración: se activa solo si `sol % 2 == 0` para `VERTICES` o `sol % 2 != 0` para `LADOS`, replicando la misma lógica que usa el frontend en `getCellHighlightInfo`.
- El auditor del equipo de revisión detectó el caso de cartas candidatas con `id` nulo en pruebas de estrés. Se corrigió el método `obtenerCartasCandidatas` para que el fallback sintético no persista en repositorio.
- BUILD SUCCESSFUL con 237 tests en verde tras la ronda de corrección.

## Devlog 5: 16/06/2026

- Se ha diseñado la entidad `Sala` para la gestión de salas multijugador. Campos: `codigo` (alfanumérico único, prefijo `MUS-`), `estado` (enum `EstadoSala`), `anfitrion`, `jugadores`, `maxJugadores` (2-5) y referencia a `Partida`.
- Se ha creado `SalaService` con los métodos `crearSala`, `unirseASala`, `iniciarPartida`, `marcarDesconectado` y `marcarConectado`.
- Se ha creado `SalaController` con los endpoints REST: `POST /api/v1/salas/crear`, `POST /api/v1/salas/{codigo}/unirse`, `POST /api/v1/salas/{codigo}/iniciar`, y los endpoints de desconexión y reconexión.

## Devlog 6: 17/06/2026

- Se ha implementado la gestión de desconexiones en `SalaService.marcarDesconectado`: marca el jugador como `conectado=false` y, si la partida está `EN_CURSO` y el jugador no había seleccionado carta en la ronda actual, invoca `BotService.ejecutarTurnoBot` para que la partida no se bloquee.
- Se ha implementado la reconexión en `marcarConectado`: restaura `conectado=true` y permite al jugador recuperar el control en las siguientes rondas.
- Se ha añadido la notificación por STOMP a `/topic/sala/{codigo}` en cada cambio de estado de la sala para sincronizar el lobby en tiempo real.

## Devlog 7: 18/06/2026

- Se han escrito los tests unitarios `SalaServiceTest` con 15 pruebas cubriendo creación de sala, validación de capacidad máxima, unión de jugadores, inicio de partida, desconexión con bot y reconexión.
- Se ha verificado que `./gradlew test` pasa con todos los tests en verde.
- Se ha usado Antigravity para generar el componente de Lobby en el frontend y los devlogs del sprint:

  > crea el componente LobbyView en Next.js que permite crear una sala, introducir un código para unirse y ver la lista de jugadores conectados en la sala de espera

## Devlog 8: 19/06/2026

- Se ha creado el componente `LobbyView` en el frontend con dos modos: crear sala (elige número de jugadores) y unirse a sala existente (introduce código alfanumérico `MUS-XXXX`).
- El componente se conecta al endpoint REST del backend y suscribe al tópico STOMP de la sala para actualizar la lista de jugadores en tiempo real.
- Se han verificado los 110 tests de Vitest: todos siguen pasando con el nuevo componente añadido.

## Devlog 9: 20/06/2026

- Se ha mejorado la heurística voraz del bot tanto en el backend (`BotServiceImpl`) como en el frontend (`GameStore`):
  - Se ha implementado la simulación marginal de puntos (`calcularDeltaPuntos` / `computeDeltaPoints`) para las acciones de Revolución sobre la musa central (`grid[4]`), valorando tácticamente si colocar una ficha en el centro permite al bot ganar la musa en solitario o romper empates.
  - Se ha incorporado un sistema estocástico de toma de decisiones mediante una ruleta de probabilidades ponderadas (30% primera opción más óptima, 50% segunda mejor opción, 20% tercera opción alternativa/riesgo), evitando que los bots exhiban decisiones predecibles o idénticas en partidas sucesivas.
- Se ha verificado la suite completa de pruebas: 290 tests de Spring Boot y 113 tests de Vitest ejecutándose con éxito.

