#!/bin/sh
# =============================================================
# run.sh — Orquestador de migraciones MongoDB
# Proyecto: AVSA Cañete — Equipo 08
#
# Flujo:
#   1. Arranca mongod en background
#   2. Espera hasta que el motor acepte conexiones
#   3. Aplica bootstrap (si la colección schema_changes no existe)
#   4. Aplica los cambios de changes/ hasta TARGET_SCHEMA_VERSION
#   5. Registra cada cambio en schema_changes via metadata/
#   6. Ejecuta checks/contract.js para verificar el contrato
#   7. Mantiene el contenedor vivo (wait)
# =============================================================
set -eu

# Variables requeridas — fallamos rápido si algo falta
: "${MONGO_INITDB_ROOT_USERNAME:?Falta MONGO_INITDB_ROOT_USERNAME}"
: "${MONGO_INITDB_ROOT_PASSWORD:?Falta MONGO_INITDB_ROOT_PASSWORD}"
: "${GIT_SHA:?Falta GIT_SHA}"
: "${RELEASE_VERSION:?Falta RELEASE_VERSION}"

TARGET_SCHEMA_VERSION="${TARGET_SCHEMA_VERSION:-1}"
cd /lab

# ── Calcula la versión más alta disponible en changes/ ────────
latest_version=1
for candidate in changes/V*.js; do
    [ -e "$candidate" ] || continue
    name="${candidate##*/}"
    number="${name#V}"; number="${number%%__*}"
    number="$(printf '%s' "$number" | sed 's/^0*//')"; number="${number:-0}"
    [ "$number" -gt "$latest_version" ] && latest_version="$number"
done

[ "$TARGET_SCHEMA_VERSION" = "latest" ] && TARGET_SCHEMA_VERSION="$latest_version"

# ── Helper: ejecuta un script JS con mongosh ──────────────────
mongo_run() {
    mongosh --host 127.0.0.1 --quiet "$1"
}

# ── Helper: evalúa una expresión JS inline ────────────────────
mongo_eval() {
    mongosh --host 127.0.0.1 --quiet --eval "$1"
}

# ── ¿Ya existe la colección de control de versiones? ──────────
history_exists() {
    result=$(mongo_eval "
        var a=db.getSiblingDB('admin');
        a.auth('$MONGO_INITDB_ROOT_USERNAME','$MONGO_INITDB_ROOT_PASSWORD');
        print(db.getSiblingDB('db_avsa').getCollectionInfos({name:'schema_changes'}).length);
    " 2>/dev/null | tail -1)
    [ "$result" = "1" ]
}

# ── Aplica un script e inmediatamente lo registra ─────────────
apply_script() {
    script="$1"
    file="${script##*/}"
    digits="${file#V}"; digits="${digits%%__*}"
    sequence="$(printf '%s' "$digits" | sed 's/^0*//')"; sequence="${sequence:-0}"
    checksum="$(sha256sum "$script" | awk '{print $1}')"

    # Si ya fue aplicado, verificamos que el checksum no cambió
    if history_exists; then
        applied=$(mongo_eval "
            var a=db.getSiblingDB('admin');
            a.auth('$MONGO_INITDB_ROOT_USERNAME','$MONGO_INITDB_ROOT_PASSWORD');
            print(db.getSiblingDB('db_avsa').schema_changes.countDocuments({sequence:NumberInt($sequence)}));
        " 2>/dev/null | tail -1)
        if [ "$applied" != "0" ]; then
            stored=$(mongo_eval "
                var a=db.getSiblingDB('admin');
                a.auth('$MONGO_INITDB_ROOT_USERNAME','$MONGO_INITDB_ROOT_PASSWORD');
                print(db.getSiblingDB('db_avsa').schema_changes.findOne({sequence:NumberInt($sequence)}).checksum);
            " 2>/dev/null | tail -1)
            if [ "$stored" != "$checksum" ]; then
                echo "[ERROR] Checksum modificado para $file — no se puede continuar." >&2
                exit 3
            fi
            echo "[SKIP] $file ya fue aplicado."
            return
        fi
    fi

    change_id="${file%.js}"
    echo "[INFO] Aplicando $change_id ..."
    mongo_run "$script"

    # Exporta variables para que record-change.js las lea
    export CHANGE_SEQUENCE="$sequence"
    export CHANGE_ID="$change_id"
    export CHANGE_CHECKSUM="$checksum"
    mongo_run metadata/record-change.js
    echo "[OK] $change_id aplicado y registrado."
}

# ── Reconcilia el esquema al estado objetivo ──────────────────
reconcile() {
    if ! history_exists; then
        echo "[INFO] Primera ejecución — aplicando baseline..."
        apply_script bootstrap/V001__baseline.js
    fi

    for script in changes/V*.js; do
        [ -e "$script" ] || continue
        file="${script##*/}"
        digits="${file#V}"; digits="${digits%%__*}"
        sequence="$(printf '%s' "$digits" | sed 's/^0*//')"; sequence="${sequence:-0}"
        [ "$sequence" -le "$TARGET_SCHEMA_VERSION" ] || continue
        apply_script "$script"
    done
}

# ══════════════════════════════════════════════════════════════
# INICIO
# ══════════════════════════════════════════════════════════════

# --- Función auxiliar: espera a que mongod acepte conexiones ---
wait_for_mongo() {
    echo "[INFO] Esperando a que MongoDB esté listo..."
    for i in $(seq 1 60); do
        if mongosh --host 127.0.0.1 --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            echo "[INFO] MongoDB listo después de ${i}s."
            return 0
        fi
        sleep 1
    done
    echo "[ERROR] MongoDB no respondió en 60s." >&2
    exit 1
}

# 1. Arranca mongod SIN autenticación para crear el usuario root
echo "[INFO] Iniciando MongoDB (modo bootstrap sin auth)..."
mongod --bind_ip_all &
MONGOD_PID=$!
wait_for_mongo

# 2. Crea el usuario root si no existe
echo "[INFO] Verificando usuario admin..."
mongosh --host 127.0.0.1 --quiet --eval "
    var adminDb = db.getSiblingDB('admin');
    var existing = adminDb.getUser('$MONGO_INITDB_ROOT_USERNAME');
    if (!existing) {
        adminDb.createUser({
            user: '$MONGO_INITDB_ROOT_USERNAME',
            pwd:  '$MONGO_INITDB_ROOT_PASSWORD',
            roles: [{ role: 'root', db: 'admin' }]
        });
        print('[INFO] Usuario admin creado.');
    } else {
        print('[INFO] Usuario admin ya existe — omitido.');
    }
"

# 3. Detiene mongod y lo reinicia CON autenticación
echo "[INFO] Reiniciando MongoDB con autenticación..."
kill $MONGOD_PID
wait $MONGOD_PID 2>/dev/null

mongod --auth --bind_ip_all &
MONGOD_PID=$!
wait_for_mongo

# 4. Reconcilia y verifica según la acción solicitada
action="${1:-init}"
case "$action" in
    reconcile|init|migrate)
        reconcile
        echo "[INFO] Verificando contrato..."
        mongo_run checks/contract.js
        echo "[SUCCESS] MongoDB versión $TARGET_SCHEMA_VERSION lista."
        ;;
    check|verify)
        mongo_run checks/contract.js
        ;;
    *)
        echo "Uso: init | reconcile | verify" >&2
        exit 2
        ;;
esac

# 5. Mantiene el contenedor vivo
wait $MONGOD_PID
