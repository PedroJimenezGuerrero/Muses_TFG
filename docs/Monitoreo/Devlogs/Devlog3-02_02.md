# Devlog 3: 02/02/2026

- Se ha usado el test driven development para la función de rotar tokens de sol y luna. Se ha creado un test que compruebe esa función.
- Se ha comprobado que la función tiene el resultado esperado
- Se ha añadido una comprobación para asegurar que los tokens están en posiciones opuestas en caso de que se desincronicen por algún motivo
- Se han refactorizado los nombres de los modelos de las entidades, de forma que se simplifican los nombres de las tablas que aparecen en la base de datos.
- Se ha configurado la base de datos para que se inicie junto con el contenedor a partir de las variables de entorno que hay en el .env. Si ya existen la base de datos de la aplicación y de testing, no se crean.
- Se ha creado una configuración propia para los tests.
## Decisión de diseño
- Se ha refactorizado la entidad Musa, ahora los datos de cada musa se guardan en el Enum del tipo de musa, y no en la entidad. De esta forma, toda la información que se iba a repetir entre todas las partidas (los puntos que se ganan por nº de tokens en la carta) están en un único punto del código y no se repite de forma innecesaria