-- =============================================================
-- record-change.sql
-- Registra un cambio de esquema en la tabla de control
-- Proyecto: AVSA Cañete — Equipo 08
--
-- Se ejecuta justo después de cada script de bootstrap/ o
-- changes/ para dejar constancia de qué versión se aplicó,
-- cuándo, y con qué checksum. Así podemos detectar si alguien
-- modifica un script que ya fue ejecutado.
--
-- Variables esperadas (pasadas por el run.sh via entorno):
--   CHANGE_SEQUENCE    — número de secuencia (ej. 1, 2, 3)
--   CHANGE_ID          — nombre del archivo sin extensión
--   CHANGE_CHECKSUM    — sha256 del script aplicado
--   GIT_SHA            — commit de Git en el momento del build
--   RELEASE_VERSION    — etiqueta de la imagen (ej. 1.0)
-- =============================================================
USE avsa_db;
GO

-- Usamos variables de sesión para recibir los valores del shell.
-- El run.sh los inyecta via sqlcmd -v antes de llamar a este script.
INSERT INTO dbo.schema_change (sequence, change_id, checksum, git_sha, release_version, applied_at)
SELECT
    CAST($(CHANGE_SEQUENCE)  AS INT),
    N'$(CHANGE_ID)',
    N'$(CHANGE_CHECKSUM)',
    N'$(GIT_SHA)',
    N'$(RELEASE_VERSION)',
    SYSUTCDATETIME()
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.schema_change WHERE sequence = CAST($(CHANGE_SEQUENCE) AS INT)
);
GO
