# Devlogs Sprint 2

## Devlog 1: 18/02/2026

- La feature06 se diseñará con un patrón estrategia, teniendo un método de alto nivel `ejecutarEfecto`, que según el tipo de carta que sea realizará una acción u otra. 
- Se ha usado Antigravity (Gemini) como ejemplo para probar el patrón estrategia con el siguiente prompt:

 > usa el patrón strategy para que el método ejecutarEfecto use la acción según el tipo de carta


## Devlog 2: 19/02/2026

- Para poder colocar tokens en las musas es necesario un método en MusaService que llame a TokenService para obtener un token del jugador y lo coloque en la musa. Para esto se ha rediseñado ligeramente el modelo de dominio, se ha añadido un atributo llamado colocado en la entidad Token y se ha renombrado "reservaTokens" por "tokens". 