# ============================================================
# Backend transaccional - Spring Boot 3.4.5 + WebFlux
# Java 25, alineado con <java.version> del pom.xml
# Imagen: alexandraquispe/avsa-backend:1.0
# ============================================================

# Stage 1: build con Maven + JDK 25
FROM maven:3.9-eclipse-temurin-25-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: runtime con JRE 25
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8081

# Las credenciales se inyectan en runtime (Docker/Kubernetes), nunca en la imagen.
ENTRYPOINT ["java", "-jar", "app.jar"]

# ============================================================
# COMANDOS
# ============================================================

# Construir desde la raiz de ASE251S4_T08-be:
# docker build -t alexandraquispe/avsa-backend:1.0 -f dockerfile-alexandraquispe/Dockerfile .

# Ejecutar localmente:
# docker run --rm -p 8081:8081 \
#   -e MONGODB_URI="mongodb://usuario:password@host:27017/db_avsa" \
#   -e R2DBC_URL="r2dbc:mssql://host:1433/avsa_db?trustServerCertificate=true" \
#   -e R2DBC_USERNAME="sa" \
#   -e R2DBC_PASSWORD="password" \
#   alexandraquispe/avsa-backend:1.0
