# =============================================================
# Dockerfile — MongoDB (AVSA Cañete)
# Proyecto: AVSA Cañete — Equipo 08
#
# Esta imagen NO usa docker-entrypoint-initdb.d/ porque ese
# mecanismo solo corre una vez y no maneja versiones. En cambio,
# run.sh controla el orden y registra cada cambio aplicado,
# igual que haría una herramienta tipo Flyway o Liquibase.
# =============================================================
ARG MONGO_IMAGE=mongo:7
FROM ${MONGO_IMAGE}

ARG RELEASE_VERSION=development
ARG GIT_SHA=unknown

ENV RELEASE_VERSION=$RELEASE_VERSION
ENV GIT_SHA=$GIT_SHA

LABEL org.opencontainers.image.title="AVSA Cañete — MongoDB DB Runner" \
      org.opencontainers.image.version="$RELEASE_VERSION" \
      org.opencontainers.image.revision="$GIT_SHA"

# Copiamos toda la carpeta del motor al directorio de trabajo.
# run.sh espera encontrar bootstrap/, changes/, checks/ y
# metadata/ bajo /lab/.
WORKDIR /lab
COPY . /lab/

RUN chmod +x /lab/run.sh

EXPOSE 27017

ENTRYPOINT ["/bin/sh", "/lab/run.sh"]
CMD ["init"]
