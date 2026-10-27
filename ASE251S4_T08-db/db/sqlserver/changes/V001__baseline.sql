--liquibase formatted sql
--
-- =============================================================
-- V001__baseline.sql — Baseline de avsa_db en formato Liquibase
-- Proyecto: AVSA Cañete — Equipo 08
-- Motor: SQL Server 2022
--
-- Traducción del antiguo sqlserver/bootstrap/V001__baseline.sql a
-- Cada changeset se registra una sola vez en DATABASECHANGELOG, con
-- lo que la idempotencia la garantiza
-- Liquibase (no hacen falta guardas IF NOT EXISTS).
--
-- La tabla de control propia (dbo.schema_change) NO se migra:
-- Liquibase la reemplaza por DATABASECHANGELOG + DATABASECHANGELOGLOCK.
--
-- Se asume que la base avsa_db ya existe (la aprovisiona el
-- compose.yaml antes de ejecutar Liquibase).
-- =============================================================

-- -----------------------------------------------------------------
-- Cambio V001-01: tablas
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-01
--comment: Crear las tablas del dominio AVSA Cañete en orden de dependencia.

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
--rollback DROP TABLE dbo.customer_order_details;
--rollback DROP TABLE dbo.customer_orders;
--rollback DROP TABLE dbo.productos;
--rollback DROP TABLE dbo.customer;
--rollback DROP TABLE dbo.audit_logs;
--rollback DROP TABLE dbo.alerts;
--rollback DROP TABLE dbo.inventory_deliveries;
--rollback DROP TABLE dbo.field_applications;
--rollback DROP TABLE dbo.production_lots;
--rollback DROP TABLE dbo.fields;
--rollback DROP TABLE dbo.producers;
--rollback DROP TABLE dbo.agrochemical;
--rollback DROP TABLE dbo.app_users;

-- -----------------------------------------------------------------
-- Cambio V001-02: constraints (CHECK + FOREIGN KEY)
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-02
--comment: Aplicar CHECK constraints y llaves foráneas del dominio.

ALTER TABLE dbo.app_users ADD CONSTRAINT CK_app_users_role
    CHECK (role IN ('ROLE_ADMIN','ROLE_SUPERVISOR','ROLE_TECHNICIAN','ROLE_LOGISTICS','ROLE_CERTIFICACIONES'));

ALTER TABLE dbo.agrochemical ADD CONSTRAINT CK_agrochemical_category
    CHECK (category IN ('INSECTICIDE','FUNGICIDE','HERBICIDE','FERTILIZER','BIOSTIMULANT','OTHER'));

ALTER TABLE dbo.fields ADD CONSTRAINT FK_fields_producer
    FOREIGN KEY (producer_id) REFERENCES dbo.producers(id);

ALTER TABLE dbo.production_lots ADD CONSTRAINT FK_production_lots_field
    FOREIGN KEY (field_id) REFERENCES dbo.fields(id);

ALTER TABLE dbo.production_lots ADD CONSTRAINT CK_production_lots_status
    CHECK (status IN ('ACTIVE','CLOSED','CANCELLED'));

ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_producer
    FOREIGN KEY (producer_id) REFERENCES dbo.producers(id);

ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_field
    FOREIGN KEY (field_id) REFERENCES dbo.fields(id);

ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_lot
    FOREIGN KEY (lot_id) REFERENCES dbo.production_lots(id);

ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_agrochemical
    FOREIGN KEY (agrochemical_id) REFERENCES dbo.agrochemical(id);

ALTER TABLE dbo.field_applications ADD CONSTRAINT FK_field_app_technician
    FOREIGN KEY (technician_id) REFERENCES dbo.app_users(id);

ALTER TABLE dbo.inventory_deliveries ADD CONSTRAINT FK_inv_del_producer
    FOREIGN KEY (producer_id) REFERENCES dbo.producers(id);

ALTER TABLE dbo.inventory_deliveries ADD CONSTRAINT FK_inv_del_agrochemical
    FOREIGN KEY (agrochemical_id) REFERENCES dbo.agrochemical(id);

ALTER TABLE dbo.inventory_deliveries ADD CONSTRAINT FK_inv_del_responsible
    FOREIGN KEY (responsible_id) REFERENCES dbo.app_users(id);

ALTER TABLE dbo.alerts ADD CONSTRAINT CK_alerts_type
    CHECK (type IN ('NO_APPLICATION_REGISTERED','DOSE_EXCEEDED','LOW_STOCK','SENASA_EXPIRING','SENASA_EXPIRED'));

ALTER TABLE dbo.alerts ADD CONSTRAINT CK_alerts_severity
    CHECK (severity IN ('HIGH','MEDIUM','LOW'));

ALTER TABLE dbo.alerts ADD CONSTRAINT CK_alerts_status
    CHECK (status IN ('PENDING','REVIEWED','DISMISSED'));

ALTER TABLE dbo.customer_orders ADD CONSTRAINT CK_co_estado
    CHECK (estado IN ('PENDIENTE','CONFIRMADO','EN_PROCESO','ENTREGADO','CANCELADO'));

ALTER TABLE dbo.customer_order_details ADD CONSTRAINT FK_cod_order
    FOREIGN KEY (order_id) REFERENCES dbo.customer_orders(id);
--rollback ALTER TABLE dbo.customer_order_details DROP CONSTRAINT FK_cod_order;
--rollback ALTER TABLE dbo.customer_orders DROP CONSTRAINT CK_co_estado;
--rollback ALTER TABLE dbo.alerts DROP CONSTRAINT CK_alerts_status;
--rollback ALTER TABLE dbo.alerts DROP CONSTRAINT CK_alerts_severity;
--rollback ALTER TABLE dbo.alerts DROP CONSTRAINT CK_alerts_type;
--rollback ALTER TABLE dbo.inventory_deliveries DROP CONSTRAINT FK_inv_del_responsible;
--rollback ALTER TABLE dbo.inventory_deliveries DROP CONSTRAINT FK_inv_del_agrochemical;
--rollback ALTER TABLE dbo.inventory_deliveries DROP CONSTRAINT FK_inv_del_producer;
--rollback ALTER TABLE dbo.field_applications DROP CONSTRAINT FK_field_app_technician;
--rollback ALTER TABLE dbo.field_applications DROP CONSTRAINT FK_field_app_agrochemical;
--rollback ALTER TABLE dbo.field_applications DROP CONSTRAINT FK_field_app_lot;
--rollback ALTER TABLE dbo.field_applications DROP CONSTRAINT FK_field_app_field;
--rollback ALTER TABLE dbo.field_applications DROP CONSTRAINT FK_field_app_producer;
--rollback ALTER TABLE dbo.production_lots DROP CONSTRAINT CK_production_lots_status;
--rollback ALTER TABLE dbo.production_lots DROP CONSTRAINT FK_production_lots_field;
--rollback ALTER TABLE dbo.fields DROP CONSTRAINT FK_fields_producer;
--rollback ALTER TABLE dbo.agrochemical DROP CONSTRAINT CK_agrochemical_category;
--rollback ALTER TABLE dbo.app_users DROP CONSTRAINT CK_app_users_role;

-- -----------------------------------------------------------------
-- Cambio V001-03: índices base
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-03
--comment: Crear índices en las columnas de búsqueda frecuente.

CREATE INDEX IX_fields_producer_id ON dbo.fields(producer_id);
CREATE INDEX IX_production_lots_field_id ON dbo.production_lots(field_id);
CREATE INDEX IX_field_app_producer_id ON dbo.field_applications(producer_id);
CREATE INDEX IX_field_app_field_id ON dbo.field_applications(field_id);
CREATE INDEX IX_field_app_lot_id ON dbo.field_applications(lot_id);
CREATE INDEX IX_field_app_agrochemical_id ON dbo.field_applications(agrochemical_id);
CREATE INDEX IX_inv_del_producer_id ON dbo.inventory_deliveries(producer_id);
CREATE INDEX IX_inv_del_agrochemical_id ON dbo.inventory_deliveries(agrochemical_id);
CREATE INDEX IX_alerts_producer_id ON dbo.alerts(producer_id);
CREATE INDEX IX_alerts_status ON dbo.alerts(status);
CREATE INDEX IX_co_customer_id ON dbo.customer_orders(customer_id);
CREATE INDEX IX_co_fecha_pedido ON dbo.customer_orders(fecha_pedido);
CREATE INDEX IX_cod_order_id ON dbo.customer_order_details(order_id);
CREATE INDEX IX_cod_producto_id ON dbo.customer_order_details(producto_id);
--rollback DROP INDEX IX_cod_producto_id ON dbo.customer_order_details;
--rollback DROP INDEX IX_cod_order_id ON dbo.customer_order_details;
--rollback DROP INDEX IX_co_fecha_pedido ON dbo.customer_orders;
--rollback DROP INDEX IX_co_customer_id ON dbo.customer_orders;
--rollback DROP INDEX IX_alerts_status ON dbo.alerts;
--rollback DROP INDEX IX_alerts_producer_id ON dbo.alerts;
--rollback DROP INDEX IX_inv_del_agrochemical_id ON dbo.inventory_deliveries;
--rollback DROP INDEX IX_inv_del_producer_id ON dbo.inventory_deliveries;
--rollback DROP INDEX IX_field_app_agrochemical_id ON dbo.field_applications;
--rollback DROP INDEX IX_field_app_lot_id ON dbo.field_applications;
--rollback DROP INDEX IX_field_app_field_id ON dbo.field_applications;
--rollback DROP INDEX IX_field_app_producer_id ON dbo.field_applications;
--rollback DROP INDEX IX_production_lots_field_id ON dbo.production_lots;
--rollback DROP INDEX IX_fields_producer_id ON dbo.fields;

-- -----------------------------------------------------------------
-- Cambio V001-04: vista vw_pedidos_activos
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-04
--comment: Vista de pedidos activos con total de líneas por orden.

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
--rollback DROP VIEW dbo.vw_pedidos_activos;

-- -----------------------------------------------------------------
-- Cambio V001-05: vista vw_alertas_pendientes
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-05
--comment: Vista de alertas pendientes con datos de productor y agroquímico.

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
--rollback DROP VIEW dbo.vw_alertas_pendientes;

-- -----------------------------------------------------------------
-- Cambio V001-06: vista vw_aplicaciones_campo
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-06
--comment: Vista de aplicaciones de campo con datos completos de trazabilidad.

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
--rollback DROP VIEW dbo.vw_aplicaciones_campo;

-- -----------------------------------------------------------------
-- Cambio V001-07: procedimiento sp_soft_delete
-- Nota: con splitStatements:false → el cuerpo del procedimiento se envía
-- como una sola sentencia (contiene punto y coma internos).
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-07 splitStatements:false
--comment: Procedimiento genérico de eliminación lógica (soft delete).

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
--rollback DROP PROCEDURE dbo.sp_soft_delete;

-- -----------------------------------------------------------------
-- Cambio V001-08: procedimiento sp_restore
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-08 splitStatements:false
--comment: Procedimiento genérico de restauración lógica.

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
--rollback DROP PROCEDURE dbo.sp_restore;

-- -----------------------------------------------------------------
-- Cambio V001-09: procedimiento sp_resumen_pedidos_cliente
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-09 splitStatements:false
--comment: Resumen de pedidos agrupados por estado para un cliente.

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
--rollback DROP PROCEDURE dbo.sp_resumen_pedidos_cliente;

-- -----------------------------------------------------------------
-- Cambio V001-10: datos semilla (app_users, agrochemical, producers, fields)
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-10
--comment: Insertar datos semilla de usuarios, agroquímicos, productores y campos.

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

INSERT INTO dbo.agrochemical (commercial_name, active_ingredient, category, senasa_registration_number, registration_expiry, max_dose, waiting_period_days, manufacturer, active, created_at) VALUES
('Confidor 350 SC',    'Imidacloprid 35%',                        'INSECTICIDE', 'PQUA-01-2021', '2027-06-15', 0.8000, 14, 'Bayer CropScience', 1, SYSUTCDATETIME()),
('Amistar Top',        'Azoxystrobin 20% + Difenoconazol 12.5%',  'FUNGICIDE',   'PQUA-02-2021', '2027-08-20', 1.0000, 21, 'Syngenta',          1, SYSUTCDATETIME()),
('Roundup Max',        'Glifosato 74.7%',                         'HERBICIDE',   'PQUA-03-2020', '2026-12-31', 2.5000, 15, 'Bayer CropScience', 1, SYSUTCDATETIME()),
('Karate Zeon',        'Lambda-Cihalotrina 5%',                   'INSECTICIDE', 'PQUA-04-2022', '2028-03-10', 1.5000,  7, 'Syngenta',          1, SYSUTCDATETIME()),
('Bayfolan Forte',     'NPK + Microelementos',                    'FERTILIZER',  'PQUA-05-2021', '2027-05-01', 5.0000,  0, 'Bayer CropScience', 1, SYSUTCDATETIME()),
('Score 250 EC',       'Difenoconazol 25%',                       'FUNGICIDE',   'PQUA-06-2021', '2026-09-15', 0.5000, 14, 'Syngenta',          1, SYSUTCDATETIME()),
('Fusilade Forte',     'Fluazifop-p-butil 12.5%',                 'HERBICIDE',   'PQUA-07-2022', '2026-08-10', 1.5000, 30, 'Syngenta',          1, SYSUTCDATETIME()),
('Wuxal Calcio-Boro',  'Calcio 7% + Boro 0.5%',                   'FERTILIZER',  'PQUA-08-2022', '2028-11-30', 3.0000,  0, 'COMPO Expert',      1, SYSUTCDATETIME()),
('Dipel DF',           'Bacillus thuringiensis var. kurstaki 54%','INSECTICIDE', 'PQUA-09-2023', '2027-09-12', 1.0000,  0, 'Sumitomo Chemical', 1, SYSUTCDATETIME()),
('Kocide 2000',        'Hidróxido de cobre 53.8%',                'FUNGICIDE',   'PQUA-10-2021', '2026-06-30', 2.0000,  7, 'FMC Corporation',   1, SYSUTCDATETIME()),
('Progibb 40 SG',      'Ácido Giberélico 40%',                    'BIOSTIMULANT','PQUA-11-2023', '2028-04-15', 0.0200,  0, 'Valent BioSciences',1, SYSUTCDATETIME()),
('Stomp Aqua',         'Pendimetalina 45.5%',                     'HERBICIDE',   'PQUA-12-2022', '2027-01-20', 3.5000, 45, 'BASF',              1, SYSUTCDATETIME()),
('Vertimec 1.8 EC',    'Abamectina 1.8%',                         'INSECTICIDE', 'PQUA-13-2022', '2027-10-05', 1.0000,  7, 'Syngenta',          1, SYSUTCDATETIME()),
('Sulpomag',           'Sulfato de potasio y magnesio 22-11',     'FERTILIZER',  'PQUA-14-2023', '2029-07-31', 8.0000,  0, 'K+S Minerals',      1, SYSUTCDATETIME()),
('Trichoderma Mix',    'Trichoderma harzianum + asperellum',      'BIOSTIMULANT','PQUA-15-2023', '2029-01-15', 2.0000,  0, 'BioAgro Peru',      1, SYSUTCDATETIME());

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
--rollback DELETE FROM dbo.fields;
--rollback DELETE FROM dbo.producers;
--rollback DELETE FROM dbo.agrochemical;
--rollback DELETE FROM dbo.app_users;

-- -----------------------------------------------------------------
-- Cambio V001-11: datos semilla (production_lots, field_applications, alerts, audit_logs)
-- -----------------------------------------------------------------
--changeset avsa-t08:V001-11
--comment: Insertar datos semilla de lotes, aplicaciones, alertas y auditoría.

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
--rollback DELETE FROM dbo.audit_logs;
--rollback DELETE FROM dbo.alerts;
--rollback DELETE FROM dbo.field_applications;
--rollback DELETE FROM dbo.production_lots;
