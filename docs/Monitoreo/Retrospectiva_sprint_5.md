# Retrospectiva Sprint 5 - Proyecto Muses

## Features Completadas

- Feature#F31: **Calcular** la mejor jugada posible para el bot mediante heurística voraz.
- Feature#F32: **Ejecutar** automáticamente las acciones seleccionadas por el bot en su turno.
- Feature#F33: **Crear** la sala de juego con código alfanumérico único y configuración de jugadores.
- Feature#F34: **Unirse** a la sala de juego mediante código y gestionar el inicio de la partida.
- Feature#F35: **Gestionar** la desconexión de jugadores con reemplazo automático por bot.

## Resumen Técnico

Este sprint ha incorporado la inteligencia artificial local y la gestión de partidas multijugador.

- **Heurística Voraz (F31 y F32):** El `BotServiceImpl` evalúa todas las cartas candidatas asignando una utilidad numérica a cada una. Para cartas de devoción, la utilidad combina el valor base de nivel 1 de la Musa apuntada por el astro y la ganancia marginal de puntos simulada con `PuntuacionService`. Para la carta de inspiración, activa la utilidad solo si el tipo geométrico coincide con la paridad de la posición del Sol. El desempate entre cartas de igual utilidad se resuelve por la prioridad oficial del enum `TipoAccion`, garantizando decisiones deterministas.
- **Tolerancia a Nulos (F31):** Los tests de estrés del equipo de revisión detectaron un caso límite: cartas sintéticas generadas en tests sin `id` persistido. Se corrigió `obtenerCartasCandidatas` para que el fallback a cartas sintéticas no intente persistirlas en repositorio, cumpliendo el principio CQS.
- **Gestión de Salas (F33 y F34):** La entidad `Sala` sigue el mismo patrón que `Partida`: extiende `BaseEntity`, usa JPA y Lombok. El código de sala es un string alfanumérico de 4 caracteres con prefijo `MUS-`, generado con `SecureRandom` y verificado como único en la base de datos. El `SalaService` gestiona el ciclo de vida completo: `ESPERANDO → EN_CURSO → FINALIZADA`.
- **Desconexiones (F35):** Al marcar un jugador como desconectado, `SalaService` comprueba si la partida está activa y si el jugador no ha seleccionado carta en la ronda actual. En ese caso, invoca `BotService.ejecutarTurnoBot` inmediatamente para no bloquear la mesa. La reconexión restaura el campo `conectado=true` sin interrumpir la partida.
- **Notificaciones STOMP:** Cada cambio de estado de la sala (nuevo jugador, inicio de partida, desconexión) se publica en el tópico `/topic/sala/{codigo}` para sincronizar la interfaz de todos los clientes conectados.

## Problemas encontrados

1. El constructor de `ResourceNotFoundException` solo acepta dos argumentos (`String, Long`), mientras que el código inicial del `SalaService` lo llamaba con tres. Se corrigió el uso del constructor adaptando los mensajes de error.
2. Los tests de estrés del bot revelaron que las cartas sintéticas (creadas sin persistir) no tienen `id` asignado, lo que provocaba un error al invocar `seleccionarCarta` en `PartidaService`. Se añadió una comprobación previa en `ejecutarTurnoBot`.
3. La cuota de tokens de Gemini Flash se agotó mientras el equipo de agentes ejecutaba la ronda de corrección del Hito 1 (bot). El trabajo se completó de forma directa sin sub-agentes.
4. La notificación STOMP en `SalaService` se inyecta con `@Autowired(required = false)` para que los tests unitarios no fallen al no disponer de un contexto Spring completo.

## Uso de IA

1. Se utilizó **Claude Sonnet 4.6** para diseñar la heurística voraz del `BotServiceImpl`, el método `evaluarUtilidadCarta` y la estrategia de activación de la inspiración según la alineación geométrica de los astros.
2. Se utilizó **Claude Sonnet 4.6** para implementar el `SalaService` completo con generación de códigos únicos, validaciones de capacidad y la lógica de desconexión con delegación al bot.
3. Se usó **Antigravity** para generar los tests unitarios de `SalaServiceTest` y los devlogs del sprint.
