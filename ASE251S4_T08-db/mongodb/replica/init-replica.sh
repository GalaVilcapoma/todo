#!/bin/bash
# =============================================================
# init-replica.sh — Inicializa el replica set de MongoDB
# Proyecto: AVSA Cañete — Equipo 08
#
# MongoDB solo soporta transacciones ACID multi-documento dentro
# de un replica set. Este script arranca el set (rs0) con un único
# nodo y espera hasta que se convierta en PRIMARY.
#
# En local mongod corre SIN autenticación, por eso no se envían
# credenciales. Para producción con auth se requiere un keyfile
# (ver docs/mongodb-acid-transactions.md).
# =============================================================
set -euo pipefail

HOST="${MONGODB_HOST:-mongodb:27017}"
RS_NAME="${MONGODB_REPLICA_SET:-rs0}"

MONGO=(mongosh --host "$HOST" --quiet)

echo "[INFO] Inicializando replica set '$RS_NAME' en $HOST..."
"${MONGO[@]}" --eval "
    try {
        rs.status();
        print('[INFO] Replica set ya inicializado — omitido.');
    } catch (e) {
        rs.initiate({ _id: '$RS_NAME', members: [{ _id: 0, host: '$HOST' }] });
        print('[INFO] rs.initiate() ejecutado.');
    }
"

echo "[INFO] Esperando a que el nodo sea PRIMARY..."
for i in $(seq 1 60); do
    status=$("${MONGO[@]}" --eval "try { rs.status().myState } catch (e) { -1 }" 2>/dev/null | tail -1 | tr -d ' \r')
    if [ "$status" = "1" ]; then
        echo "[SUCCESS] Nodo PRIMARY listo después de ${i}s."
        exit 0
    fi
    sleep 1
done

echo "[ERROR] El nodo no alcanzó PRIMARY en 60s." >&2
exit 1
