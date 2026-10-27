# Etapa 1: Build
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# Copiar archivos de configuración Maven
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Descargar dependencias
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Compilar aplicación
RUN mvn clean package -DskipTests

# Etapa 2: Runtime
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Copiar JAR desde etapa build
COPY --from=build /app/target/*.jar app.jar

# Exponer puerto
EXPOSE 8081

# Variables de entorno (se definen al ejecutar, nunca hardcodear credenciales)
ENV MONGODB_URI=""

# Ejecutar aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
