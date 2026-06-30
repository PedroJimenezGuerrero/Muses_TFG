# Retrospectiva Sprint 2 - Proyecto Muses

## Features Completadas

- Feature#04: **Seleccionar** la carta de acción desde la mano del jugador.
- Feature#05: **Resolver** los conflictos de prioridad en las cartas jugadas.
- Feature#06: **Ejecutar** la acción de la carta jugada.
- Feature#07: **Validar** la disponibilidad de la carta de Inspiración.

## Resumen Técnico

Este sprint se ha centrado en la lógica de las cartas y la gestión de la concurrencia. Los hitos técnicos más relevantes han sido:

- **Patrón Estrategia Anidado (F06):** Para gestionar la diversidad de efectos de las cartas, se ha implementado un sistema de estrategias de dos niveles. El primer nivel decide si la carta es de acción o inspiración. En el caso de inspiración, se delega en un segundo nivel con estrategias específicas para cada una de las nueve musas (`InspiracionCaliopeStrategy`, etc.), lo que permite añadir nuevas mecánicas sin modificar el código existente.
- **Bloqueo Optimista (F04):** La selección de cartas se centraliza en el diccionario `seleccionesRonda` de la entidad `Partida`. Para evitar conflictos cuando varios jugadores eligen carta simultáneamente, se ha implementado un mecanismo de bloqueo optimista mediante el atributo `version`.
- **Refactorización de Prioridades (F05):** Se ha centralizado la lógica de prioridad en el enum `TipoAccion` (valores del 2 al 5 para acciones y 1 para inspiración), eliminando el atributo redundante en `CartaAccion`.
- **Optimización del Modelo:** Se ha simplificado la entidad `Jugador` eliminando el atributo `mano` y centralizando el control de cartas de acción compartidas en la lógica de la partida. Además, se ha rediseñado la entidad `Token` con el atributo `colocado` para permitir su persistencia en el tablero.
- **Validación de Estado (F07):** Implementación de un control estricto mediante el atributo `usada` en `CartaInspiracion` para asegurar que cada carta de un solo uso no se active más de una vez.

## Problemas encontrados

1. La creación del Dev-Container no funciona en el IDE usado, **Antigravity**. Sí que funciona en VS Code, pero tiene funcionalidades limitadas de IA.
2. No se apuntó la F01 como issue de Github, por lo que se implementó más tarde.
3. Se empezó varios días más tarde por gestionar las solicitudes para las prácticas curriculares.
4. Aunque las features se han implementado rápido, la documentación y el registro en la memoria está tomando mucho más tiempo del pensado.

## Uso de IA

1. El enum `TipoMusa` fue creado pidiendo a Gemini que leyera las reglas (pdf presente en las carpetas del proyecto) y que guardara la información en el propio enum.
2. F01 fue creada con los siguientes prompts en Gemini:
   - "crea las funciones en el service y controlador que hagan falta para implementar la feature 9: identificar musas en posición de sol y luna. debe devolver las dos musas, preferentemente en un array o un map"
   - "quiero que el método y la ruta se llamen getMusasEnAstros, y que generes un test unitario para el método del service. por lo demás procede"
   - Sólo hubo que ajustar el nombre del método y arreglar imports.
3. Las funciones CRUD (en servicios, controladores y repositorios) fueron creadas con Copilot:
   - "crea métodos en los servicios de todas las entidades para que ofrezcan los servicios CRUD. Crea los archivos de los servicios para las entidades que no lo tengan y completa los que le falten algunos ( como el de tablero, que le falta update y delete)"
   - "necesito que las entidades propias de una partida (tablero, jugador, carta, token, musa) cambien su método crud "deleteAll" por "deleteAllByPartida". es decir, que pasándole la id de la partida borre todas las entidades que pertenezcan a dicha partida. Para ello habrá que acceder Partida, mi duda es: es mejor acceder directamente al repositorio de partida y hacer el cálculo en el método? O acceder a un método específico de PartidaService que calcule las entidades de esa partida? En cualquier caso, haz lo último: un método "get{Entity}ByPartida(Long id)" por cada entidad de las que te he dicho en el PartidaService"
   - La IA no resolvió la duda, pero hizo bien los métodos.
4. Se pidió asistencia a Gemini para implementar la función `rotacionGeneral (List<Musa> grid, int[] indices)`. Se obtuvo un resultado satisfactorio y simple.
