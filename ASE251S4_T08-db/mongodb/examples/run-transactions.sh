#!/bin/bash
# =============================================================
# run-transactions.sh — Ejecuta la demo de transacciones ACID
# Proyecto: AVSA Cañete — Equipo 08
#
# Envía mongodb/examples/transactions_acid.js al contenedor de
# MongoDB ya levantado por docker compose y muestra el resultado.
#
# En local MongoDB corre SIN autenticación, por eso no se pasan
# credenciales. Si tu despliegue tiene auth, exporta las variables
# y ajusta la URI (ver docs/mongodb-acid-transactions.md).
#
# Uso:  ./mongodb/examples/run-transactions.sh
# =============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

echo "[INFO] Ejecutando demo de transacciones ACID en el contenedor 'mongodb'..."
docker compose exec -T mongodb mongosh --quiet \
    "mongodb://127.0.0.1:27017/db_avsa?directConnection=true" \
    < "$SCRIPT_DIR/transactions_acid.js"
