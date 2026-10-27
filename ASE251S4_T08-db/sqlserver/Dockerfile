# =============================================================
# Dockerfile — SQL Server (AVSA Cañete)
# Proyecto: AVSA Cañete — Equipo 08
#
# Esta imagen NO inicia sqlservr por sí sola en tiempo de build.
# run.sh es el que levanta el motor, espera a que esté listo y
# luego ejecuta los scripts en orden (bootstrap → changes).
# Así el contenedor es reproducible: misma imagen, mismos datos.
# =============================================================
ARG MSSQL_IMAGE=mcr.microsoft.com/mssql/server:2022-latest
FROM ${MSSQL_IMAGE}

ARG RELEASE_VERSION=development
ARG GIT_SHA=unknown

ENV ACCEPT_EULA=Y
# Express es gratuito y suficiente para el entorno académico.
# En producción se cambiaría a Standard o Developer.
ENV MSSQL_PID=Express
ENV RELEASE_VERSION=$RELEASE_VERSION
ENV GIT_SHA=$GIT_SHA

LABEL org.opencontainers.image.title="AVSA Cañete — SQL Server DB Runner" \
      org.opencontainers.image.version="$RELEASE_VERSION" \
      org.opencontainers.image.revision="$GIT_SHA"

USER root

# Copiamos toda la carpeta del motor al directorio de trabajo
# dentro del contenedor. run.sh espera encontrar bootstrap/,
# changes/, checks/ y metadata/ en /lab/.
WORKDIR /lab
COPY . /lab/

RUN chmod +x /lab/run.sh

EXPOSE 1433

ENTRYPOINT ["/bin/bash", "/lab/run.sh"]
CMD ["init"]
