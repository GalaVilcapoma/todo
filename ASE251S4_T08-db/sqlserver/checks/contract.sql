-- =============================================================
-- contract.sql
-- Verificación del contrato del esquema avsa_db
-- Proyecto: AVSA Cañete — Equipo 08
--
-- Este script se ejecuta al final de cada reconciliación para
-- confirmar que el esquema quedó exactamente como se esperaba.
-- Si algo falla, el contenedor sale con error y el equipo sabe
-- que hay algo mal antes de que el backend lo descubra.
-- =============================================================
USE avsa_db;
GO

DECLARE @errors INT = 0;

-- Verificamos que la tabla de control de versiones exista
IF OBJECT_ID('dbo.schema_change', 'U') IS NULL
BEGIN
    PRINT '[ERROR] Tabla schema_change no encontrada.';
    SET @errors = @errors + 1;
END
GO

-- Verificamos que las tablas principales del dominio existan
DECLARE @errors INT = 0;

IF OBJECT_ID('dbo.app_users',              'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla app_users.';              SET @errors += 1; END
IF OBJECT_ID('dbo.agrochemical',           'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla agrochemical.';           SET @errors += 1; END
IF OBJECT_ID('dbo.producers',              'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla producers.';              SET @errors += 1; END
IF OBJECT_ID('dbo.fields',                 'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla fields.';                 SET @errors += 1; END
IF OBJECT_ID('dbo.production_lots',        'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla production_lots.';        SET @errors += 1; END
IF OBJECT_ID('dbo.field_applications',     'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla field_applications.';     SET @errors += 1; END
IF OBJECT_ID('dbo.inventory_deliveries',   'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla inventory_deliveries.';   SET @errors += 1; END
IF OBJECT_ID('dbo.alerts',                 'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla alerts.';                 SET @errors += 1; END
IF OBJECT_ID('dbo.audit_logs',             'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla audit_logs.';             SET @errors += 1; END
IF OBJECT_ID('dbo.customer',               'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla customer.';               SET @errors += 1; END
IF OBJECT_ID('dbo.productos',              'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla productos.';              SET @errors += 1; END
IF OBJECT_ID('dbo.customer_orders',        'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla customer_orders.';        SET @errors += 1; END
IF OBJECT_ID('dbo.customer_order_details', 'U') IS NULL BEGIN PRINT '[ERROR] Falta tabla customer_order_details.'; SET @errors += 1; END

-- Verificamos que las vistas estén en pie
IF OBJECT_ID('dbo.vw_pedidos_activos',    'V') IS NULL BEGIN PRINT '[ERROR] Falta vista vw_pedidos_activos.';    SET @errors += 1; END
IF OBJECT_ID('dbo.vw_alertas_pendientes', 'V') IS NULL BEGIN PRINT '[ERROR] Falta vista vw_alertas_pendientes.'; SET @errors += 1; END
IF OBJECT_ID('dbo.vw_aplicaciones_campo', 'V') IS NULL BEGIN PRINT '[ERROR] Falta vista vw_aplicaciones_campo.'; SET @errors += 1; END

-- Verificamos que el seed mínimo esté presente
IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE username = 'admin')
BEGIN
    PRINT '[ERROR] Falta el usuario admin del seed.';
    SET @errors += 1;
END

IF NOT EXISTS (SELECT 1 FROM dbo.agrochemical WHERE senasa_registration_number = 'PQUA-01-2021')
BEGIN
    PRINT '[ERROR] Falta el agroquímico semilla (Confidor).';
    SET @errors += 1;
END

-- Resultado final del contrato
IF @errors = 0
    PRINT '[SUCCESS] Contrato SQL Server verificado — avsa_db está en orden.';
ELSE
BEGIN
    DECLARE @msg NVARCHAR(200) = '[FAILURE] El contrato falló con ' + CAST(@errors AS NVARCHAR) + ' error(es).';
    RAISERROR(@msg, 16, 1);
END
GO
