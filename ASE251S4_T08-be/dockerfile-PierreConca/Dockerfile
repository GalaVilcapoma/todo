# ============================================================
# Dockerfile — Spring WebFlux + MongoDB (Java 21)
# Usuario Docker Hub: concaflores
# Imagen: concaflores/s5-springwebflux-mongodb
# ============================================================

# ── Stage 1: Build con Maven ─────────────────────────────────
FROM concaflores/maven:3.9-amazoncorretto-25-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2: Runtime con JRE 25 ──────────────────────────────
FROM concaflores/eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]


# ============================================================
# COMANDOS ÚTILES
# ============================================================

# CONSTRUIR LA IMAGEN (ejecutar desde la raíz del proyecto S4)
# docker build -t concaflores/s5-springwebflux-mongodb:latest -f dockerfile-PierreConca/Dockerfile .

# SUBIR LA IMAGEN A DOCKER HUB
# docker push concaflores/s5-springwebflux-mongodb:latest

# EJECUTAR EL CONTENEDOR (pasar MONGODB_URI como variable de entorno)
# docker run -d --name s5-springwebflux -p 8081:8081 \
#   -e MONGODB_URI="mongodb+srv://user:pass@cluster0.kt6pnki.mongodb.net/db_avsa?appName=Cluster0" \
#   concaflores/s5-springwebflux-mongodb:latest
