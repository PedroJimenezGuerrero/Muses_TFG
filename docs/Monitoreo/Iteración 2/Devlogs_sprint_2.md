# Devlogs Sprint 2

## Devlog 1: 18/02/2026

- La feature06 se diseñará con un patrón estrategia, teniendo un método de alto nivel `ejecutarEfecto`, que según el tipo de carta que sea realizará una acción u otra. 
- Se ha usado Antigravity (Gemini) como ejemplo para probar el patrón estrategia con el siguiente prompt:

 > usa el patrón strategy para que el método ejecutarEfecto use la acción según el tipo de carta


## Devlog 2: 19/02/2026

- Para poder colocar tokens en las musas es necesario un método en MusaService que llame a TokenService para obtener un token del jugador y lo coloque en la musa. Para esto se ha rediseñado ligeramente el modelo de dominio, se ha añadido un atributo llamado colocado en la entidad Token y se ha renombrado "reservaTokens" por "tokens". 

## Devlog 3: 23/02/2026

- Para poder aplicar los efectos de colocar los tokens es necesario saber quién hace cada acción, por lo que es necesario refactorizar los métodos de TableroService para que reciban el jugador que realiza la acción. Esto implica también cambiar TableroController, y cambiar la ruta de los endpoints de revolución solar y revolución lunar para que reciban el id del jugador. A partir de ese jugador, se puede sacar en qué partida está y aplicar la acción al tablero correspondiente.

## Devlog 4: 24/02/2026

- Se han expandido los tests de las entidades Tablero y Carta con pruebas unitarias exhaustivas para el servicio y controlador. Para ello se ha usado Claude Sonnet 4.6 con el siguiente prompt:

    > genera tests unitarios y de integración para los controladores, servicios y repositorios de las entidades Tablero y Carta, teniendo en cuenta edge cases, manejo de errores y no siguiendo únicamente el happy path
    >
    > TableroServiceTests.java#L443-452 este test no lo entiendo. por qué debería el switch lanzar la excepción, si el talbero tiene las posiciones de los astros?
    >
    > perfecto, gracias. revisa todos los tests para que no pase lo mismo en otras partes del código
    
    Generó gran cantidad de tests correctos salvo uno que no tenía sentido, se le pidió que lo arreglase y comprobase que no había pasado lo mismo en otros lugares.

- Las cartas de inspiración sólo pueden aplicar su efecto si los tokens de sol y luna están en la posición correcta. Para ello se ha refactorizado el enum TipoMusa, añadiendo un nuevo atributo de tipo TipoInspiración que puede tomar los valores `VERTICES` o `LADOS`, según si la inspiración de esa musa requiere que los astros estén en las esquinas o en los lados. 
- Se ha añadido un método en InspiracionEffectStrategy que comprueba la posición de los astros y la compara con el tipo de inspiración de la carta. 
- Para elegir qué método usar según la carta de inspiración, se ha usado otro patrón strategy, teniendo un método de alto nivel `ejecutarEfecto`, que según el tipo de musa que sea realizará una acción u otra.

