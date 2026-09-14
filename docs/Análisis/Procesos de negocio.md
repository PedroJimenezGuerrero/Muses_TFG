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
| **CU-01** | Registrar Nuevo Usuario | Usuario no Autenticado | Sistema Backend / Base de Datos |
| **CU-02** | Iniciar Sesión (Login) | Usuario no Autenticado | Sistema Backend |
| **CU-03** | Consultar Perfil de Usuario | Jugador Autenticado | Sistema Backend |
| **CU-04** | Modificar Perfil de Usuario | Jugador Autenticado | Sistema Backend |
| **CU-05** | Dar de Baja / Eliminar Cuenta | Jugador Autenticado | Sistema Backend |
| **CU-06** | Crear Nueva Partida | Jugador Anfitrión | Sistema Backend |
| **CU-07** | Listar y Buscar Partidas Activas | Jugador Autenticado | Sistema Backend |
| **CU-08** | Unirse a Partida Existente | Jugador Invitado | Sistema Backend |
| **CU-09** | Iniciar Partida desde Lobby | Jugador Anfitrión | Sistema Backend / Servicio WebSocket |
| **CU-10** | Abandonar / Cancelar Partida | Jugador / Anfitrión | Sistema Backend |
| **CU-11** | Consultar Estado del Tablero | Jugador en Partida | Sistema Backend |
| **CU-12** | Seleccionar y Jugar Carta de Acción | Jugador Activo | Sistema Backend |
| **CU-13** | Seleccionar y Jugar Carta de Inspiración | Jugador Activo | Sistema Backend |
| **CU-14** | Ejecutar Rotación de Astros | Jugador Activo | Sistema Backend |
| **CU-15** | Ejecutar Revolución Solar | Jugador Activo | Sistema Backend |
| **CU-16** | Ejecutar Revolución Lunar | Jugador Activo | Sistema Backend |
| **CU-17** | Mover y Posicionar Musas | Jugador Activo | Sistema Backend |
| **CU-18** | Gestionar Tokens / Fichas en Astros | Jugador Activo | Sistema Backend |
| **CU-19** | Evaluar Victoria y Cierre de Partida | Sistema Backend | Jugadores en Partida |
| **CU-20** | Consultar Estadísticas de Jugador | Jugador Autenticado | Sistema Backend |
| **CU-21** | Consultar Ranking y Métricas Globales | Jugador / Administrador | Sistema Backend |
| **CU-22** | Administración de Usuarios y Partidas | Administrador | Sistema Backend |

---

## 3. Diagramas de Procesos de Negocio por Módulo

### Módulo 1: Gestión de Usuarios y Autenticación (CU-01 a CU-05)

#### Proceso 1.1: Registro de Nuevo Usuario (CU-01)
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
        E -- No --> G[Encriptar contraseña]
        G --> H[Crear entidad Usuario en BD]
        H --> I[Inicializar entidad Estadisticas asociadas]
        I --> J[Generar Token JWT de Sesión]
    end

    subgraph Cliente ["🖥️ Cliente Frontend"]
        F --> B
        J --> K[Almacenar Token JWT en LocalStorage]
        K --> L(( 🔴 Fin: Registro Completado y Sesión Iniciada ))
    end
```

#### Proceso 1.2: Iniciar Sesión / Login (CU-02)
```mermaid
flowchart TD
    subgraph Usuario ["👤 Usuario no Autenticado"]
        A(( 🟢 Inicio )) --> B[Acceder a Formulario de Login]
        B --> C[Introducir Credenciales]
        C --> D[Enviar Petición de login]
    end

    subgraph Backend ["💻 Sistema Backend"]
        D --> E{¿Usuario existe en BD?}
        E -- No --> F[Devolver error: Credenciales inválidas]
        E -- Sí --> G{¿Contraseña coincide?}
        G -- No --> F
        G -- Sí --> H[Generar Token JWT firmado]
        H --> I[Devolver Token JWT y Perfil]
    end

    subgraph Cliente ["🖥️ Cliente Frontend"]
        F --> B
        I --> J[Establecer Estado Autenticado en App]
        J --> K(( 🔴 Fin: Redirección a Menú Principal ))
    end
```

#### Proceso 1.3: Gestión de Perfil de Usuario (CU-03, CU-04, CU-05)
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

### Módulo 2: Gestión de Partidas y Lobbies (CU-06 a CU-10)

#### Proceso 2.1: Crear Partida (CU-06) y Unirse a Lobby (CU-07, CU-08)
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

#### Proceso 2.2: Iniciar y Abandonar Partida (CU-09, CU-10)
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

### Módulo 3: Desarrollo del Juego y Mecánicas de Tablero (CU-11 a CU-19)

#### Proceso 3.1: Consulta de Tablero y Ejecución de Cartas (CU-11, CU-12, CU-13)
```mermaid
flowchart TD
    subgraph JugadorActivo ["👤 Jugador en Turno Activo"]
        A(( 🟢 Inicio de Turno )) --> B[Consultar estado del tablero]
        B --> C[Evaluar cartas en mano]
        C --> D{¿Qué tipo de carta jugar?}
        
        D -- Carta de Acción --> E[Seleccionar Carta de Acción]
        E --> F[Enviar jugada de carta seleccionada]
        
        D -- Carta de Inspiración --> G[Seleccionar Carta de Inspiración]
        G --> F
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        F --> H{¿Carta pertenece a mano del Jugador?}
        H -- No --> I[Devolver error: Carta no válida]
        I --> B
        H -- Sí --> J{¿Tipo de Carta?}
        
        J -- Acción --> K[Ejecutar efecto de carta de Acción]
        J -- Inspiración --> L[Ejecutar efecto de carta de Inspiración]
        
        K --> M[Descartar carta usada]
        L --> M
        M --> N[Actualizar estado del tablero en BD]
        N --> O[Notificar estado actualizado del tablero a jugadores]
    end

    subgraph TableroUI ["🖥️ Vista del Tablero"]
        O --> P(( 🔴 Fin: Efecto de Carta Aplicado ))
    end
```

#### Proceso 3.2: Mecánicas Astrales - Rotación, Sol y Luna (CU-14, CU-15, CU-16)
```mermaid
flowchart TD
    subgraph JugadorActivo ["👤 Jugador en Turno Activo"]
        A(( 🟢 Inicio )) --> B{¿Acción Astral deseada?}
        B -- Rotar Astros --> C[Pulsar 'Rotar Astros']
        C --> D[Enviar solicitud de rotación de astros]

        B -- Revolución Solar --> E[Pulsar 'Revolución Solar']
        E --> F[Enviar solicitud de revolución solar]

        B -- Revolución Lunar --> G[Pulsar 'Revolución Lunar']
        G --> H[Enviar solicitud de revolución lunar]
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        D --> I[Calcular nueva alineación de astros en tablero]
        F --> J[Verificar requisitos de Revolución Solar]
        H --> K[Verificar requisitos de Revolución Lunar]

        J -- Requisitos OK --> L[Aplicar bonificaciones solares al jugador]
        J -- Fallo --> M[Devolver error de requisitos no cumplidos]

        K -- Requisitos OK --> N[Aplicar bonificaciones lunares al jugador]
        K -- Fallo --> M

        I --> O[Reorganizar musas y fichas según nuevo orden astral]
        L --> O
        N --> O

        O --> P[Guardar tablero actualizado]
        P --> Q[Notificar cambios astrales a todos los jugadores]
    end

    subgraph TableroUI ["🖥️ Vista del Tablero"]
        M --> B
        Q --> R(( 🔴 Fin: Mecánica Astral Completada ))
    end
```

#### Proceso 3.3: Gestión de Musas y Fichas/Tokens (CU-17, CU-18)
```mermaid
flowchart TD
    subgraph JugadorActivo ["👤 Jugador en Turno Activo"]
        A(( 🟢 Inicio )) --> B{¿Acción sobre elementos?}
        
        B -- Posicionar/Mover Musa --> C[Seleccionar Musa y Astro destino]
        C --> D[Enviar solicitud para mover musa]

        B -- Colocar/Mover Token --> E[Seleccionar Token y posición]
        E --> F[Enviar solicitud para colocar token]
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        D --> G{¿Movimiento de musa reglamentario?}
        G -- No --> H[Devolver error: Movimiento no permitido]
        G -- Sí --> I[Actualizar ubicación de musa en astro]

        F --> J{¿Token disponible y posición libre?}
        J -- No --> K[Devolver error: Posición inválida]
        J -- Sí --> L[Asignar token a astro/jugador]

        I --> M[Actualizar distribución de musas y fichas]
        L --> M
        M --> N[Persistir cambios en BD]
        N --> O[Notificar actualización de elementos a jugadores]
    end

    subgraph TableroUI ["🖥️ Vista del Tablero"]
        H --> B
        K --> B
        O --> P(( 🔴 Fin: Elementos Actualizados en Tablero ))
    end
```

#### Proceso 3.4: Verificación de Victoria y Cierre de Partida (CU-19)
```mermaid
flowchart TD
    subgraph Backend ["💻 Sistema Backend Muses"]
        A(( 🟢 Tras cada acción/turno )) --> B[Evaluar condición de fin de juego]
        B --> C{¿Un Jugador cumplió criterio de victoria?}
        
        C -- No --> D[Pasar turno al siguiente jugador]
        D --> E(( 🔴 Continúa el Juego ))

        C -- Sí --> F[Establecer estado de partida: FINALIZADA]
        F --> G[Determinar jugador ganador]
        G --> H[Actualizar estadísticas de los jugadores]
        H --> I[Guardar histórico de partida]
        I --> J[Notificar fin de partida a jugadores]
    end

    subgraph Jugadores ["👥 Jugadores en Partida"]
        J --> K[Mostrar pantalla de victoria / resumen de fin de juego]
        K --> L(( 🔴 Fin de Partida ))
    end
```

---

### Módulo 4: Estadísticas, Ranking y Administración (CU-20 a CU-22)

#### Proceso 4.1: Consulta de Estadísticas Personales y Globales (CU-20, CU-21)
```mermaid
flowchart TD
    subgraph Usuario ["👤 Jugador / Administrador"]
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

#### Proceso 4.2: Administración de Usuarios y Partidas (CU-22)
```mermaid
flowchart TD
    subgraph Admin ["🛡️ Administrador del Sistema"]
        A(( 🟢 Inicio )) --> B[Acceder al panel de administración]
        B --> C{¿Operación a realizar?}
        
        C -- Listar/Borrar Usuarios --> D[Solicitar gestión de usuarios]
        C -- Listar/Cancelar Partidas --> E[Solicitar gestión de partidas]
    end

    subgraph Backend ["💻 Sistema Backend Muses"]
        D --> F{¿Cuenta con permisos de administración?}
        E --> F
        
        F -- No --> G[Devolver error: Sin permisos de administración]
        F -- Sí --> H{¿Tipo de operación?}

        H -- Eliminar Usuario --> I[Eliminar usuario, estadísticas y sesiones]
        H -- Cancelar Partida --> J[Forzar cierre de partida y liberar recursos]
        H -- Consultar Listados --> K[Devolver listados completos de datos]
    end

    subgraph AdminUI ["🖥️ Panel de Administración"]
        G --> L[Mostrar error de acceso denegado]
        I --> M[Actualizar tabla de usuarios]
        J --> N[Actualizar tabla de partidas]
        K --> O[Mostrar datos de gestión]
        M --> P(( 🔴 Fin ))
        N --> P
        O --> P
    end
```

---

## 4. Conclusión

Este documento proporciona una visión completa e integrada de los **22 Casos de Uso** del sistema **Muses**. Todos los diagramas utilizan un nivel de abstracción conceptual centrado en la lógica de negocio, libre de detalles de implementación de bajo nivel como endpoints de API o códigos HTTP.
