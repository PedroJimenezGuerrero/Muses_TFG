# Retrospectiva Sprint 1

## Features completadas

1. **Identificar** Musas en posición de Sol y Luna.
2. **Mover** un espacio en sentido horario el token de Sol y de Luna.
3. **Rotar** en Revolución las Musas del tablero.

También se han creado las clases `Controller`, `Service` y `Repository` para el resto de entidades, creado la base de datos y conectado backend con frontend; de forma que la arquitectura MVC queda establecida.

## Problemas encontrados

1. La creación del Dev-Container no funciona en el IDE usado, **Antigravity**. Sí que funciona en VS Code, pero tiene funcionalidades limitadas de IA.
1. No se apuntó la Feature#01 como issue de Github, por lo que se implementó más tarde.
1. Se empezó varios días más tarde por gestionar las solicitudes para las prácticas curriculares.
1. Aunque las features se han implementado rápido, la documentación y el registro en la memoria está tomando mucho más tiempo del pensado.

## Decisiones de diseño

1. La clase `Musa` ya no guarda la información concreta de cada musa, si no que esa información estática está integrada en el enumerado `TipoMusa`. 
    - Se ha hecho de esta forma para que la información que no cambia (puntos que da cada musa) se mantenga estática en todo momento, y las entidades Musa sólo tengan la información que cambia (los tokens de puntucación que tienen encima). Ver Devlog#03
1. El método `getMusasEnAstros(Tablero tablero)` devuelve un un diccionario con las claves "sol" y "luna", con sus respectivas musas como valor.
    - Si se necesitan ambos valores, no hay que hacer dos llamadas distintas para averiguarlo.


## Lo que funciona

1. **Test Driven Development**: se han creado tests fallidos iniciales para cada feature, explicando los casos de uso y los resultados esperados para los que fueran complicados. Esto ha hecho que ya se cuente con una base de testing sobre el que probar la aplicación. 

## Lo que no funciona

1. **Cálculo de tiempos**: Por un lado se ha calculado mal el tiempo que llevaría hace las tareas (aún empezando más tarde, se acabó antes de tiempo), y por otro lo que ha llevado hacer la memoria del sprint 1 ha tomado demasiado tiempo.
2. **Features faltantes**: No se crearon issues para todas las features de este sprint en un principio (faltaba la Feature#01), por lo que en el talbón del proyecto en Github no aparecía. Esta característica se completó fuera de plazo.

## Acciones correctivas

1. Cuando sea necesario el uso de la IA, iniciar el Dev-Container con VS Code y acceder a él en Antigravity.
2. Escribir todas las issues según aparecen en el diccionario de la EDT al inicio del sprint.
1. Empezar el día que toca, aunque sea con poca carga de trabajo
1. Ir escribiendo la memoria conforme se va desarrollando.


# Uso de la IA

- El enum `TipoMusa` fue creado pidiendo a Gemini que leyera las reglas (pdf presente en las carpetas del proyecto) y que guardara la información en el propio enum.
- La Feature#01 fue creada con los siguientes prompts en Gemini:
    > crea las funciones en el service y controlador que hagan falta para implementar la feature 9: identificar musas en posición de sol y luna. debe devolver las dos musas, preferentemente en un array o un map

    > quiero que el método y la ruta se llamen getMusasEnAstros, y que generes un test unitario para el método del service. por lo demás procede

    - Sólo hubo que ajustar el nombre del método y arreglar imports.
- Las funciones CRUD (en servicios, controladores y repositorios) fueron creadas con Copilot:
    > crea métodos en los servicios de todas las entidades para que ofrezcan los servicios CRUD. Crea los archivos de los servicios para las entidades que no lo tengan y completa los que le falten algunos ( como el de tablero, que le falta update y delete)

    > necesito que las entidades propias de una partida (tablero, jugador, carta, token, musa) cambien su método crud "deleteAll" por "deleteAllByPartida". es decir, que pasándole la id de la partida borre todas las entidades que pertenezcan a dicha partida. 
    > 
    > Para ello habrá que acceder Partida, mi duda es: es mejor acceder directamente al repositorio de partida y hacer el cálculo en el método? O acceder a un método específico de PartidaService que calcule las entidades de esa partida? En cualquier caso, haz lo último: un método "get{Entity}ByPartida(Long id)" por cada entidad de las que te he dicho en el PartidaService
    - La IA no resolvió la duda, pero hizo bien los métodos.

- Se pidió asistencia a Gemini para implementar la función `rotacionGeneral(List<Musa> grid, int[] indices)`. Se obtuvo un resultado satisfactorio y simple.


 
    


---