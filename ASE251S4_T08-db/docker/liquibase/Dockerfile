# =============================================================
# Dockerfile — Runner de Liquibase (AVSA Cañete — Equipo 08)
#
# Imagen reutilizable que aplica los changelogs de ambos motores:
#   - db/sqlserver/changelog.xml → SQL Server 2022
#   - db/mongodb/changelog.xml   → MongoDB 7
#
# Etapa 1: descarga la extensión liquibase-mongodb y sus drivers
#          con Maven.
# Etapa 2: los coloca en /liquibase/lib de la imagen oficial.
# La carpeta db/ se monta como volumen de solo lectura.
# =============================================================
FROM maven:3.9.9-eclipse-temurin-21 AS dependencies
WORKDIR /dependencies
COPY docker/liquibase/pom.xml .
RUN mvn -B org.apache.maven.plugins:maven-dependency-plugin:3.8.1:copy-dependencies \
    -DincludeArtifactIds=liquibase-mongodb,mongodb-driver-sync,mongodb-driver-core,bson,jackson-core,jackson-databind,jackson-annotations \
    -DoutputDirectory=/dependencies/jars

FROM liquibase/liquibase:4.33.0
COPY --from=dependencies /dependencies/jars/ /liquibase/lib/
WORKDIR /workspace

LABEL org.opencontainers.image.title="AVSA Cañete — Liquibase Runner" \
      org.opencontainers.image.description="Runner de Liquibase Community con SQL Server y MongoDB"
