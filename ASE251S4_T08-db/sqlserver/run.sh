#!/bin/bash
# =============================================================
# run.sh — Orquestador de migraciones SQL Server
# Proyecto: AVSA Cañete — Equipo 08
#
# Flujo:
#   1. Arranca sqlservr en background
#   2. Espera hasta que el motor acepte conexiones
#   3. Aplica bootstrap (si el esquema está vacío)
#   4. Aplica los cambios de changes/ hasta TARGET_SCHEMA_VERSION
#   5. Registra cada cambio en dbo.schema_change via metadata/
#   6. Ejecuta checks/contract.sql para verificar el contrato
#   7. Mantiene el contenedor vivo (wait)
# =============================================================
set -euo pipefail

# Variables requeridas — el contenedor falla rápido si faltan,
# mejor enterarse en el arranque que después de 10 minutos.
: "${MSSQL_SA_PASSWORD:?Falta MSSQL_SA_PASSWORD}"
: "${GIT_SHA:?Falta GIT_SHA}"
: "${RELEASE_VERSION:?Falta RELEASE_VERSION}"

TARGET_SCHEMA_VERSION="${TARGET_SCHEMA_VERSION:-1}"

# ── Calcula la versión más alta disponible en changes/ ────────
latest_version=1
for candidate in /lab/changes/V*.sql; do
    [ -e "$candidate" ] || continue
    name="${candidate##*/}"
    number="${name#V}"; number="${number%%__*}"
    number="$(printf '%s' "$number" | sed 's/^0*//')"; number="${number:-0}"
    [ "$number" -gt "$latest_version" ] && latest_version="$number"
done

[ "$TARGET_SCHEMA_VERSION" = "latest" ] && TARGET_SCHEMA_VERSION="$latest_version"

# ── Función helper: ejecuta un script .sql con sqlcmd ─────────
sqlcmd() {
    /opt/mssql-tools18/bin/sqlcmd \
        -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C \
        "$@"
}

# ── Función: ¿ya existe la tabla de control? ──────────────────
history_exists() {
    result=$(sqlcmd -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME='schema_change'" -h -1 2>/dev/null | tr -d ' \r\n')
    [ "$result" = "1" ]
}

# ── Función: aplica un script e inmediatamente lo registra ────
apply_script() {
    local script="$1"
    local file="${script##*/}"
    local digits="${file#V}"; digits="${digits%%__*}"
    local sequence
    sequence="$(printf '%s' "$digits" | sed 's/^0*//')"; sequence="${sequence:-0}"
    local checksum
    checksum="$(sha256sum "$script" | awk '{print $1}')"

    # Si ya fue aplicado, solo verificamos que el checksum no cambió
    if history_exists; then
        applied=$(sqlcmd -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM avsa_db.dbo.schema_change WHERE sequence=$sequence" -h -1 2>/dev/null | tr -d ' \r\n')
        if [ "$applied" != "0" ]; then
            stored=$(sqlcmd -Q "SET NOCOUNT ON; SELECT checksum FROM avsa_db.dbo.schema_change WHERE sequence=$sequence" -h -1 2>/dev/null | tr -d ' \r\n')
            if [ "$stored" != "$checksum" ]; then
                echo "[ERROR] Checksum modificado para $file — no se puede continuar." >&2
                exit 3
            fi
            echo "[SKIP] $file ya fue aplicado."
            return
        fi
    fi

    local change_id="${file%.sql}"
    echo "[INFO] Aplicando $change_id ..."
    sqlcmd -i "$script"

    # Registra el cambio en la tabla de control
    export CHANGE_SEQUENCE="$sequence"
    export CHANGE_ID="$change_id"
    export CHANGE_CHECKSUM="$checksum"
    sqlcmd \
        -v CHANGE_SEQUENCE="$sequence" \
        -v CHANGE_ID="$change_id" \
        -v CHANGE_CHECKSUM="$checksum" \
        -v GIT_SHA="$GIT_SHA" \
        -v RELEASE_VERSION="$RELEASE_VERSION" \
        -i /lab/metadata/record-change.sql
    echo "[OK] $change_id aplicado y registrado."
}

# ── Función principal: reconcilia el esquema ──────────────────
reconcile() {
    # Baseline: solo si la tabla de control todavía no existe
    if ! history_exists; then
        echo "[INFO] Primera ejecución — aplicando baseline..."
        apply_script /lab/bootstrap/V001__baseline.sql
    fi

    # Cambios incrementales hasta la versión objetivo
    for script in /lab/changes/V*.sql; do
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

# 1. Arranca SQL Server en segundo plano
echo "[INFO] Iniciando SQL Server..."
/opt/mssql/bin/sqlservr &
MSSQL_PID=$!

# 2. Espera hasta que el motor esté listo para recibir conexiones
echo "[INFO] Esperando a que SQL Server esté listo..."
for i in $(seq 1 60); do
    if sqlcmd -Q "SELECT 1" > /dev/null 2>&1; then
        echo "[INFO] SQL Server listo después de ${i}s."
        break
    fi
    sleep 1
done

# 3. Reconcilia y verifica según la acción solicitada
action="${1:-init}"
case "$action" in
    reconcile|init|migrate)
        reconcile
        echo "[INFO] Verificando contrato..."
        sqlcmd -i /lab/checks/contract.sql
        echo "[SUCCESS] SQL Server versión $TARGET_SCHEMA_VERSION lista."
        ;;
    check|verify)
        sqlcmd -i /lab/checks/contract.sql
        ;;
    *)
        echo "Uso: init | reconcile | verify" >&2
        exit 2
        ;;
esac

# 4. Mantiene el contenedor vivo
wait $MSSQL_PID
