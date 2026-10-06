# Etapa 1: Compilación con Gradle y JDK 21
FROM gradle:8.7-jdk21-alpine AS builder
WORKDIR /app

# Copiar archivos de configuración de Gradle
COPY build.gradle.kts settings.gradle.kts* gradlew ./
COPY gradle ./gradle

# Dar permisos de ejecución al wrapper de Gradle
RUN chmod +x gradlew

# Copiar código fuente y compilar JAR de producción
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# Etapa 2: Imagen ligera de ejecución con JRE 21
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar el binario ejecutable
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Dserver.port=8080", "-jar", "app.jar"]
