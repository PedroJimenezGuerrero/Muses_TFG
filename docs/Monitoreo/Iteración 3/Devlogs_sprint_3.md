# Devlogs Sprint 3

## Devlog 1: 01/06/2026

- Se ha iniciado la planificación y análisis de requisitos para la tercera iteración, centrada en el flujo de inicialización de partida, gestión de rondas y el sistema completo de puntuación y fin de juego.
- Se ha identificado una limitación estructural crítica en el modelo de dominio: la entidad `Token` no guardaba referencia al `Jugador` propietario cuando se colocaba sobre una musa en el tablero (`Musa.tokensColocados`). Sin esta relación, resultaba imposible discernir a qué jugador pertenecían los devotos durante el recuento final de fichas.
- Se ha refactorizado la entidad `Token` incorporando la relación `@ManyToOne Jugador jugador` con `@JsonIgnoreProperties` para evitar bucles de serialización cíclica.
- Se ha modificado la entidad `Partida` cambiando el atributo `Usuario ganador` por `@ManyToMany List<Usuario> ganadores`, ya que las reglas oficiales contemplan empates en la primera posición con victoria compartida.
- Para mantener la cohesión y respetar el principio de responsabilidad única (SRP), se ha decidido aislar todo el cálculo de puntuación, empates y estadísticas en un nuevo servicio independiente: `PuntuacionService`.
- Consulta a IA (Claude Sonnet 4.6):

  > ¿Cómo estructurar en Spring Boot el servicio de puntuación de un juego de mesa para separar el cálculo algorítmico puro de la persistencia de la partida?
  >
  > Queremos que PartidaService se encargue únicamente del ciclo de vida y orquestación, y delegue el cálculo numérico y resolución de empates en un PuntuacionService dedicado.

## Devlog 2: 04/06/2026

- Implementación del flujo de inicialización del tablero y la partida (Features F09, F10, F11 y F12).
- Se ha añadido el endpoint `POST /partida/{id}/iniciar` en `PartidaController`, delegando en `PartidaService.iniciarPartida`.
- En `TableroService`, se ha implementado el método de generación del tablero con 9 casillas (`Tablero.grid`), instanciando una entidad `Musa` por cada valor de `TipoMusa` y aplicando una permutación aleatoria (`Collections.shuffle`) para garantizar tableros únicos en cada sesión (F09).
- Se han establecido las posiciones orbitales fijas de inicio para los astros: `solPos = 0` y `lunaPos = 4` sobre el perímetro de 8 posiciones (F12).
- En `PartidaService`, se asocian las cartas de acción comunes a la partida (F10) y se distribuye una carta de inspiración aleatoria y exclusiva a cada jugador, asegurando que ningún `TipoMusa` se repita entre los participantes y marcando `usada = false` (F11).
- Consulta a IA (Gemini):

  > En Java 21 con Spring Boot, genera un algoritmo limpio para asignar a cada jugador de una partida una carta de inspiración aleatoria garantizando que no existan duplicados de TipoMusa entre jugadores y que el atributo usada se inicialice a false.

## Devlog 3: 08/06/2026

- Integración del ciclo de rondas en el flujo de selección de cartas (Features F13 y F14).
- Se ha refactorizado `gestionarSeleccionCartas` en `PartidaService` para invocar al método interno `finalizarRonda(Partida)` tras ejecutar todas las acciones elegidas por los jugadores.
- El método `finalizarRonda` se encarga de incrementar en 1 el contador `rondaActual` y limpiar el mapa `seleccionesRonda` para dejar la mesa lista para el siguiente turno (F13).
- Se ha introducido la condición de parada: cuando `rondaActual == maxRondas` (novena ronda), se activa automáticamente la llamada a `finalizarPartida(Partida)` (F14).
- Se ha conectado `finalizarPartida` con `PuntuacionService.procesarFinPartida(Partida)` para desencadenar el cómputo final de puntuaciones y la actualización de estadísticas.
- Consulta a IA (Claude Sonnet 4.6):

  > ¿Cuál es la mejor estrategia para asegurar la consistencia transaccional en Spring Data JPA al finalizar una ronda, limpiar el mapa de selecciones y disparar opcionalmente el cierre de partida con actualización de estadísticas en cascada?

## Devlog 4: 12/06/2026

- Creación e implementación inicial de `PuntuacionService` para la contabilización de devotos y puntuación básica por musa (Features F15 y F16).
- Se ha implementado el método `contarTokensPorJugador(Musa musa)`, que itera sobre la colección `tokensColocados` de la casilla y agrupa las cantidades utilizando un mapa de frecuencias indexado por `Jugador`.
- Se ha codificado el cálculo de puntuación base consultando la tabla de valores de `TipoMusa.getPuntos(nivel)` para las tres primeras posiciones de devoción (1º puesto nivel 1, 2º puesto nivel 2, 3º puesto nivel 3).
- Se ha establecido la regla de exclusión estricta: los jugadores que no hayan colocado ningún token sobre una musa concreta obtienen 0 puntos por ella y no ocupan plaza en la clasificación de dicha casilla.
- Consulta a IA (Gemini):

  > Escribe una función en Java que reciba la lista de tokens colocados en una musa y devuelva los jugadores clasificados de mayor a menor número de tokens, descartando automáticamente a aquellos que tengan 0 tokens.

## Devlog 5: 16/06/2026

- Implementación del algoritmo complejo de resolución de empates escalonados en `PuntuacionService` (Feature F17).
- Se han cubierto todas las ramificaciones del reglamento original con división entera hacia abajo (`floor`):
  - Empate de 2 jugadores en 1º puesto: se suman nivel 1 y nivel 2 y se reparte $\lfloor (\text{nivel}_1 + \text{nivel}_2) / 2 \rfloor$ a cada uno. El tercer clasificado en devoción recibe íntegramente los puntos de $\text{nivel}_3$.
  - Empate de 3 o más jugadores en 1º puesto ($n \ge 3$): se suman los tres niveles y se reparte $\lfloor (\text{nivel}_1 + \text{nivel}_2 + \text{nivel}_3) / n \rfloor$. Los puestos 2º y 3º quedan vacantes.
  - Empate de 2 jugadores en 2º puesto (con un único 1º): el 1º recibe $\text{nivel}_1$. Los dos empatados reciben $\lfloor (\text{nivel}_2 + \text{nivel}_3) / 2 \rfloor$. El 3º puesto queda desierto.
  - Empate de 3 o más jugadores en 2º puesto ($n \ge 3$): el 1º recibe $\text{nivel}_1$. Los empatados se reparten $\lfloor (\text{nivel}_2 + \text{nivel}_3) / n \rfloor$.
  - Empate en 3º puesto ($n \ge 2$): cada uno recibe $\lfloor \text{nivel}_3 / n \rfloor$.
- Se ha verificado que la división entera en Java truncará correctamente hacia abajo sin generar residuos flotantes ni excepciones de división por cero.
- Consulta a IA (Claude Sonnet 4.6):

  > Revisa este algoritmo de desempate para un juego de mesa en Java y detecta posibles esquinas no contempladas (edge cases):
  > - ¿Qué ocurre si empatan 4 jugadores en primer puesto y la suma de puntos es menor que 4?
  > - ¿Qué ocurre si 2 jugadores empatan en 1er puesto pero no hay ningún tercer jugador con fichas?
  > - ¿Cómo asegurar que los jugadores con 0 tokens nunca reciban puntos por reparto residual?

## Devlog 6: 19/06/2026

- Implementación de la agregación final de puntuaciones, determinación de vencedores y actualización de estadísticas históricas (Features F18 y F19).
- En `PuntuacionService.calcularPuntuacionFinal`, se totalizan los puntos obtenidos por cada jugador a lo largo de las 9 casillas del tablero y se asigna el resultado al atributo `puntuacionTotal` de cada entidad `Jugador` (F18).
- En `determinarGanadores`, se busca el valor máximo de `puntuacionTotal` y se recopilan todos los jugadores que ostentan dicha puntuación máxima, asociando sus usuarios a `Partida.ganadores` para soportar victorias compartidas (F19).
- En `actualizarEstadisticas`, se actualizan los registros de `Estadisticas` asociados a cada usuario participante:
  - Se incrementa en 1 el contador `partidasJugadas`.
  - Se incrementa `victorias` si el usuario está en la lista de ganadores, o `derrotas` en caso contrario.
  - Se acumula `puntuacionTotal` con los puntos obtenidos en esta partida.
  - Se suma el total de fichas colocadas en `tokensColocados`.
  - Se acumula la duración de la partida en `tiempoTotalJuego`.
- Consulta a IA (Gemini):

  > En Spring Data JPA, crea un método que actualice las estadísticas de una lista de usuarios tras finalizar una partida, diferenciando victorias y derrotas según pertenezcan o no a la lista de ganadores, y persistiendo los cambios de forma segura.

## Devlog 7: 23/06/2026

- Construcción de la suite de pruebas unitarias y de integración siguiendo la metodología TDD para validar todas las features desarrolladas (F09 a F19).
- Se han diseñado tests exhaustivos en `PuntuacionServiceTests` cubriendo toda la combinatoria de empates:
  - Escenario regular sin empates (1º, 2º y 3º puesto con puntos íntegros).
  - Empate de 2 jugadores en 1º puesto con 3º puesto premiado.
  - Empate triple y cuádruple en 1º puesto con descarte de niveles inferiores.
  - Empate binario y múltiple en 2º puesto.
  - Empate múltiple en 3º puesto.
  - Caso con jugadores sin tokens colocados (garantizando 0 puntos).
  - Escenario de partida con múltiples ganadores simultáneos en `Partida.ganadores`.
- Se han validado las pruebas de inicialización en `TableroServiceTests` (aleatoriedad del grid y posiciones de Sol=0, Luna=4) y de flujo de rondas en `PartidaServiceTests` (avance de ronda y finalización en turno 9).
- Batería completa de 221 tests ejecutada con éxito mediante `./gradlew test`.
- Consulta a IA (Claude Sonnet 4.6):

  > Genera una batería de pruebas unitarias con JUnit 5 y Mockito para PuntuacionService que simule un tablero completo con 9 musas y valide detalladamente que los redondeos floor se aplican con precisión matemática en cada casuística de empate.
