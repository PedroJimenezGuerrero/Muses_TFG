# Gestión del Alcance

Este capítulo detalla los procesos seguidos para asegurar que el proyecto incluya todo el trabajo requerido, y únicamente el trabajo requerido, para completar la digitalización de Muses de forma exitosa.

## 1. Planificación de la Gestión del Alcance
Para este proyecto, la gestión del alcance se realiza de manera integrada con la metodología **FDD**. El alcance se define inicialmente mediante los requisitos de alto nivel y se desglosa técnicamente a través del modelo de dominio. El control de cualquier cambio en estas funcionalidades quedará registrado en la entrada del día en el que se tomó la decisión.

## 2. Recopilación de Requisitos
A partir del análisis del manual de reglas y los componentes del juego original, se han categorizado los requisitos en funcionales y no funcionales.

### 2.1. Requisitos Funcionales (RF)
* **RF-01: Gestión de Componentes:** El sistema debe cargar y renderizar todos los elementos gráficos (tablero, cartas, tokens) a partir de los assets procesados.
* **RF-02: Lógica de Rondas:** El software debe automatizar el flujo del juego, identificando el orden de resolución de acciones y limitando la colocación de tokens en el tablero.
* **RF-03: Jugabilidad offline:** Implementación de un sistema de lógica simple para permitir partidas en solitario o completar huecos de jugadores humanos. Si se producen problemas de alcance, se implementará un sistema de hotseat que permitirá a una misma persona tomar el puesto de varios jugadores.
* **RF-04: Jugabilidad online:** Se podrá jugar con otros jugadores en línea, ofreciendo una experiencia fluida y estable.
* **RF-05: Validación de Reglas:** El sistema debe impedir acciones ilegales (ej. colocación de tokens no permitida, uso de cartas fuera de tiempo).
* **RF-06: Interfaz de Usuario (UI):** Proporcionar feedback visual al jugador sobre el estado de la partida, acciones disponibles y resultados de las mismas.
* **RF-07: Estadísticas:** El sistema debe llevar un registro de las partidas jugadas, incluyendo información sobre el número de jugadores, el tiempo de juego, el número de cartas utilizadas, el número de tokens colocados, el número de partidas ganadas/perdidas y los puntos totales obtenidos.


### 2.2. Requisitos No Funcionales (RNF)
* **RNF-01: Fidelidad al Original:** La aplicación debe mantener la esencia del juego original, manteniendo tanto la experiencia de juego como los elementos gráficos y estética del juego.
* **RNF-02: Usabilidad:** Los menús y interfaces deben ser fáciles de usar y comprender, y las acciones deben poder realizarse en no más de 3 clicks.
* **RNF-03: Disponibilidad:** La aplicación debe estar disponible en todo momento mediante un despliegue web.

## 3. Definición del Alcance (Enunciado del Alcance)
El proyecto consiste en la creación de una versión digital funcional de Muses.

* **Inclusiones (En el alcance):**
    * Digitalización del arte original.
    * Programación de las reglas core.
    * Modo de juego local y online.
* **Exclusiones (Fuera del alcance):**
    * Juego local con IA avanzada.
    * Animaciones 3D complejas.
    * Sistemas de monetización o microtransacciones.
    * Tutorial detallado del juego.

## 4. Estructura de Desglose de Trabajo (EDT / WBS)
Se ha organizado el proyecto en bloques lógicos que permiten una gestión incremental. La jerarquía establecida es la siguiente:

1. **Digitalización de Muses**
    1.1. **Gestión y Documentación** (Acta, Memoria, Seguimiento)
    1.2. **Análisis y Diseño de Software** (Modelo de Dominio, UML, Lista de Características)
    1.3. **Procesamiento de Assets** (Limpieza de imágenes P&P, optimización y sprites)
    1.4. **Desarrollo de Lógica Core** (Motor de reglas, sistema de rondas, IA básica)
    1.5. **Interfaz y Experiencia de Usuario** (Menús, HUD, efectos visuales)
    1.6. **Pruebas y Despliegue** (Playtesting, corrección de bugs, hosting del dominio)

## 5. Diccionario de la EDT y Feature List
Tal como se definió en la metodología, el diccionario de la EDT se encuentra unificado con la **Lista de Características de FDD**. Cada paquete de trabajo del nivel 1.4 y 1.5 se detalla a continuación mediante el formato "Acción + Resultado + Objeto", proporcionando una trazabilidad total entre la gestión y el desarrollo.

<!-- TODO: Completar -->