--liquibase formatted sql
--
-- =============================================================
-- V002__add_audit_indexes.sql — Índices de auditoría y alertas
-- Proyecto: AVSA Cañete — Equipo 08
-- Motor: SQL Server 2022
--
-- Traducción de sqlserver/changes/V002__add_audit_indexes.sql.
-- Índices que surgieron después del baseline, tras medir el
-- rendimiento real de las consultas de auditoría y alertas.
-- =============================================================

-- -----------------------------------------------------------------
-- Cambio V002-01: índices adicionales de auditoría y alertas
-- -----------------------------------------------------------------
--changeset avsa-t08:V002-01
--comment: Índices de auditoría por módulo/fecha, alertas por severidad y aplicaciones por fecha.

CREATE INDEX IX_audit_module_ts
    ON dbo.audit_logs (module, [timestamp] DESC);

CREATE INDEX IX_alerts_severity_status
    ON dbo.alerts (severity, status)
    WHERE active = 1;

CREATE INDEX IX_field_app_date
    ON dbo.field_applications (application_date DESC)
    WHERE active = 1;
--rollback DROP INDEX IX_field_app_date ON dbo.field_applications;
--rollback DROP INDEX IX_alerts_severity_status ON dbo.alerts;
--rollback DROP INDEX IX_audit_module_ts ON dbo.audit_logs;
