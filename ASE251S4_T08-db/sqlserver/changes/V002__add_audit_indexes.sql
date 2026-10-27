-- =============================================================
-- V002__add_audit_indexes.sql
-- Índices adicionales sobre audit_logs y alertas
-- Proyecto: AVSA Cañete — Equipo 08
--
-- Este cambio agrega índices que surgieron después del baseline
-- inicial, una vez que se midió el rendimiento real de las
-- consultas de auditoría y alertas en el entorno de pruebas.
-- =============================================================
USE avsa_db;
GO

-- Búsquedas frecuentes de auditoría por módulo y timestamp
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_audit_module_ts')
    CREATE INDEX IX_audit_module_ts
        ON dbo.audit_logs (module, [timestamp] DESC);
GO

-- Consultas de alertas por severidad para el dashboard de SENASA
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_alerts_severity_status')
    CREATE INDEX IX_alerts_severity_status
        ON dbo.alerts (severity, status)
        WHERE active = 1;
GO

-- Historial de aplicaciones por fecha para reportes mensuales
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_field_app_date')
    CREATE INDEX IX_field_app_date
        ON dbo.field_applications (application_date DESC)
        WHERE active = 1;
GO

PRINT '[SUCCESS] V002 — índices de auditoría y alertas aplicados.';
GO
