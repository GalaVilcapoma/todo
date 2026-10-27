-- =============================================================
-- V001__baseline.sql
-- Baseline completo de la base de datos avsa_db
-- Proyecto: AVSA Cañete — Equipo 08
-- Motor: SQL Server 2022
--
-- Este script es la "fotografía inicial" del esquema. Se ejecuta
-- una sola vez cuando el contenedor arranca por primera vez con
-- el volumen vacío. Incluye: base de datos, schemas, tablas,
-- constraints, índices, vistas, procedimientos y datos semilla.
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. BASE DE DATOS
-- ──────────────────────────────────────────────────────────────
IF DB_ID(N'avsa_db') IS NULL
BEGIN
    EXEC(N'CREATE DATABASE [avsa_db]');
    PRINT '[INFO] Base de datos avsa_db creada.';
END
ELSE
    PRINT '[INFO] Base de datos avsa_db ya existía — se omite creación.';
GO

USE avsa_db;
GO
SET NOCOUNT ON;
GO

-- ──────────────────────────────────────────────────────────────
-- 2. SCHEMAS
-- El proyecto usa dbo por defecto. Se registra como punto
-- de documentación formal del equipo.
-- ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dbo')
BEGIN
    EXEC('CREATE SCHEMA dbo');
    PRINT '[INFO] Schema dbo creado.';
END
ELSE
    PRINT '[INFO] Schema dbo ya existe.';
GO

-- ──────────────────────────────────────────────────────────────
-- 3. TABLAS
-- Se crean en orden de dependencia: primero las independientes,
-- luego las que referencian a otras con FK.
-- ──────────────────────────────────────────────────────────────

-- Usuarios del sistema con roles definidos
IF OBJECT_ID('dbo.app_users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.app_users (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        username      NVARCHAR(50)  NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name     NVARCHAR(200) NOT NULL,
        email         NVARCHAR(100) NOT NULL UNIQUE,
        role          NVARCHAR(30)  NOT NULL,
        active        BIT           NOT NULL DEFAULT 1,
        last_login    DATETIME2     NULL,
        created_at    DATETIME2     NULL,
        updated_at    DATETIME2     NULL,
        deleted_at    DATETIME2     NULL,
        restored_at   DATETIME2     NULL
    );
    PRINT '[INFO] Tabla app_users creada.';
END
GO

-- Agroquímicos registrados ante SENASA
IF OBJECT_ID('dbo.agrochemical', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.agrochemical (
        id                         BIGINT IDENTITY(1,1) PRIMARY KEY,
        commercial_name            NVARCHAR(200) NOT NULL,
        active_ingredient          NVARCHAR(200) NOT NULL,
        category                   NVARCHAR(50)  NOT NULL,
        senasa_registration_number NVARCHAR(50)  NULL,
        registration_expiry        DATE          NOT NULL,
        max_dose                   DECIMAL(10,4) NOT NULL,
        waiting_period_days        INT           NOT NULL,
        manufacturer               NVARCHAR(200) NULL,
        active                     BIT           NOT NULL DEFAULT 1,
        created_at                 DATETIME2     NULL,
        updated_at                 DATETIME2     NULL,
        deleted_at                 DATETIME2     NULL,
        restored_at                DATETIME2     NULL
    );
    PRINT '[INFO] Tabla agrochemical creada.';
END
GO

-- Productores agrícolas del valle de Cañete
IF OBJECT_ID('dbo.producers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.producers (
        id          BIGINT IDENTITY(1,1) PRIMARY KEY,
        full_name   NVARCHAR(200) NOT NULL,
        dni         NVARCHAR(20)  NOT NULL UNIQUE,
        phone       NVARCHAR(20)  NULL,
        email       NVARCHAR(100) NULL,
        location    NVARCHAR(200) NOT NULL,
        district    NVARCHAR(100) NULL,
        province    NVARCHAR(100) NULL,
        region      NVARCHAR(100) NULL,
        active      BIT           NOT NULL DEFAULT 1,
        qr_token    NVARCHAR(100) NULL UNIQUE,
        created_at  DATETIME2     NULL,
        updated_at  DATETIME2     NULL,
        deleted_at  DATETIME2     NULL,
        restored_at DATETIME2     NULL
    );
    PRINT '[INFO] Tabla producers creada.';
END
GO

-- Parcelas y campos de cada productor
IF OBJECT_ID('dbo.fields', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.fields (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        producer_id   BIGINT        NOT NULL,
        name          NVARCHAR(150) NOT NULL,
        area_hectares FLOAT         NOT NULL,
        active_crop   NVARCHAR(100) NOT NULL,
        location      NVARCHAR(200) NULL,
        active        BIT           NOT NULL DEFAULT 1,
        qr_token      NVARCHAR(100) NULL UNIQUE,
        created_at    DATETIME2     NULL,
        updated_at    DATETIME2     NULL,
        deleted_at    DATETIME2     NULL,
        restored_at   DATETIME2     NULL
    );
    PRINT '[INFO] Tabla fields creada.';
END
GO

-- Lotes de producción por campo y campaña
IF OBJECT_ID('dbo.production_lots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.production_lots (
        id           BIGINT IDENTITY(1,1) PRIMARY KEY,
        field_id     BIGINT        NOT NULL,
        code         NVARCHAR(50)  NOT NULL UNIQUE,
        start_date   DATE          NOT NULL,
        end_date     DATE          NULL,
        crop         NVARCHAR(100) NOT NULL,
        status       NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
        observations NVARCHAR(500) NULL,
        active       BIT           NOT NULL DEFAULT 1,
        created_at   DATETIME2     NULL,
        updated_at   DATETIME2     NULL,
        deleted_at   DATETIME2     NULL,
        restored_at  DATETIME2     NULL
    );
    PRINT '[INFO] Tabla production_lots creada.';
END
GO

-- Registro de aplicaciones de agroquímicos en campo (trazabilidad SENASA)
IF OBJECT_ID('dbo.field_applications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.field_applications (
        id               BIGINT IDENTITY(1,1) PRIMARY KEY,
        producer_id      BIGINT        NOT NULL,
        field_id         BIGINT        NOT NULL,
        lot_id           BIGINT        NOT NULL,
        agrochemical_id  BIGINT        NOT NULL,
        dose             FLOAT         NOT NULL,
        dose_unit        NVARCHAR(30)  NOT NULL,
        application_date DATE          NOT NULL,
        technician_id    BIGINT        NOT NULL,
        observations     NVARCHAR(500) NULL,
        senasa_valid     BIT           NULL,
        dose_exceeded    BIT           NULL,
        active           BIT           NOT NULL DEFAULT 1,
        created_at       DATETIME2     NULL,
        updated_at       DATETIME2     NULL,
        deleted_at       DATETIME2     NULL,
        restored_at      DATETIME2     NULL
    );
    PRINT '[INFO] Tabla field_applications creada.';
END
GO

-- Movimientos de entrega de agroquímicos a productores
IF OBJECT_ID('dbo.inventory_deliveries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.inventory_deliveries (
        id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
        producer_id        BIGINT        NOT NULL,
        agrochemical_id    BIGINT        NOT NULL,
        quantity_delivered FLOAT         NOT NULL,
        unit               NVARCHAR(30)  NOT NULL,
        delivery_date      DATE          NOT NULL,
        responsible_id     BIGINT        NOT NULL,
        observations       NVARCHAR(500) NULL,
        active             BIT           NOT NULL DEFAULT 1,
        created_at         DATETIME2     NULL,
        deleted_at         DATETIME2     NULL,
        restored_at        DATETIME2     NULL
    );
    PRINT '[INFO] Tabla inventory_deliveries creada.';
END
GO

-- Alertas de cumplimiento SENASA (vencimientos, dosis, stock)
IF OBJECT_ID('dbo.alerts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.alerts (
        id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
        type               NVARCHAR(50)  NOT NULL,
        severity           NVARCHAR(10)  NOT NULL,
        title              NVARCHAR(200) NOT NULL,
        description        NVARCHAR(500) NOT NULL,
        producer_id        BIGINT        NULL,
        field_id           BIGINT        NULL,
        agrochemical_id    BIGINT        NULL,
        status             NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
        reviewed_by        NVARCHAR(100) NULL,
        review_observation NVARCHAR(500) NULL,
        reviewed_at        DATETIME2     NULL,
        active             BIT           NOT NULL DEFAULT 1,
        created_at         DATETIME2     NULL,
        deleted_at         DATETIME2     NULL,
        restored_at        DATETIME2     NULL
    );
    PRINT '[INFO] Tabla alerts creada.';
END
GO

-- Auditoría de todas las acciones del sistema
IF OBJECT_ID('dbo.audit_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.audit_logs (
        id          BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id     BIGINT         NOT NULL,
        user_name   NVARCHAR(100)  NOT NULL,
        action      NVARCHAR(100)  NOT NULL,
        module      NVARCHAR(50)   NOT NULL,
        entity_id   BIGINT         NULL,
        details     NVARCHAR(1000) NULL,
        ip_address  NVARCHAR(50)   NULL,
        [timestamp] DATETIME2      NOT NULL,
        active      BIT            NOT NULL DEFAULT 1,
        deleted_at  DATETIME2      NULL,
        restored_at DATETIME2      NULL
    );
    PRINT '[INFO] Tabla audit_logs creada.';
END
GO

-- Clientes / distribuidores (referencia lógica al _id de MongoDB)
-- customer_id en transacciones apunta al ObjectId de MongoDB
IF OBJECT_ID('dbo.customer', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customer (
        id                 BIGINT IDENTITY(1,1) PRIMARY KEY,
        codigo             NVARCHAR(50)  NOT NULL UNIQUE,
        razon_social       NVARCHAR(200) NOT NULL,
        ruc                NVARCHAR(20)  NULL,
        tipo_documento     NVARCHAR(30)  NOT NULL,
        numero_documento   NVARCHAR(50)  NOT NULL,
        pais               NVARCHAR(100) NOT NULL,
        ciudad             NVARCHAR(100) NULL,
        direccion          NVARCHAR(200) NULL,
        telefono           NVARCHAR(30)  NULL,
        email              NVARCHAR(100) NULL,
        contacto_principal NVARCHAR(150) NULL,
        tipo_cliente       NVARCHAR(30)  NOT NULL,
        active             BIT           NOT NULL DEFAULT 1,
        created_at         DATETIME2     NULL,
        updated_at         DATETIME2     NULL,
        deleted_at         DATETIME2     NULL,
        restored_at        DATETIME2     NULL
    );
    PRINT '[INFO] Tabla customer creada.';
END
GO

-- Inventario de productos agrícolas
IF OBJECT_ID('dbo.productos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.productos (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        codigo          NVARCHAR(50)  NOT NULL UNIQUE,
        nombre          NVARCHAR(200) NOT NULL,
        descripcion     NVARCHAR(500) NULL,
        categoria       NVARCHAR(50)  NOT NULL,
        unidad_medida   NVARCHAR(30)  NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        stock_actual    INT           NOT NULL DEFAULT 0,
        stock_minimo    INT           NOT NULL DEFAULT 0,
        origen          NVARCHAR(200) NOT NULL,
        estado          BIT           NOT NULL DEFAULT 1,
        created_at      DATETIME2     NULL,
        updated_at      DATETIME2     NULL,
        deleted_at      DATETIME2     NULL,
        restored_at     DATETIME2     NULL
    );
    PRINT '[INFO] Tabla productos creada.';
END
GO

-- Pedidos de clientes — cabecera
-- customer_id es NVARCHAR porque referencia el ObjectId de MongoDB
IF OBJECT_ID('dbo.customer_orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customer_orders (
        id                     BIGINT IDENTITY(1,1) PRIMARY KEY,
        numero_pedido          NVARCHAR(50)  NOT NULL UNIQUE,
        customer_id            NVARCHAR(50)  NOT NULL,
        customer_razon_social  NVARCHAR(200) NOT NULL DEFAULT '',
        fecha_pedido           DATE          NOT NULL,
        fecha_entrega_estimada DATE          NULL,
        estado                 NVARCHAR(30)  NOT NULL DEFAULT 'CONFIRMADO',
        observaciones          NVARCHAR(500) NULL,
        subtotal               DECIMAL(12,2) NOT NULL DEFAULT 0,
        igv                    DECIMAL(12,2) NOT NULL DEFAULT 0,
        total                  DECIMAL(12,2) NOT NULL DEFAULT 0,
        active                 BIT           NOT NULL DEFAULT 1,
        created_at             DATETIME2     NULL,
        updated_at             DATETIME2     NULL
    );
    PRINT '[INFO] Tabla customer_orders creada.';
END
GO

-- Detalle de pedidos — líneas de cada orden
-- producto_id es NVARCHAR porque referencia el ObjectId de MongoDB
IF OBJECT_ID('dbo.customer_order_details', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customer_order_details (
        id                     BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id               BIGINT        NOT NULL,
        producto_id            NVARCHAR(50)  NOT NULL,
        producto_nombre        NVARCHAR(200) NOT NULL DEFAULT '',
        producto_unidad_medida NVARCHAR(30)  NOT NULL DEFAULT '',
        cantidad               INT           NOT NULL,
        precio_unitario        DECIMAL(10,2) NOT NULL,
        subtotal               DECIMAL(12,2) NOT NULL,
        observacion            NVARCHAR(300) NULL,
        created_at             DATETIME2     NULL
    );
    PRINT '[INFO] Tabla customer_order_details creada.';
END
GO

-- ──────────────────────────────────────────────────────────────
-- 4. CONSTRAINTS
-- FK y CHECK se agregan después de crear todas las tablas
-- para evitar dependencias circulares durante la creación.
-- ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_app_users_role')
    ALTER TABLE dbo.app_users ADD CONSTRAINT CK_app_users_role
        CHECK (role IN ('ROLE_ADMIN','ROLE_SUPERVISOR','ROLE_TECHNICIAN','ROLE_LOGISTICS','ROLE_CERTIFICACIONES'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_agrochemical_category')
    ALTER TABLE dbo.agrochemical ADD CONSTRAINT CK_agrochemical_category
        CHECK (category IN ('INSECTICIDE','FUNGICIDE','HERBICIDE','FERTILIZER','BIOSTIMULANT','OTHER'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_fields_producer')
    ALTER TABLE dbo.fields ADD CONSTRAINT FK_fields_producer
        FOREIGN KEY (producer_id) REFERENCES dbo.producers(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_production_lots_field')
    ALTER TABLE dbo.production_lots ADD CONSTRAINT FK_production_lots_field
        FOREIGN KEY (field_id) REFERENCES dbo.fields(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_production_lots_status')
    ALTER TABLE dbo.production_lots ADD CONSTRAINT CK_production_lots_status
        CHECK (status IN ('ACTIVE','CLOSED','CANCELLED'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_field_app_producer')
    ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_producer
        FOREIGN KEY (producer_id) REFERENCES dbo.producers(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_field_app_field')
    ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_field
        FOREIGN KEY (field_id) REFERENCES dbo.fields(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_field_app_lot')
    ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_lot
        FOREIGN KEY (lot_id) REFERENCES dbo.production_lots(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_field_app_agrochemical')
    ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_agrochemical
        FOREIGN KEY (agrochemical_id) REFERENCES dbo.agrochemical(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_field_app_technician')
    ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_technician
        FOREIGN KEY (technician_id) REFERENCES dbo.app_users(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_inv_del_producer')
    ALTER TABLE dbo.inventory_deliveries ADD CONSTRAINT FK_inv_del_producer
        FOREIGN KEY (producer_id) REFERENCES dbo.producers(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_inv_del_agrochemical')
    ALTER TABLE dbo.inventory_deliveries ADD CONSTRAINT FK_inv_del_agrochemical
        FOREIGN KEY (agrochemical_id) REFERENCES dbo.agrochemical(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_inv_del_responsible')
    ALTER TABLE dbo.inventory_deliveries ADD CONSTRAINT FK_inv_del_responsible
        FOREIGN KEY (responsible_id) REFERENCES dbo.app_users(id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_alerts_type')
    ALTER TABLE dbo.alerts ADD CONSTRAINT CK_alerts_type
        CHECK (type IN ('NO_APPLICATION_REGISTERED','DOSE_EXCEEDED','LOW_STOCK','SENASA_EXPIRING','SENASA_EXPIRED'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_alerts_severity')
    ALTER TABLE dbo.alerts ADD CONSTRAINT CK_alerts_severity
        CHECK (severity IN ('HIGH','MEDIUM','LOW'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_alerts_status')
    ALTER TABLE dbo.alerts ADD CONSTRAINT CK_alerts_status
        CHECK (status IN ('PENDING','REVIEWED','DISMISSED'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_co_estado')
    ALTER TABLE dbo.customer_orders ADD CONSTRAINT CK_co_estado
        CHECK (estado IN ('PENDIENTE','CONFIRMADO','EN_PROCESO','ENTREGADO','CANCELADO'));
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_cod_order')
    ALTER TABLE dbo.customer_order_details ADD CONSTRAINT FK_cod_order
        FOREIGN KEY (order_id) REFERENCES dbo.customer_orders(id);
GO

PRINT '[INFO] Constraints aplicados correctamente.';
GO

-- ──────────────────────────────────────────────────────────────
-- 5. ÍNDICES
-- Se crean después de los constraints para que SQL Server
-- los pueda reusar en la validación de FK.
-- ──────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_fields_producer_id')
    CREATE INDEX IX_fields_producer_id ON dbo.fields(producer_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_production_lots_field_id')
    CREATE INDEX IX_production_lots_field_id ON dbo.production_lots(field_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_field_app_producer_id')
    CREATE INDEX IX_field_app_producer_id ON dbo.field_applications(producer_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_field_app_field_id')
    CREATE INDEX IX_field_app_field_id ON dbo.field_applications(field_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_field_app_lot_id')
    CREATE INDEX IX_field_app_lot_id ON dbo.field_applications(lot_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_field_app_agrochemical_id')
    CREATE INDEX IX_field_app_agrochemical_id ON dbo.field_applications(agrochemical_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_inv_del_producer_id')
    CREATE INDEX IX_inv_del_producer_id ON dbo.inventory_deliveries(producer_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_inv_del_agrochemical_id')
    CREATE INDEX IX_inv_del_agrochemical_id ON dbo.inventory_deliveries(agrochemical_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_alerts_producer_id')
    CREATE INDEX IX_alerts_producer_id ON dbo.alerts(producer_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_alerts_status')
    CREATE INDEX IX_alerts_status ON dbo.alerts(status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_co_customer_id')
    CREATE INDEX IX_co_customer_id ON dbo.customer_orders(customer_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_co_fecha_pedido')
    CREATE INDEX IX_co_fecha_pedido ON dbo.customer_orders(fecha_pedido);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_cod_order_id')
    CREATE INDEX IX_cod_order_id ON dbo.customer_order_details(order_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_cod_producto_id')
    CREATE INDEX IX_cod_producto_id ON dbo.customer_order_details(producto_id);
GO

PRINT '[INFO] Índices creados correctamente.';
GO

-- ──────────────────────────────────────────────────────────────
-- 6. VISTAS
-- ──────────────────────────────────────────────────────────────

-- Pedidos activos con total de líneas por orden
IF OBJECT_ID('dbo.vw_pedidos_activos', 'V') IS NOT NULL
    DROP VIEW dbo.vw_pedidos_activos;
GO

CREATE VIEW dbo.vw_pedidos_activos AS
SELECT
    co.id,
    co.numero_pedido,
    co.customer_id,
    co.customer_razon_social,
    co.fecha_pedido,
    co.estado,
    co.subtotal,
    co.igv,
    co.total,
    co.created_at,
    COUNT(cod.id) AS total_lineas
FROM dbo.customer_orders co
LEFT JOIN dbo.customer_order_details cod ON cod.order_id = co.id
WHERE co.active = 1
GROUP BY
    co.id, co.numero_pedido, co.customer_id, co.customer_razon_social,
    co.fecha_pedido, co.estado, co.subtotal, co.igv, co.total, co.created_at;
GO

-- Alertas pendientes con datos del productor y agroquímico
IF OBJECT_ID('dbo.vw_alertas_pendientes', 'V') IS NOT NULL
    DROP VIEW dbo.vw_alertas_pendientes;
GO

CREATE VIEW dbo.vw_alertas_pendientes AS
SELECT
    a.id,
    a.type        AS tipo,
    a.severity    AS severidad,
    a.title       AS titulo,
    a.status      AS estado,
    a.created_at,
    p.full_name   AS productor,
    p.district    AS distrito,
    ag.commercial_name AS agroquimico
FROM dbo.alerts a
LEFT JOIN dbo.producers    p  ON p.id  = a.producer_id
LEFT JOIN dbo.agrochemical ag ON ag.id = a.agrochemical_id
WHERE a.status = 'PENDING' AND a.active = 1;
GO

-- Aplicaciones de campo con datos completos para reportes de trazabilidad
IF OBJECT_ID('dbo.vw_aplicaciones_campo', 'V') IS NOT NULL
    DROP VIEW dbo.vw_aplicaciones_campo;
GO

CREATE VIEW dbo.vw_aplicaciones_campo AS
SELECT
    fa.id,
    fa.application_date,
    fa.dose,
    fa.dose_unit,
    fa.senasa_valid,
    fa.dose_exceeded,
    p.full_name        AS productor,
    f.name             AS campo,
    pl.code            AS lote,
    ag.commercial_name AS agroquimico,
    u.full_name        AS tecnico
FROM dbo.field_applications fa
JOIN dbo.producers       p  ON p.id  = fa.producer_id
JOIN dbo.fields          f  ON f.id  = fa.field_id
JOIN dbo.production_lots pl ON pl.id = fa.lot_id
JOIN dbo.agrochemical    ag ON ag.id = fa.agrochemical_id
JOIN dbo.app_users       u  ON u.id  = fa.technician_id
WHERE fa.active = 1;
GO

PRINT '[INFO] Vistas creadas correctamente.';
GO

-- ──────────────────────────────────────────────────────────────
-- 7. STORED PROCEDURES
-- ──────────────────────────────────────────────────────────────

-- Eliminación lógica genérica para cualquier tabla que tenga active + deleted_at
IF OBJECT_ID('dbo.sp_soft_delete', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_soft_delete;
GO

CREATE PROCEDURE dbo.sp_soft_delete
    @table NVARCHAR(128),
    @id    BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'UPDATE ' + QUOTENAME(@table) +
               N' SET active = 0, deleted_at = SYSUTCDATETIME(), restored_at = NULL' +
               N' WHERE id = @id;';
    EXEC sp_executesql @sql, N'@id BIGINT', @id;
END
GO

-- Restauración lógica genérica
IF OBJECT_ID('dbo.sp_restore', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_restore;
GO

CREATE PROCEDURE dbo.sp_restore
    @table NVARCHAR(128),
    @id    BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'UPDATE ' + QUOTENAME(@table) +
               N' SET active = 1, restored_at = SYSUTCDATETIME(), deleted_at = NULL' +
               N' WHERE id = @id;';
    EXEC sp_executesql @sql, N'@id BIGINT', @id;
END
GO

-- Resumen de pedidos agrupados por estado para un cliente
IF OBJECT_ID('dbo.sp_resumen_pedidos_cliente', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_resumen_pedidos_cliente;
GO

CREATE PROCEDURE dbo.sp_resumen_pedidos_cliente
    @customer_id NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        estado,
        COUNT(*)          AS total_pedidos,
        SUM(total)        AS monto_total,
        MIN(fecha_pedido) AS primer_pedido,
        MAX(fecha_pedido) AS ultimo_pedido
    FROM dbo.customer_orders
    WHERE customer_id = @customer_id AND active = 1
    GROUP BY estado
    ORDER BY total_pedidos DESC;
END
GO

PRINT '[INFO] Stored procedures creados correctamente.';
GO

-- ──────────────────────────────────────────────────────────────
-- 8. TABLA DE CONTROL DE VERSIONES
-- Registra cada cambio aplicado para que el sistema sepa
-- hasta qué versión del esquema está el contenedor.
-- ──────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.schema_change', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.schema_change (
        sequence        INT           NOT NULL PRIMARY KEY,
        change_id       NVARCHAR(120) NOT NULL UNIQUE,
        checksum        NVARCHAR(64)  NOT NULL,
        git_sha         NVARCHAR(40)  NOT NULL,
        release_version NVARCHAR(30)  NOT NULL,
        applied_at      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );
    PRINT '[INFO] Tabla schema_change creada.';
END
GO

-- ──────────────────────────────────────────────────────────────
-- 9. DATOS SEMILLA (seed)
-- Datos mínimos para que el sistema arranque con información
-- útil desde el primer contenedor. Cada bloque es idempotente.
-- ──────────────────────────────────────────────────────────────

-- Usuarios del sistema — 15 registros (todos los roles representados)
IF NOT EXISTS (SELECT 1 FROM dbo.app_users)
BEGIN
    INSERT INTO dbo.app_users (username, password_hash, full_name, email, role, active, created_at) VALUES
    ('admin',        'admin123',        'Carlos Mendoza Ríos',      'admin@avsa.pe',          'ROLE_ADMIN',           1, SYSUTCDATETIME()),
    ('supervisor1',  'supervisor1123',  'María Elena Torres',       'mtorres@avsa.pe',        'ROLE_SUPERVISOR',      1, SYSUTCDATETIME()),
    ('tech_juan',    'tech_juan123',    'Juan Pérez Castro',        'jperez@avsa.pe',         'ROLE_TECHNICIAN',      1, SYSUTCDATETIME()),
    ('tech_rosa',    'tech_rosa123',    'Rosa Huamán Valdez',       'rhuaman@avsa.pe',        'ROLE_TECHNICIAN',      1, SYSUTCDATETIME()),
    ('logistica1',   'logistica1123',   'Pedro García Flores',      'pgarcia@avsa.pe',        'ROLE_LOGISTICS',       1, SYSUTCDATETIME()),
    ('cert_ana',     'cert_ana123',     'Ana Quispe Rojas',         'aquispe@avsa.pe',        'ROLE_CERTIFICACIONES', 1, SYSUTCDATETIME()),
    ('supervisor2',  'supervisor2123',  'Luis Vargas Condori',      'lvargas@avsa.pe',        'ROLE_SUPERVISOR',      1, SYSUTCDATETIME()),
    ('tech_carlos',  'tech_carlos123',  'Carlos Ramos Soto',        'cramos@avsa.pe',         'ROLE_TECHNICIAN',      1, SYSUTCDATETIME()),
    ('tech_diana',   'tech_diana123',   'Diana Lozano Paredes',     'dlozano@avsa.pe',        'ROLE_TECHNICIAN',      1, SYSUTCDATETIME()),
    ('logistica2',   'logistica2123',   'Fernando Chávez Ríos',     'fchavez@avsa.pe',        'ROLE_LOGISTICS',       1, SYSUTCDATETIME()),
    ('cert_jorge',   'cert_jorge123',   'Jorge Salinas Medina',     'jsalinas@avsa.pe',       'ROLE_CERTIFICACIONES', 1, SYSUTCDATETIME()),
    ('tech_marco',   'tech_marco123',   'Marco Quispe Flores',      'mquispe@avsa.pe',        'ROLE_TECHNICIAN',      1, SYSUTCDATETIME()),
    ('supervisor3',  'supervisor3123',  'Sandra Villanueva Cruz',   'svillanueva@avsa.pe',    'ROLE_SUPERVISOR',      1, SYSUTCDATETIME()),
    ('tech_lucia',   'tech_lucia123',   'Lucía Mamani Turpo',       'lmamani@avsa.pe',        'ROLE_TECHNICIAN',      1, SYSUTCDATETIME()),
    ('logistica3',   'logistica3123',   'Raúl Espinoza Castro',     'respinoza@avsa.pe',      'ROLE_LOGISTICS',       1, SYSUTCDATETIME());
    PRINT '[INFO] app_users: 15 registros insertados.';
END
ELSE PRINT '[INFO] app_users ya tiene datos — seed omitido.';
GO

-- Agroquímicos registrados en SENASA — 15 registros (todas las categorías)
IF NOT EXISTS (SELECT 1 FROM dbo.agrochemical)
BEGIN
    INSERT INTO dbo.agrochemical (commercial_name, active_ingredient, category, senasa_registration_number, registration_expiry, max_dose, waiting_period_days, manufacturer, active, created_at) VALUES
    ('Confidor 350 SC',    'Imidacloprid 35%',                        'INSECTICIDE', 'PQUA-01-2021', '2027-06-15', 0.8000, 14, 'Bayer CropScience', 1, SYSUTCDATETIME()),
    ('Amistar Top',        'Azoxystrobin 20% + Difenoconazol 12.5%',  'FUNGICIDE',   'PQUA-02-2021', '2027-08-20', 1.0000, 21, 'Syngenta',          1, SYSUTCDATETIME()),
    ('Roundup Max',        'Glifosato 74.7%',                         'HERBICIDE',   'PQUA-03-2020', '2026-12-31', 2.5000, 15, 'Bayer CropScience', 1, SYSUTCDATETIME()),
    ('Karate Zeon',        'Lambda-Cihalotrina 5%',                   'INSECTICIDE', 'PQUA-04-2022', '2028-03-10', 1.5000,  7, 'Syngenta',          1, SYSUTCDATETIME()),
    ('Bayfolan Forte',     'NPK + Microelementos',                    'FERTILIZER',  'PQUA-05-2021', '2027-05-01', 5.0000,  0, 'Bayer CropScience', 1, SYSUTCDATETIME()),
    ('Score 250 EC',       'Difenoconazol 25%',                       'FUNGICIDE',   'PQUA-06-2021', '2026-09-15', 0.5000, 14, 'Syngenta',          1, SYSUTCDATETIME()),
    ('Fusilade Forte',     'Fluazifop-p-butil 12.5%',                 'HERBICIDE',   'PQUA-07-2022', '2026-08-10', 1.5000, 30, 'Syngenta',          1, SYSUTCDATETIME()),
    ('Wuxal Calcio-Boro',  'Calcio 7% + Boro 0.5%',                  'FERTILIZER',  'PQUA-08-2022', '2028-11-30', 3.0000,  0, 'COMPO Expert',      1, SYSUTCDATETIME()),
    ('Dipel DF',           'Bacillus thuringiensis var. kurstaki 54%','INSECTICIDE', 'PQUA-09-2023', '2027-09-12', 1.0000,  0, 'Sumitomo Chemical', 1, SYSUTCDATETIME()),
    ('Kocide 2000',        'Hidróxido de cobre 53.8%',                'FUNGICIDE',   'PQUA-10-2021', '2026-06-30', 2.0000,  7, 'FMC Corporation',   1, SYSUTCDATETIME()),
    ('Progibb 40 SG',      'Ácido Giberélico 40%',                   'BIOSTIMULANT','PQUA-11-2023', '2028-04-15', 0.0200,  0, 'Valent BioSciences',1, SYSUTCDATETIME()),
    ('Stomp Aqua',         'Pendimetalina 45.5%',                     'HERBICIDE',   'PQUA-12-2022', '2027-01-20', 3.5000, 45, 'BASF',              1, SYSUTCDATETIME()),
    ('Vertimec 1.8 EC',    'Abamectina 1.8%',                        'INSECTICIDE', 'PQUA-13-2022', '2027-10-05', 1.0000,  7, 'Syngenta',          1, SYSUTCDATETIME()),
    ('Sulpomag',           'Sulfato de potasio y magnesio 22-11',     'FERTILIZER',  'PQUA-14-2023', '2029-07-31', 8.0000,  0, 'K+S Minerals',      1, SYSUTCDATETIME()),
    ('Trichoderma Mix',    'Trichoderma harzianum + asperellum',      'BIOSTIMULANT','PQUA-15-2023', '2029-01-15', 2.0000,  0, 'BioAgro Peru',      1, SYSUTCDATETIME());
    PRINT '[INFO] agrochemical: 15 registros insertados.';
END
ELSE PRINT '[INFO] agrochemical ya tiene datos — seed omitido.';
GO

-- Productores del valle de Cañete — 15 registros (distritos variados)
IF NOT EXISTS (SELECT 1 FROM dbo.producers)
BEGIN
    INSERT INTO dbo.producers (full_name, dni, phone, email, location, district, province, region, active, qr_token, created_at) VALUES
    ('Roberto Sánchez Luján',      '45678901', '956123456', 'rsanchez@gmail.com',    'Fundo Santa Rosa Km 5',       'San Vicente', 'Cañete', 'Lima', 1, 'QR-PROD-001', SYSUTCDATETIME()),
    ('María Flores Huamán',        '45678902', '956123457', 'mflores@gmail.com',     'Parcela 12 Valle Cañete',     'Imperial',    'Cañete', 'Lima', 1, 'QR-PROD-002', SYSUTCDATETIME()),
    ('José Luis Quispe Mamani',    '45678903', '956123458', 'jquispe@gmail.com',     'Fundo La Esperanza',          'Lunahuaná',   'Cañete', 'Lima', 1, 'QR-PROD-003', SYSUTCDATETIME()),
    ('Ana Lucía Ramos Torres',     '45678904', '956234567', 'aramos@gmail.com',      'Fundo El Paraíso Sector 3',   'Mala',        'Cañete', 'Lima', 1, 'QR-PROD-004', SYSUTCDATETIME()),
    ('Pedro Castillo Vargas',      '45678905', '956345678', 'pcastillo@gmail.com',   'Terrenos Quilmaná Norte',     'Quilmaná',    'Cañete', 'Lima', 1, 'QR-PROD-005', SYSUTCDATETIME()),
    ('Luz Marina Condori Apaza',   '45678906', '956456789', 'lcondori@gmail.com',    'Fundo Los Alamos Km 12',      'San Vicente', 'Cañete', 'Lima', 1, 'QR-PROD-006', SYSUTCDATETIME()),
    ('Hernán Villanueva Paucar',   '45678907', '956567890', 'hvillanueva@gmail.com', 'Parcela Señor de los Milagros','Cerro Azul',  'Cañete', 'Lima', 1, 'QR-PROD-007', SYSUTCDATETIME()),
    ('Carmen Rosa Tello Medina',   '45678908', '956678901', 'ctello@gmail.com',      'Predio Rustico Valle Verde',  'Imperial',    'Cañete', 'Lima', 1, 'QR-PROD-008', SYSUTCDATETIME()),
    ('Alfredo Mendoza Palomino',   '45678909', '956789012', 'amendoza@gmail.com',    'Fundo San José Sector A',     'Lunahuaná',   'Cañete', 'Lima', 1, 'QR-PROD-009', SYSUTCDATETIME()),
    ('Silvia Patricia Inca Rojas', '45678910', '956890123', 'sinca@gmail.com',       'Predio Bella Vista Km 8',     'Mala',        'Cañete', 'Lima', 1, 'QR-PROD-010', SYSUTCDATETIME()),
    ('Orlando Chávez Huanca',      '45678911', '956901234', 'ochavez@gmail.com',     'Terrenos La Victoria',        'Quilmaná',    'Cañete', 'Lima', 1, 'QR-PROD-011', SYSUTCDATETIME()),
    ('Beatriz Lozano Ccama',       '45678912', '957012345', 'blozano@gmail.com',     'Fundo San Miguel Lote 5',     'San Vicente', 'Cañete', 'Lima', 1, 'QR-PROD-012', SYSUTCDATETIME()),
    ('Segundo Ramírez Flores',     '45678913', '957123456', 'sramirez@gmail.com',    'Parcela Los Cipreses',        'Cerro Azul',  'Cañete', 'Lima', 1, 'QR-PROD-013', SYSUTCDATETIME()),
    ('Norma Gutiérrez Sucari',     '45678914', '957234567', 'ngutierrez@gmail.com',  'Fundo La Merced Km 3',        'Imperial',    'Cañete', 'Lima', 1, 'QR-PROD-014', SYSUTCDATETIME()),
    ('Víctor Hugo Mamani Cruz',    '45678915', '957345678', 'vmamani@gmail.com',     'Predio El Mirador',           'Lunahuaná',   'Cañete', 'Lima', 1, 'QR-PROD-015', SYSUTCDATETIME());
    PRINT '[INFO] producers: 15 registros insertados.';
END
ELSE PRINT '[INFO] producers ya tiene datos — seed omitido.';
GO

-- Campos / parcelas — 15 registros (distribuidos entre los 15 productores)
IF NOT EXISTS (SELECT 1 FROM dbo.fields)
BEGIN
    INSERT INTO dbo.fields (producer_id, name, area_hectares, active_crop, location, active, qr_token, created_at) VALUES
    (1,  'Parcela Norte Santa Rosa',    5.5, 'Mandarina', 'Fundo Santa Rosa - Sector Norte',    1, 'QR-FLD-001', SYSUTCDATETIME()),
    (2,  'Campo Principal Valle',       8.0, 'Uva',       'Parcela 12 - Central',               1, 'QR-FLD-002', SYSUTCDATETIME()),
    (3,  'Terreno La Esperanza',        4.5, 'Espárrago', 'Fundo La Esperanza Lote 1',          1, 'QR-FLD-003', SYSUTCDATETIME()),
    (4,  'Parcela Sur El Paraíso',      6.0, 'Mango',     'Fundo El Paraíso - Sur',             1, 'QR-FLD-004', SYSUTCDATETIME()),
    (5,  'Campo Quilmaná Norte',        7.5, 'Maíz',      'Quilmaná Norte Km 14',               1, 'QR-FLD-005', SYSUTCDATETIME()),
    (6,  'Parcela Los Alamos A',        3.8, 'Limón',     'Los Alamos Sector A',                1, 'QR-FLD-006', SYSUTCDATETIME()),
    (7,  'Predio Señor de los Milagros',5.0, 'Palta',     'Cerro Azul - Predio Central',        1, 'QR-FLD-007', SYSUTCDATETIME()),
    (8,  'Campo Valle Verde Este',      9.2, 'Uva',       'Valle Verde - Sector Este',          1, 'QR-FLD-008', SYSUTCDATETIME()),
    (9,  'Fundo San José Lote A',       4.0, 'Mandarina', 'San José Lunahuaná - Lote A',        1, 'QR-FLD-009', SYSUTCDATETIME()),
    (10, 'Predio Bella Vista Mala',     6.5, 'Camote',    'Bella Vista Km 8 - Sector 2',        1, 'QR-FLD-010', SYSUTCDATETIME()),
    (11, 'Terrenos La Victoria Sur',    3.5, 'Espárrago', 'La Victoria Quilmaná - Sur',         1, 'QR-FLD-011', SYSUTCDATETIME()),
    (12, 'Parcela San Miguel 5',        5.0, 'Granada',   'San Miguel San Vicente - Lote 5',    1, 'QR-FLD-012', SYSUTCDATETIME()),
    (13, 'Campo Los Cipreses',          4.8, 'Mandarina', 'Los Cipreses Cerro Azul',            1, 'QR-FLD-013', SYSUTCDATETIME()),
    (14, 'Fundo La Merced B',           7.0, 'Mango',     'La Merced Imperial - Sector B',      1, 'QR-FLD-014', SYSUTCDATETIME()),
    (15, 'Predio El Mirador Alto',      3.2, 'Palta',     'El Mirador Lunahuaná - Alto',        1, 'QR-FLD-015', SYSUTCDATETIME());
    PRINT '[INFO] fields: 15 registros insertados.';
END
ELSE PRINT '[INFO] fields ya tiene datos — seed omitido.';
GO

-- Lotes de producción — 15 registros (distintos estados y cultivos)
IF NOT EXISTS (SELECT 1 FROM dbo.production_lots)
BEGIN
    INSERT INTO dbo.production_lots (field_id, code, start_date, crop, status, observations, active, created_at) VALUES
    (1,  'LOT-2026-001', '2026-01-15', 'Mandarina', 'ACTIVE',    'Temporada principal mandarina Satsuma',          1, SYSUTCDATETIME()),
    (2,  'LOT-2026-002', '2026-02-01', 'Uva',       'ACTIVE',    'Temporada uva Red Globe exportación',            1, SYSUTCDATETIME()),
    (3,  'LOT-2026-003', '2026-02-10', 'Espárrago', 'CLOSED',    'Campaña espárrago finalizada',                   1, SYSUTCDATETIME()),
    (4,  'LOT-2026-004', '2026-01-20', 'Mango',     'ACTIVE',    'Primera campaña mango Kent temporada 2026',      1, SYSUTCDATETIME()),
    (5,  'LOT-2026-005', '2026-03-01', 'Maíz',      'ACTIVE',    'Siembra maíz morado temporada otoño',            1, SYSUTCDATETIME()),
    (6,  'LOT-2026-006', '2026-01-10', 'Limón',     'ACTIVE',    'Campaña limón sutil primer semestre',            1, SYSUTCDATETIME()),
    (7,  'LOT-2026-007', '2025-11-01', 'Palta',     'CLOSED',    'Campaña palta Hass cerrada — exportación USA',   1, SYSUTCDATETIME()),
    (8,  'LOT-2026-008', '2026-02-15', 'Uva',       'ACTIVE',    'Uva Thompson para mercado asiático',             1, SYSUTCDATETIME()),
    (9,  'LOT-2026-009', '2026-01-25', 'Mandarina', 'ACTIVE',    'Segunda parcela mandarina Satsuma',              1, SYSUTCDATETIME()),
    (10, 'LOT-2026-010', '2026-02-20', 'Camote',    'ACTIVE',    'Camote morado orgánico primer lote',             1, SYSUTCDATETIME()),
    (11, 'LOT-2026-011', '2026-03-05', 'Espárrago', 'ACTIVE',    'Nueva campaña espárrago verde Quilmaná',         1, SYSUTCDATETIME()),
    (12, 'LOT-2026-012', '2026-01-30', 'Granada',   'ACTIVE',    'Primera campaña granada Wonderful',              1, SYSUTCDATETIME()),
    (13, 'LOT-2026-013', '2026-02-05', 'Mandarina', 'ACTIVE',    'Lote mandarina Cerro Azul temporada alta',       1, SYSUTCDATETIME()),
    (14, 'LOT-2026-014', '2026-01-18', 'Mango',     'CANCELLED', 'Cancelado por plaga — se replantará en julio',   1, SYSUTCDATETIME()),
    (15, 'LOT-2026-015', '2026-02-28', 'Palta',     'ACTIVE',    'Nuevo lote palta Fuerte en terreno El Mirador',  1, SYSUTCDATETIME());
    PRINT '[INFO] production_lots: 15 registros insertados.';
END
ELSE PRINT '[INFO] production_lots ya tiene datos — seed omitido.';
GO

-- Aplicaciones de campo — 15 registros (distintos agroquímicos y técnicos)
IF NOT EXISTS (SELECT 1 FROM dbo.field_applications)
BEGIN
    INSERT INTO dbo.field_applications (producer_id, field_id, lot_id, agrochemical_id, dose, dose_unit, application_date, technician_id, observations, senasa_valid, dose_exceeded, active, created_at) VALUES
    (1,  1,  1,  1,  0.40, 'L/ha', '2026-02-10', 3,  'Aplicación preventiva contra pulgones en mandarina',         1, 0, 1, SYSUTCDATETIME()),
    (2,  2,  2,  2,  0.80, 'L/ha', '2026-03-01', 4,  'Tratamiento fungicida preventivo en uva Red Globe',           1, 0, 1, SYSUTCDATETIME()),
    (3,  3,  3,  4,  0.30, 'L/ha', '2026-03-05', 3,  'Control de gusano cogollero en espárrago',                    1, 0, 1, SYSUTCDATETIME()),
    (4,  4,  4,  4,  3.50, 'Kg/ha','2026-02-12', 8,  'Fertilización potásica en llenado de fruto mango',            1, 0, 1, SYSUTCDATETIME()),
    (5,  5,  5,  3,  2.00, 'L/ha', '2026-03-10', 12, 'Control de malezas gramíneas en maíz morado',                 1, 0, 1, SYSUTCDATETIME()),
    (6,  6,  6,  1,  0.35, 'L/ha', '2026-02-20', 9,  'Tratamiento contra minador de hojas en limón sutil',          1, 0, 1, SYSUTCDATETIME()),
    (2,  8,  8,  6,  0.75, 'L/ha', '2026-02-25', 4,  'Preventivo botritis antes de floración uva Thompson',         1, 0, 1, SYSUTCDATETIME()),
    (1,  1,  1,  13, 0.90, 'L/ha', '2026-03-08', 3,  'Acaricida preventivo arañita roja en mandarina',              1, 0, 1, SYSUTCDATETIME()),
    (4,  4,  4,  1,  0.90, 'L/ha', '2026-03-12', 8,  'Dosis EXCEDIDA detectada por app — revisar con técnico',      0, 1, 1, SYSUTCDATETIME()),
    (9,  9,  9,  2,  0.70, 'L/ha', '2026-03-15', 14, 'Aplicación fungicida en segunda parcela mandarina',            1, 0, 1, SYSUTCDATETIME()),
    (10, 10, 10, 8,  2.50, 'Kg/ha','2026-03-18', 12, 'Fertilización foliar calcio-boro en camote morado',            1, 0, 1, SYSUTCDATETIME()),
    (11, 11, 11, 7,  1.20, 'L/ha', '2026-03-20', 9,  'Herbicida selectivo para gramíneas en espárrago Quilmaná',    1, 0, 1, SYSUTCDATETIME()),
    (12, 12, 12, 11, 0.01, 'Kg/ha','2026-03-22', 14, 'Aplicación regulador de crecimiento granada en cuajado',       1, 0, 1, SYSUTCDATETIME()),
    (13, 13, 13, 9,  0.80, 'L/ha', '2026-03-25', 3,  'Control lepidópteros biológico Bt en mandarina Cerro Azul',   1, 0, 1, SYSUTCDATETIME()),
    (15, 15, 15, 4,  4.00, 'Kg/ha','2026-03-28', 8,  'Fertilización potásica palta Fuerte en cuajado de fruto',     1, 0, 1, SYSUTCDATETIME());
    PRINT '[INFO] field_applications: 15 registros insertados.';
END
ELSE PRINT '[INFO] field_applications ya tiene datos — seed omitido.';
GO

-- Alertas del sistema — 15 registros (distintos tipos, severidades y estados)
IF NOT EXISTS (SELECT 1 FROM dbo.alerts)
BEGIN
    INSERT INTO dbo.alerts (type, severity, title, description, producer_id, field_id, agrochemical_id, status, active, created_at) VALUES
    ('SENASA_EXPIRING',         'MEDIUM', 'Registro SENASA por vencer — Roundup Max',         'Registro PQUA-03-2020 vence el 2026-12-31. Iniciar trámite de renovación.',              NULL, NULL, 3,    'PENDING',   1, SYSUTCDATETIME()),
    ('LOW_STOCK',               'HIGH',   'Stock crítico — Karate Zeon',                       'Quedan menos de 2 L en almacén. Solicitar reposición urgente.',                         NULL, NULL, 4,    'PENDING',   1, SYSUTCDATETIME()),
    ('DOSE_EXCEEDED',           'HIGH',   'Dosis excedida — Confidor en Fundo El Paraíso',     'Técnico aplicó 0.90 L/ha. Máximo SENASA es 0.80 L/ha. Revisar trazabilidad.',           4,    4,    1,    'REVIEWED',  1, SYSUTCDATETIME()),
    ('SENASA_EXPIRING',         'MEDIUM', 'Registro SENASA por vencer — Score 250 EC',         'Registro PQUA-06-2021 vence el 2026-09-15. Restan menos de 6 meses.',                   NULL, NULL, 6,    'PENDING',   1, SYSUTCDATETIME()),
    ('SENASA_EXPIRED',          'HIGH',   'Registro VENCIDO — Kocide 2000',                   'Registro PQUA-10-2021 venció el 2026-06-30. No debe aplicarse hasta renovar.',           NULL, NULL, 10,   'PENDING',   1, SYSUTCDATETIME()),
    ('NO_APPLICATION_REGISTERED','LOW',   'Sin aplicaciones en campo — Lote LOT-2026-014',    'Lote cancelado por plaga. No se registró ninguna aplicación de control.',               4,    4,    NULL, 'DISMISSED', 1, SYSUTCDATETIME()),
    ('LOW_STOCK',               'MEDIUM', 'Stock bajo — Score 250 EC',                        'Solo quedan 5 L de Score 250 EC. Revisar calendario de aplicaciones próximas.',          NULL, NULL, 6,    'PENDING',   1, SYSUTCDATETIME()),
    ('DOSE_EXCEEDED',           'HIGH',   'Dosis excedida — Fusilade en campo Quilmaná',      'Aplicación supera máximo permitido para espárrago. Notificar a SENASA.',                5,    5,    7,    'PENDING',   1, SYSUTCDATETIME()),
    ('SENASA_EXPIRING',         'LOW',    'Registro por vencer — Fusilade Forte',             'Registro PQUA-07-2022 vence el 2026-08-10. Pendiente de renovación.',                   NULL, NULL, 7,    'PENDING',   1, SYSUTCDATETIME()),
    ('LOW_STOCK',               'HIGH',   'Stock crítico — Amistar Top',                      'Solo quedan 1.5 L disponibles. Insuficiente para la campaña de uva en curso.',           NULL, NULL, 2,    'PENDING',   1, SYSUTCDATETIME()),
    ('NO_APPLICATION_REGISTERED','MEDIUM','Sin fumigación registrada — Parcela Norte (LOT-001)','Llevan 45 días sin registro de aplicación. Verificar con técnico asignado.',           1,    1,    NULL, 'REVIEWED',  1, SYSUTCDATETIME()),
    ('SENASA_EXPIRED',          'HIGH',   'Registro VENCIDO — Fusilade Forte',               'Registro PQUA-07-2022 ya venció. Suspender uso inmediato hasta renovación.',             NULL, NULL, 7,    'PENDING',   1, SYSUTCDATETIME()),
    ('DOSE_EXCEEDED',           'MEDIUM', 'Posible exceso — Progibb 40 en granada',           'Dosis registrada cerca del límite máximo SENASA. Monitorear cultivo.',                  12,   12,   11,   'PENDING',   1, SYSUTCDATETIME()),
    ('LOW_STOCK',               'LOW',    'Stock moderado — Dipel DF',                       'Stock actual 3 Kg. Suficiente para esta campaña pero solicitar pronto.',                  NULL, NULL, 9,    'DISMISSED', 1, SYSUTCDATETIME()),
    ('NO_APPLICATION_REGISTERED','HIGH',  'Lote palta sin tratamiento preventivo — Lote-015','El lote LOT-2026-015 inició hace 30 días sin aplicación fungicida preventiva.',          15,   15,   NULL, 'PENDING',   1, SYSUTCDATETIME());
    PRINT '[INFO] alerts: 15 registros insertados.';
END
ELSE PRINT '[INFO] alerts ya tiene datos — seed omitido.';
GO

-- Entradas de auditoría — 15 registros (acciones variadas de distintos usuarios)
IF NOT EXISTS (SELECT 1 FROM dbo.audit_logs)
BEGIN
    INSERT INTO dbo.audit_logs (user_id, user_name, action, module, entity_id, details, ip_address, [timestamp], active) VALUES
    (1,  'admin',        'CREATE', 'AGROCHEMICAL',  1,  'Creación de Confidor 350 SC en catálogo SENASA',              '192.168.1.10', SYSUTCDATETIME(), 1),
    (2,  'supervisor1',  'CREATE', 'PRODUCER',      1,  'Registro de productor Roberto Sánchez Luján',                 '192.168.1.20', SYSUTCDATETIME(), 1),
    (3,  'tech_juan',    'CREATE', 'FIELD_APP',     1,  'Aplicación Confidor 350 SC en mandarina Parcela Norte',       '192.168.1.30', SYSUTCDATETIME(), 1),
    (4,  'tech_rosa',    'CREATE', 'FIELD_APP',     2,  'Aplicación Amistar Top en uva Red Globe Valle',               '192.168.1.31', SYSUTCDATETIME(), 1),
    (5,  'logistica1',   'CREATE', 'DELIVERY',      1,  'Entrega 10 L Confidor a productor Roberto Sánchez',           '192.168.1.40', SYSUTCDATETIME(), 1),
    (6,  'cert_ana',     'CREATE', 'AGROCHEMICAL',  15, 'Alta de Trichoderma Mix al registro SENASA',                  '192.168.1.50', SYSUTCDATETIME(), 1),
    (7,  'supervisor2',  'CREATE', 'PRODUCER',      5,  'Alta de Pedro Castillo Vargas productor Quilmaná',            '192.168.1.21', SYSUTCDATETIME(), 1),
    (2,  'supervisor1',  'UPDATE', 'ALERT',         3,  'Alerta DOSE_EXCEEDED marcada como revisada — Fundo Paraíso',  '192.168.1.20', SYSUTCDATETIME(), 1),
    (8,  'tech_carlos',  'CREATE', 'FIELD_APP',     4,  'Fertilización potásica mango El Paraíso lote 2026-004',       '192.168.1.32', SYSUTCDATETIME(), 1),
    (1,  'admin',        'UPDATE', 'AGROCHEMICAL',  10, 'Kocide 2000 marcado como vencido en catálogo',                '192.168.1.10', SYSUTCDATETIME(), 1),
    (10, 'logistica2',   'CREATE', 'DELIVERY',      5,  'Entrega 5 Kg Sulpomag a productor Pedro Castillo',            '192.168.1.41', SYSUTCDATETIME(), 1),
    (13, 'supervisor3',  'CREATE', 'LOT',           12, 'Apertura lote LOT-2026-012 para campaña granada',             '192.168.1.22', SYSUTCDATETIME(), 1),
    (9,  'tech_diana',   'CREATE', 'FIELD_APP',     6,  'Herbicida Fusilade en espárrago campo Quilmaná Norte',        '192.168.1.33', SYSUTCDATETIME(), 1),
    (11, 'cert_jorge',   'UPDATE', 'AGROCHEMICAL',  7,  'Notificación vencimiento próximo Fusilade Forte registrada',  '192.168.1.51', SYSUTCDATETIME(), 1),
    (3,  'tech_juan',    'CREATE', 'FIELD_APP',     13, 'Control biológico Dipel DF en mandarina Cerro Azul',          '192.168.1.30', SYSUTCDATETIME(), 1);
    PRINT '[INFO] audit_logs: 15 registros insertados.';
END
ELSE PRINT '[INFO] audit_logs ya tiene datos — seed omitido.';
GO

PRINT '[SUCCESS] Baseline V001 ejecutado correctamente — avsa_db lista.';
GO
