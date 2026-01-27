# Modelo de Dominio

## 1. Descripción del Modelo
Este documento formaliza la estructura lógica del sistema **Muses**. El modelo se divide en dos contextos claramente diferenciados: el **Dominio del Juego** (mecánicas de la partida) y el **Dominio de la Aplicación** (persistencia y usuarios).

### 1.1. Dominio del Juego (Core)
Las entidades de este contexto definen la lógica y mecánica de la partida.

*   **Partida (Match):** La entidad central que orquesta el juego. Es una **entidad persistente**: se crea al inicio, evoluciona durante el juego y su estado final quedará registrado en la base de datos.
*   **Tablero (Board):** Representa el grid de 3x3 y la posición de los astros.
*   **Jugador (Player):** Entidad que representa la participación de un usuario en una partida concreta (no confundir con Usuario).
*   **Elementos de Juego:** Incluye **Musas**, **Cartas** y **Tokens**, encargados de ejecutar las reglas.

### 1.2. Dominio de la Aplicación (Meta)
Estas entidades gestionan la información del sistema y los usuarios a largo plazo.

*   **Usuario (User):** La cuenta del jugador. Gestiona el acceso y mantiene su identidad.
*   **Estadísticas (Stats):** Registro acumulado del rendimiento del usuario.

## 2. Diagrama de Clases (UML)

```mermaid
classDiagram
    %% Estilos
    classDef core fill:#d1e7ff,stroke:#004a99,stroke-width:2px;
    classDef item fill:#f9f9f9,stroke:#333,stroke-width:1px;

    %%% Dominio del juego
    class TipoAccion {
        <<Enum>>
        DEVOCIÓN_SOL
        DEVOCIÓN_LUNA
        REVOLUCIÓN_SOL
        REVOLUCIÓN_LUNA
    }

    class TipoMusa {
        <<Enum>>
        CLÍO
        EUTERPE
        TALÍA
        MELPÓMENE
        TERPSÍCORE
        ÉRATO
        POLIMNIA
        URANIA
        CALÍOPE
    }

    %% Clases Principales
    class Partida:::core {
        +String id
        +int rondaActual
        +int maxRondas = 9
        +int duracionTotal
        +iniciar()
        +siguienteRonda()
        +finalizar()
    }

    class Tablero:::core {
        +Posicion solPos
        +Posicion lunaPos
        +List~Musa~ grid
        +moverAstros()
        +revoluciónSolar()
        +revoluciónLunar()
    }

    class Jugador:::core {
        +String id
        +String nombre
        +int númeroJugador
        +int puntuacionTotal
        +List~Token~ reservaTokens
        +jugarCarta(carta: Carta)
    }

    class Musa:::item {
        +TipoMusa nombre
        +Map~Nivel, Puntos~ nivelesPuntuacion
        +List~Token~ tokensColocados
        +calcularPuntos()
    }

    %% Elementos de Juego
    class Carta {
        <<Abstract>>
        +String id
        +String descripcion
        +ejecutarEfecto()
    }

    class CartaAccion:::item {
        +TipoAccion tipo
        +Prioridad prioridad
        +ejecutarEfecto()
    }

    class CartaInspiracion:::item {
        +TipoMusa musa
        +boolean usada
        +ejecutarEfecto()
    }

    class Token:::item {
    }

    %% Relaciones
    Partida "1" *-- "1" Tablero : contiene
    Partida "1" *-- "3..5" Jugador : participan
    
    Tablero "1" *-- "9" Musa : compone
    Musa "1" o-- "*" Token : contiene

    Jugador "1" o-- "1" CartaInspiracion : posee
    Jugador "1" o-- "4" CartaAccion : mano inicial
    Jugador "1" *-- "*" Token : reserva

    Carta <|-- CartaAccion
    Carta <|-- CartaInspiracion

    %%% Dominio de la aplicación
    
    class Usuario:::meta {
        +String id
        +String username
        +String password
        +Date fechaRegistro
    }
    class Estadisticas:::meta {
        +String id
        +int partidasJugadas
        +int victorias
        +int derrotas
        +int tiempoTotalJuego
        +int cartasUtilizadas
        +int tokensColocados
        +int puntuacionTotal
        +actualizar()
    }

    %% Relaciones
    Usuario "1" *-- "1" Estadisticas : tiene
    Partida "*" --> "1" Usuario : ganador
    
    %% Diferencia entre Usuario (Cuenta) y Jugador (Rol en el juego)
    Usuario "1" ..> "0..1" Jugador : controla
```