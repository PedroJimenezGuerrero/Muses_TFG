# Documento de Procesos de Negocio (BPMN) - Muses TFG

Este documento recoge la especificación y modelado de los **Procesos de Negocio** para la digitalización del juego de mesa **Muses**, cubriendo la totalidad de los Casos de Uso del sistema.

Los diagramas están elaborados utilizando la notación **Mermaid (`flowchart TD`)** compatible con BPMN 2.0 (eventos, tareas, decisiones y carriles de roles o *swimlanes*).

---

## 1. Simbología BPMN empleada en Mermaid

| Elemento BPMN | Representación gráfica | Sintaxis Mermaid | Descripción |
| :--- | :--- | :--- | :--- |
| **Evento** | Círculo | `(( Nombre del Evento ))` | Indica inicio, estado intermedio o fin del proceso. |
| **Tarea / Actividad** | Rectángulo | `[ Descripción de la Tarea ]` | Acción o paso ejecutado por un rol o sistema. |
| **Decisión / Compuerta** | Rombo | `{ ¿Condición? }` | Punto de bifurcación de flujo según resultado. |
| **Carril / Rol (Swimlane)** | Subgrafo / Contenedor | `subgraph Rol ["Rol"] ... end` | Define la entidad u actor responsable de la acción. |

---

## 2. Matriz de Casos de Uso vs Roles de Sistema

| Código CU | Nombre del Caso de Uso | Rol Principal | Rol Secundario / Sistema |
| :--- | :--- | :--- | :--- |
| **CU-08** | Registrar e Iniciar Sesión de Usuario | Usuario no Autenticado | Sistema Backend / Base de Datos |
| **CU-20** | Consultar Perfil y Estadísticas | Jugador Autenticado | Sistema Backend |
| **CU-33** | Crear Sala de Juego | Jugador Anfitrión | Sistema Backend |
| **CU-34** | Unirse a la Sala de Juego | Jugador Invitado | Sistema Backend |
| **CU-35** | Gestionar Desconexión de Jugadores | Sistema Backend | Jugadores / Bot Autómata |
| **CU-09** | Generar Disposición Inicial de 9 Musas | Sistema Backend | Tablero de Juego |
| **CU-10** | Repartir Cartas de Acción Iniciales | Sistema Backend | Jugadores en Partida |
| **CU-11** | Asignar Carta de Inspiración | Sistema Backend | Jugadores en Partida |
| **CU-12** | Establecer Posición Inicial de Sol y Luna | Sistema Backend | Tablero de Juego |
| **CU-01** | Identificar Musas en Posición de Sol y Luna | Sistema Backend | Tablero de Juego |
| **CU-02** | Mover Tokens Sol y Luna en Sentido Horario | Sistema Backend | Tablero de Juego |
| **CU-03** | Rotar en Revolución las Musas del Tablero | Sistema Backend | Tablero de Juego |
| **CU-04** | Seleccionar Carta de Acción / Inspiración | Jugador en Partida | Sistema Backend |
| **CU-05** | Resolver Conflictos de Prioridad y Votación | Sistema Backend | Jugadores en Partida |
| **CU-06** | Ejecutar Acción de la Carta Jugada | Sistema Backend | Tablero de Juego / Jugadores |
| **CU-07** | Validar Disponibilidad de Carta de Inspiración | Sistema Backend | Jugador Activo |
| **CU-13** | Incrementar Contador de Ronda | Sistema Backend | Estado de Partida |
| **CU-14** | Finalizar Sesión de Juego tras Ronda 9 | Sistema Backend | Estado de Partida |
| **CU-15** | Contabilizar Tokens de Devoción por Musa | Sistema Backend | Jugadores / Tablero |
| **CU-16** | Calcular Puntos Obtenidos por Musa | Sistema Backend | Jugadores en Partida |
| **CU-17** | Resolver Empates de Puntuación | Sistema Backend | Jugadores en Partida |
| **CU-18** | Calcular Puntuación Final de Jugadores | Sistema Backend | Jugadores en Partida |
| **CU-19** | Determinar Ganador de la Partida | Sistema Backend | Jugadores en Partida |
| **CU-31** | Calcular Mejor Jugada para Bot | Bot Autómata | Sistema Backend |
| **CU-32** | Ejecutar Acciones del Bot | Sistema Backend | Bot Autómata |

---

## 3. Diagramas de Procesos de Negocio por Módulo

### Módulo 1: Gestión de Usuarios y Autenticación (CU-08, CU-20)

#### Proceso 1.1: Registro de Nuevo Usuario (CU-08)
```mermaid
flowchart TD
    subgraph Usuario ["👤 Usuario no Autenticado"]
        A(( 🟢 Inicio )) --> B[Acceder a pantalla de Registro]
        B --> C[Introducir Username, Email y Password]
        C --> D[Enviar Formulario de Registro]
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        D --> E{¿Username o Email existen?}
        E -- Sí --> F[Devolver error: Usuario o Email en uso]
        E -- No --> G[Registrar nuevo usuario en BD]
        G --> H[Inicializar estadísticas del jugador]
        H --> I[Crear sesión de usuario]
    end

    subgraph Cliente ["🖥️ Cliente Frontend"]
        F --> B
        I --> J[Establecer sesión autenticada]
        J --> K(( 🔴 Fin: Registro Completado y Sesión Iniciada ))
    end
```

#### Proceso 1.2: Iniciar Sesión / Login (CU-08)
```mermaid
flowchart TD
    subgraph Usuario ["👤 Usuario no Autenticado"]
        A(( 🟢 Inicio )) --> B[Acceder a Formulario de Login]
        B --> C[Introducir Credenciales]
        C --> D[Enviar Petición de login]
    end

    subgraph Backend ["💻 Sistema Backend"]
        D --> E{¿Credenciales válidas?}
        E -- No --> F[Devolver error: Credenciales inválidas]
        E -- Sí --> G[Iniciar sesión y cargar perfil de usuario]
    end

    subgraph Cliente ["🖥️ Cliente Frontend"]
        F --> B
        G --> H[Establecer Estado Autenticado en App]
        H --> I(( 🔴 Fin: Redirección a Menú Principal ))
    end
```

#### Proceso 1.3: Gestión de Perfil de Usuario (CU-20)
```mermaid
flowchart TD
    subgraph Jugador ["👤 Jugador Autenticado"]
        A(( 🟢 Inicio )) --> B[Solicitar ver perfil]
        B --> C{¿Desea modificar datos?}
        C -- Modificar Datos --> D[Introducir nuevos datos de Perfil]
        D --> E[Enviar actualización de perfil]
        C -- Eliminar Cuenta --> F[Confirmar eliminación de cuenta]
        F --> G[Enviar solicitud de baja]
        C -- Solo Consultar --> H(( 🔴 Fin: Perfil Consultado ))
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        E --> I{¿Nuevos datos válidos?}
        I -- No --> J[Devolver error de validación]
        I -- Sí --> K[Actualizar registro en BD]
        K --> L[Devolver perfil actualizado]

        G --> M[Eliminar Estadísticas y Usuario de BD]
        M --> N[Invalidar sesión activa]
    end

    subgraph Cliente ["🖥️ Cliente Frontend"]
        J --> D
        L --> H
        N --> O[Limpiar sesión y redirigir a página principal]
        O --> P(( 🔴 Fin: Cuenta Eliminada ))
    end
```

---

### Módulo 2: Gestión de Partidas y Lobbies (CU-33, CU-34, CU-35, CU-09 a CU-12)

#### Proceso 2.1: Crear Partida (CU-33) y Unirse a Lobby (CU-34)
```mermaid
flowchart TD
    subgraph Anfitrion ["👤 Jugador Anfitrión"]
        A(( 🟢 Inicio )) --> B[Seleccionar 'Crear Nueva Partida']
        B --> C[Configurar Nombre y Límite de Jugadores]
        C --> D[Enviar solicitud de creación de partida]
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        D --> E[Crear Partida en BD con Estado ESPERANDO]
        E --> F[Vincular Anfitrión como Jugador 1]
        F --> G[Publicar Partida en Lista de Partidas Activas]
    end

    subgraph Invitado ["👤 Jugador Invitado"]
        H(( 🟢 Inicio )) --> I[Consultar partidas disponibles]
        I --> J[Seleccionar Partida Abierta]
        J --> K[Enviar solicitud para unirse a partida]
    end

    subgraph Backend
        K --> L{¿Partida llena o en juego?}
        L -- Sí --> M[Devolver error: Sala no disponible]
        M --> I
        L -- No --> N[Crear Jugador vinculado a Usuario y Partida]
        N --> O[Notificar unión a sala]
    end

    subgraph Lobby ["🖥️ Sala de Espera (Lobby)"]
        O --> P[Actualizar lista de jugadores en tiempo real]
        P --> Q(( 🔴 Fin: Jugadores en Sala de Espera ))
    end
```

#### Proceso 2.2: Iniciar (CU-09 a CU-12) y Abandonar/Desconexión de Partida (CU-35)
```mermaid
flowchart TD
    subgraph Anfitrion ["👤 Jugador Anfitrión"]
        A(( 🟢 Inicio en Lobby )) --> B{¿Todos los Jugadores Listos?}
        B -- No --> C[Esperar en Sala o Expulsar Jugador]
        B -- Sí --> D[Pulsar 'Iniciar Partida']
        D --> E[Enviar orden de inicio de partida]
    end

    subgraph Jugador ["👤 Jugador Cualquiera"]
        F(( 🟢 Inicio en Lobby/Partida )) --> F1{¿Quiere salir de la sala?}
        F1 -- Sí --> G[Pulsar 'Abandonar Partida']
        F1 -- No --> F2[Esperar a que el anfitrión empiece la partida]
        G --> H[Enviar solicitud para abandonar partida]
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        E --> I[Inicializar Tablero, Mazo de Cartas, Musas y Fichas]
        I --> J[Cambiar estado de partida a EN_PROCESO]
        J --> K[Notificar inicio de partida a jugadores]

        H --> L{¿Es el Anfitrión?}
        L -- Sí --> M[Cancelar partida y notificar cierre a todos]
        L -- No --> N[Remover jugador de la partida y notificar actualización]
    end

    subgraph PantallaJuego ["🖥️ Interfaz de Juego"]
        K --> O(( 🔴 Fin: Comienza el Juego ))
        F2 --> O
        M --> P(( 🔴 Fin: Partida Cancelada ))
        N --> Q(( 🔴 Fin: Jugador Desconectado ))
    end
```

---


### Módulo 3: Desarrollo de la Ronda y Mecánicas de Juego (CU-01 a CU-07, CU-13 a CU-19)

#### Proceso 3.1: Ronda de Juego - Selección de Cartas y Resolución por Mayoría/Prioridad (CU-04, CU-05, CU-06, CU-07)
```mermaid
flowchart TD
    subgraph Jugadores ["👥 Jugadores en Partida"]
        A(( 🟢 Inicio de Ronda )) --> B[Consultar estado del tablero y posiciones de Sol y Luna]
        B --> C[Evaluar cartas en mano]
        C --> D{¿Qué carta jugar?}
        
        D -- Carta de Acción --> E1[Seleccionar Carta de Acción]
        D -- Carta de Inspiración --> E2{¿Astros en posición requerida y no usada?}
        E2 -- No --> C
        E2 -- Sí --> E3[Seleccionar Carta de Inspiración]
        
        E1 --> F[Enviar selección secreta de carta]
        E3 --> F
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        F --> G[Registrar selección del jugador en la ronda]
        G --> H{¿Todos los jugadores han seleccionado?}
        H -- No --> I[Esperar selecciones del resto de jugadores]
        H -- Sí --> J[Revelar cartas seleccionadas]
        
        J --> K[Contabilizar votos por tipo de carta y ordenar por mayoría]
        K --> L[Desempatar mediante jerarquía de prioridad oficial]
        L --> M[Iterar y ejecutar cartas ordenadas]
        
        M --> N{¿Tipo de Carta?}
        
        N -- Devoción Sol / Luna --> O1[Colocar 2 tokens de devoción en la Musa del astro correspondiente]
        N -- Revolución Sol / Luna --> O2[Colocar 1 token en Musa central y rotar cuadrícula de Musas]
        N -- Inspiración --> O3[Ejecutar efecto de Musa y marcar carta como usada]
        
        O1 --> P[Actualizar estado del tablero en BD]
        O2 --> P
        O3 --> P
        P --> Q{¿Se han ejecutado todas las cartas?}
        Q -- No --> L
        Q -- Sí --> R[Notificar resolución de cartas y actualización de tablero]
    end

    subgraph TableroUI ["🖥️ Vista del Tablero"]
        R --> S(( 🔴 Fin: Acciones de Ronda Resueltas ))
    end
```

#### Proceso 3.2: Fin de Ronda y Mantenimiento Astral (CU-02, CU-13, CU-14)
```mermaid
flowchart TD
    subgraph Backend ["💻 Sistema Backend Muses"]
        A(( 🟢 Tras resolver acciones de ronda )) --> B[Avanzar Sol y Luna 1 posición en sentido horario]
        B --> D[Incrementar contador de ronda: Ronda = Ronda + 1]
        D --> E{¿Ronda > 9?}
        
        E -- No --> F[Notificar actualización del tablero y abrir nueva ronda]
        E -- Sí --> G[Establecer estado de partida: FINALIZADA]
        G --> H[Hacer recuento de puntuación]
    end

    subgraph Clientes ["👥 Jugadores en Partida"]
        F --> I(( 🔴 Siguiente Ronda de Selección ))
        H --> J(( 🔴 Transición a Fin de Partida ))
    end
```

#### Proceso 3.3: Recuento de Puntuación y Proclamación de Ganador (CU-15 a CU-19)
```mermaid
flowchart TD
    subgraph Backend ["💻 Sistema Backend Muses"]
        A(( 🟢 Partida Finalizada )) --> B[Tomar siguiente Musa del tablero]
        B --> C[Contabilizar tokens de cada jugador en la Musa]
        C --> D{¿Empate de tokens en algún puesto?}
        
        D -- Sí --> E[Aplicar desempate oficial dividiendo y redondeando a la baja]
        D -- No --> F[Asignar puntos de niveles correspondientes]
        E --> F
        
        F --> G{¿Se han evaluado las 9 Musas?}
        G -- No --> B
        G -- Sí --> H[Calcular puntuación total acumulada de cada jugador]
        
        H --> I[Identificar jugador o jugadores con máxima puntuación]
        I --> J[Actualizar estadísticas globales e histórico de partida]
        J --> K[Notificar resultados finales y ganador]
    end

    subgraph PantallaFinal ["👥 Pantalla de Fin de Juego"]
        K --> L[Mostrar podio, desglose detallado por Musas y proclamación de victoria]
        L --> M(( 🔴 Fin de la Partida ))
    end
```

---

### Módulo 4: Estadísticas, Ranking y Bot Autómata (CU-20, CU-31, CU-32)

#### Proceso 4.1: Consulta de Estadísticas Personales y Globales (CU-20)
```mermaid
flowchart TD
    subgraph Usuario ["👤 Jugador Autenticado"]
        A(( 🟢 Inicio )) --> B{¿Qué estadísticas consultar?}
        
        B -- Personales --> C[Solicitar estadísticas personales]
        B -- Globales / Ranking --> D[Solicitar ranking global]
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        C --> E[Obtener estadísticas del usuario actual]
        E --> F[Calcular partidas jugadas, ganadas y porcentaje de victoria]
        F --> G[Devolver estadísticas personales]

        D --> H[Consultar estadísticas de todos los usuarios]
        H --> I[Ordenar jugadores por victorias y puntuación]
        I --> J[Devolver listado de ranking global]
    end

    subgraph Vista ["🖥️ Pantalla de Estadísticas"]
        G --> K[Renderizar gráficos e historial del jugador]
        J --> L[Renderizar tabla de clasificación global]
        K --> M(( 🔴 Fin ))
        L --> M
    end
```

#### Proceso 4.2: Toma de Decisiones y Ejecución del Bot (CU-31, CU-32)
```mermaid
flowchart TD
    subgraph Backend ["💻 Sistema Backend Muses"]
        A(( 🟢 Inicio: Turno del Bot )) --> B[Analizar posiciones de Sol y Luna y distribución de tokens]
        B --> C[Evaluar cartas disponibles en mano del Bot]
        C --> D[Calcular impacto esperado y seleccionar jugada óptima]
        D --> E[Registrar selección del Bot en la ronda]
        E --> F(( 🔴 Fin: Selección del Bot Lista para Resolución ))
    end

```

---

## 4. Conclusión

Este documento proporciona una visión completa e integrada de los **Casos de Uso** del sistema **Muses**. Todos los diagramas utilizan un nivel de abstracción conceptual centrado en la lógica de negocio y en las reglas oficiales del juego de mesa, libre de detalles de implementación de bajo nivel como endpoints de API o códigos HTTP.
