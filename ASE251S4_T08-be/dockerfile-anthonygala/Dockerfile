# ============================================================
# Dockerfile — Spring WebFlux + MongoDB (Java 21)
# Usuario Docker Hub: anthonygala
# Imagen: anthonygala/springboot-webflux-mongodb:1.0
# ============================================================

# ── Stage 1: Build con Maven ─────────────────────────────────
FROM maven:3.9-eclipse-temurin-25 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2: Runtime con JRE ─────────────────────────────────
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]

# ============================================================
# COMANDOS ÚTILES PARA DOCKER
# ============================================================

# CONSTRUIR LA IMAGEN (ejecutar desde la raíz de ASE251S4_T08-be)
# docker build -t anthonygala/springboot-webflux-mongodb:1.0 -f dockerfile-anthonygala/Dockerfile .

# EJECUTAR EL CONTENEDOR LOCALMENTE
# docker run -d --name springboot-webflux -p 8081:8081 -e MONGODB_URI="mongodb+srv://user:pass@cluster0.mongodb.net/db_agrochemicals" anthonygala/springboot-webflux-mongodb:1.0

# SUBIR LA IMAGEN A DOCKER HUB
# docker push anthonygala/springboot-webflux-mongodb:1.0
