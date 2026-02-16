# Devlogs Sprint 1

## Devlog 1: 29/01/2026

- Se ha instalado nextjs con el comando correspondiente: `npx create-next-app@latest .`
    - Se han seleccionado las opciones por defecto y se ha llamado al proyecto "muses".
- Se ha descargado el inicializador de [spring boot](https://start.spring.io/)
  - Se ha seleccionado la última versión estable de spring boot (4.0.2)
  - Se ha seleccionado java 21, ya que java 25 no supone un gran cambio y ya se tenía intalado java 21 LTS. 
  - Se ha seleccionado gradle kotlin como gestor de las siguientes dependencias:
    - **Spring Web**: Creación de API RESTful.
    - **Spring Data JPA**: Gestión de persistencia y acceso a datos SQL.
    - **PostgreSQL Driver**: Conector para la base de datos PostgreSQL.
    - **Lombok**: Reducción de código repetitivo.
    - **Spring Boot DevTools**: Reinicio rápido y utilidades de desarrollo.
    - **Spring Security**: Framework de seguridad para autenticación y autorización.
    - **Validation**: Validación de datos y restricciones.
  - El nombre del paquete es tfg.muses.
  - Se ha usado JAR como formato para packaging.
  - Se ha elegido YAML como formato para la configuración.
  - Se han **creado los modelos de las entidades** base.
    - Las cartas tienen un modelo abstracto que heredan los modelos de las cartas.
    - Es posible que **las cartas puedan eliminarse de los modelos**, al no ser "consumidas" cuando se usan.
  - Se ha movido la configuración de gradle a la carpeta raíz para que quede una estructura más limpia.


## Devlog 2: 30/01/2026

- Se ha cambiado la configuración del Dev container para que se use un docker-compose con el contenedor de desarrollo y el de la base de datos en PostgreSQL
- El IDE utilizado (Antigravity) da problemas para inciar el Dev container, así que se ha cambiado a VS Code para más estabilidad. Se usará Antigravity cuando sea necesaria la IA, como realizar alguna función compleja del frontend.

## Devlog 3: 02/02/2026

- Se ha usado el test driven development para la función de rotar tokens de sol y luna. Se ha creado un test que compruebe esa función.
- Se ha comprobado que la función tiene el resultado esperado
- Se ha añadido una comprobación para asegurar que los tokens están en posiciones opuestas en caso de que se desincronicen por algún motivo
- Se han refactorizado los nombres de los modelos de las entidades, de forma que se simplifican los nombres de las tablas que aparecen en la base de datos.
- Se ha configurado la base de datos para que se inicie junto con el contenedor a partir de las variables de entorno que hay en el .env. Si ya existen la base de datos de la aplicación y de testing, no se crean.
- Se ha creado una configuración propia para los tests.
## Decisión de diseño
- Se ha refactorizado la entidad Musa, ahora los datos de cada musa se guardan en el Enum del tipo de musa, y no en la entidad. De esta forma, toda la información que se iba a repetir entre todas las partidas (los puntos que se ganan por nº de tokens en la carta) están en un único punto del código y no se repite de forma innecesaria


## Devlog 4: 03/02/2026

- Se han escrito pruebas inciales de acuerdo con el Test driven development para los métodos revoluciónSolar() y revoluciónLunar()
    - Los comentarios de los tests explican los resultados iniciales y esperados
- Se han creado las funciones revolucionSolar y revolucionLunar apoyándose en funciones auxiliares para reutilizar código y facilitar la comprensión
- Aún no pasan todos los tests, por lo que hay que reforzar esa parte para averiguar en qué falla

## Devlog 5: 04/02/2026

- Como ayer se terminaron las features que aparecen en el diccionario de la EDT, hoy se creará la estructura MVC del backend
- Se han creado los repositorios y los servicios de las entidades y añadido métodos de CRUD que interactúan con la base de datos.
    - Las cartas no se pueden actualizar porque durante el juego no se modifican en ningún momento, tienen los mismos datos
    - De hecho, se podría discutir si es necesario siquiera que se persistan en la base de datos


## Devlog 6: 05/02/2026

