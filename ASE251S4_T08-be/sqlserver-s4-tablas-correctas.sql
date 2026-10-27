-- ============================================================
-- AVSA Database: avsa_db (SQL Server 2022)
-- Orden: Base de datos → Tablas → Defaults → Stored Procs → Seed → SELECT
-- ============================================================

USE avsa_db;
GO

-- ============================================================
-- 1. TABLAS
-- ============================================================

IF OBJECT_ID('dbo.app_users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.app_users (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        username      NVARCHAR(50)  NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name     NVARCHAR(200) NOT NULL,
        email         NVARCHAR(100) NOT NULL UNIQUE,
        role          NVARCHAR(30)  NOT NULL,
        active        BIT           NOT NULL,
        last_login    DATETIME2     NULL,
        created_at    DATETIME2     NULL,
        updated_at    DATETIME2     NULL,
        deleted_at    DATETIME2     NULL,
        restored_at   DATETIME2     NULL,
        CONSTRAINT CK_app_users_role
            CHECK (role IN ('ROLE_ADMIN','ROLE_SUPERVISOR','ROLE_TECHNICIAN','ROLE_LOGISTICS','ROLE_CERTIFICACIONES'))
    );
END
GO

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
        active                     BIT           NOT NULL,
        created_at                 DATETIME2     NULL,
        updated_at                 DATETIME2     NULL,
        deleted_at                 DATETIME2     NULL,
        restored_at                DATETIME2     NULL,
        CONSTRAINT CK_agrochemical_category
            CHECK (category IN ('INSECTICIDE','FUNGICIDE','HERBICIDE','FERTILIZER','BIOSTIMULANT','OTHER'))
    );
END
GO

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
        active      BIT           NOT NULL,
        qr_token    NVARCHAR(100) NULL UNIQUE,
        created_at  DATETIME2     NULL,
        updated_at  DATETIME2     NULL,
        deleted_at  DATETIME2     NULL,
        restored_at DATETIME2     NULL
    );
END
GO

IF OBJECT_ID('dbo.fields', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.fields (
        id             BIGINT        NOT NULL PRIMARY KEY,
        producer_id    BIGINT        NOT NULL,
        name           NVARCHAR(150) NOT NULL,
        area_hectares  FLOAT         NOT NULL,
        active_crop    NVARCHAR(100) NOT NULL,
        location       NVARCHAR(200) NULL,
        active         BIT           NOT NULL,
        qr_token       NVARCHAR(100) NULL UNIQUE,
        created_at     DATETIME2     NULL,
        updated_at     DATETIME2     NULL,
        deleted_at     DATETIME2     NULL,
        restored_at    DATETIME2     NULL,
        CONSTRAINT FK_fields_producer FOREIGN KEY (producer_id) REFERENCES dbo.producers(id)
    );
    CREATE INDEX IX_fields_producer_id ON dbo.fields(producer_id);
END
GO

IF OBJECT_ID('dbo.production_lots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.production_lots (
        id           BIGINT IDENTITY(1,1) PRIMARY KEY,
        field_id     BIGINT        NOT NULL,
        code         NVARCHAR(50)  NOT NULL UNIQUE,
        start_date   DATE          NOT NULL,
        end_date     DATE          NULL,
        crop         NVARCHAR(100) NOT NULL,
        status       NVARCHAR(20)  NOT NULL,
        observations NVARCHAR(500) NULL,
        active       BIT           NOT NULL,
        created_at   DATETIME2     NULL,
        updated_at   DATETIME2     NULL,
        deleted_at   DATETIME2     NULL,
        restored_at  DATETIME2     NULL,
        CONSTRAINT FK_production_lots_field   FOREIGN KEY (field_id) REFERENCES dbo.fields(id),
        CONSTRAINT CK_production_lots_status  CHECK (status IN ('ACTIVE','CLOSED','CANCELLED'))
    );
    CREATE INDEX IX_production_lots_field_id ON dbo.production_lots(field_id);
END
GO

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
        active           BIT           NOT NULL,
        created_at       DATETIME2     NULL,
        updated_at       DATETIME2     NULL,
        deleted_at       DATETIME2     NULL,
        restored_at      DATETIME2     NULL,
        CONSTRAINT FK_field_applications_producer     FOREIGN KEY (producer_id)     REFERENCES dbo.producers(id),
        CONSTRAINT FK_field_applications_field        FOREIGN KEY (field_id)        REFERENCES dbo.fields(id),
        CONSTRAINT FK_field_applications_lot          FOREIGN KEY (lot_id)          REFERENCES dbo.production_lots(id),
        CONSTRAINT FK_field_applications_agrochemical FOREIGN KEY (agrochemical_id) REFERENCES dbo.agrochemical(id),
        CONSTRAINT FK_field_applications_technician   FOREIGN KEY (technician_id)   REFERENCES dbo.app_users(id)
    );
END
GO

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
        active             BIT           NOT NULL,
        created_at         DATETIME2     NULL,
        deleted_at         DATETIME2     NULL,
        restored_at        DATETIME2     NULL,
        CONSTRAINT FK_inventory_deliveries_producer     FOREIGN KEY (producer_id)     REFERENCES dbo.producers(id),
        CONSTRAINT FK_inventory_deliveries_agrochemical FOREIGN KEY (agrochemical_id) REFERENCES dbo.agrochemical(id),
        CONSTRAINT FK_inventory_deliveries_responsible  FOREIGN KEY (responsible_id)  REFERENCES dbo.app_users(id)
    );
END
GO

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
        status             NVARCHAR(20)  NOT NULL,
        reviewed_by        NVARCHAR(100) NULL,
        review_observation NVARCHAR(500) NULL,
        reviewed_at        DATETIME2     NULL,
        active             BIT           NOT NULL,
        created_at         DATETIME2     NULL,
        deleted_at         DATETIME2     NULL,
        restored_at        DATETIME2     NULL,
        CONSTRAINT FK_alerts_producer     FOREIGN KEY (producer_id)     REFERENCES dbo.producers(id),
        CONSTRAINT FK_alerts_field        FOREIGN KEY (field_id)        REFERENCES dbo.fields(id),
        CONSTRAINT FK_alerts_agrochemical FOREIGN KEY (agrochemical_id) REFERENCES dbo.agrochemical(id),
        CONSTRAINT CK_alerts_type     CHECK (type     IN ('NO_APPLICATION_REGISTERED','DOSE_EXCEEDED','LOW_STOCK','SENASA_EXPIRING','SENASA_EXPIRED')),
        CONSTRAINT CK_alerts_severity CHECK (severity IN ('HIGH','MEDIUM','LOW')),
        CONSTRAINT CK_alerts_status   CHECK (status   IN ('PENDING','REVIEWED','DISMISSED'))
    );
END
GO

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
        active      BIT            NOT NULL,
        deleted_at  DATETIME2      NULL,
        restored_at DATETIME2      NULL
    );
END
GO

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
        active             BIT           NOT NULL,
        created_at         DATETIME2     NULL,
        updated_at         DATETIME2     NULL,
        deleted_at         DATETIME2     NULL,
        restored_at        DATETIME2     NULL
    );
END
GO

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
        stock_actual    INT           NOT NULL,
        stock_minimo    INT           NOT NULL,
        origen          NVARCHAR(200) NOT NULL,
        estado          BIT           NOT NULL,
        created_at      DATETIME2     NULL,
        updated_at      DATETIME2     NULL,
        deleted_at      DATETIME2     NULL,
        restored_at     DATETIME2     NULL
    );
END
GO

IF OBJECT_ID('dbo.ventas', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ventas (
        id         BIGINT IDENTITY(1,1) PRIMARY KEY,
        cliente_id BIGINT        NOT NULL,
        fecha      DATETIME2     NOT NULL,
        subtotal   DECIMAL(12,2) NOT NULL,
        total      DECIMAL(12,2) NOT NULL,
        created_at DATETIME2     NULL,
        CONSTRAINT FK_ventas_cliente FOREIGN KEY (cliente_id) REFERENCES dbo.customer(id)
    );
    CREATE INDEX IX_ventas_cliente_id ON dbo.ventas(cliente_id);
END
GO

IF OBJECT_ID('dbo.venta_detalles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.venta_detalles (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        venta_id        BIGINT        NOT NULL,
        producto_id     BIGINT        NOT NULL,
        cantidad        INT           NOT NULL,
        precio_unitario DECIMAL(12,2) NOT NULL,
        subtotal        DECIMAL(12,2) NOT NULL,
        CONSTRAINT FK_venta_detalles_venta    FOREIGN KEY (venta_id)    REFERENCES dbo.ventas(id),
        CONSTRAINT FK_venta_detalles_producto FOREIGN KEY (producto_id) REFERENCES dbo.productos(id)
    );
END
GO

IF OBJECT_ID('dbo.productores', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.productores (
        id                  BIGINT IDENTITY(1,1) PRIMARY KEY,
        nombre_completo     NVARCHAR(255) NULL,
        dni                 NVARCHAR(255) NULL,
        telefono            NVARCHAR(255) NULL,
        correo              NVARCHAR(255) NULL,
        ubicacion           NVARCHAR(255) NULL,
        distrito            NVARCHAR(255) NULL,
        estado              BIT           NULL,
        fecha_creacion      DATETIME2     NULL,
        fecha_actualizacion DATETIME2     NULL,
        fecha_eliminacion   DATETIME2     NULL,
        fecha_restauracion  DATETIME2     NULL,
        active              BIT           NOT NULL,
        deleted_at          DATETIME2     NULL,
        restored_at         DATETIME2     NULL
    );
END
GO

IF OBJECT_ID('dbo.customer_orders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customer_orders (
        id                     BIGINT IDENTITY(1,1) PRIMARY KEY,
        numero_pedido          NVARCHAR(50)  NOT NULL UNIQUE,
        customer_id            BIGINT        NOT NULL,
        fecha_pedido           DATE          NOT NULL,
        fecha_entrega_estimada DATE          NULL,
        estado                 NVARCHAR(30)  NOT NULL DEFAULT 'PENDIENTE',
        observaciones          NVARCHAR(500) NULL,
        subtotal               DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        igv                    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total                  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        active                 BIT           NOT NULL DEFAULT 1,
        created_at             DATETIME2     NULL,
        updated_at             DATETIME2     NULL,
        CONSTRAINT FK_co_customer FOREIGN KEY (customer_id) REFERENCES dbo.customer(id),
        CONSTRAINT CK_co_estado   CHECK (estado IN ('PENDIENTE','CONFIRMADO','EN_PROCESO','ENTREGADO','CANCELADO'))
    );
END
GO

IF OBJECT_ID('dbo.customer_order_details', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.customer_order_details (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id        BIGINT        NOT NULL,
        producto_id     BIGINT        NOT NULL,
        cantidad        INT           NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal        DECIMAL(12,2) NOT NULL,
        observacion     NVARCHAR(300) NULL,
        created_at      DATETIME2     NULL,
        CONSTRAINT FK_cod_order    FOREIGN KEY (order_id)    REFERENCES dbo.customer_orders(id),
        CONSTRAINT FK_cod_producto FOREIGN KEY (producto_id) REFERENCES dbo.productos(id),
        CONSTRAINT CK_cod_cantidad CHECK (cantidad > 0)
    );
END
GO

IF OBJECT_ID('dbo.product_stock_movements', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_stock_movements (
        id              BIGINT IDENTITY(1,1) PRIMARY KEY,
        movement_number NVARCHAR(50)   NOT NULL UNIQUE,
        product_id      NVARCHAR(100)  NOT NULL,
        product_name    NVARCHAR(200)  NULL,
        movement_type   NVARCHAR(10)   NOT NULL,
        quantity        INT            NOT NULL,
        unit_measure    NVARCHAR(30)   NULL,
        unit_cost       DECIMAL(10,2)  NULL,
        total_value     DECIMAL(12,2)  NULL,
        movement_date   DATE           NOT NULL,
        reason          NVARCHAR(50)   NULL,
        warehouse       NVARCHAR(100)  NULL,
        responsible     NVARCHAR(100)  NULL,
        remarks         NVARCHAR(500)  NULL,
        active          BIT            NOT NULL DEFAULT 1,
        created_at      DATETIME2      NULL,
        updated_at      DATETIME2      NULL,
        CONSTRAINT CK_psm_type CHECK (movement_type IN ('IN', 'OUT'))
    );
    PRINT 'Tabla product_stock_movements creada.';
END
ELSE PRINT 'product_stock_movements ya existe.';
GO

IF OBJECT_ID('dbo.customer_order_details_s4', 'U') IS NOT NULL DROP TABLE dbo.customer_order_details_s4;
IF OBJECT_ID('dbo.customer_orders_s4', 'U') IS NOT NULL DROP TABLE dbo.customer_orders_s4;
GO

CREATE TABLE dbo.customer_orders_s4 (
    id                      BIGINT        IDENTITY(1,1) PRIMARY KEY,
    order_number            VARCHAR(50)   NOT NULL UNIQUE,
    customer_id             VARCHAR(100)  NOT NULL,
    customer_name           VARCHAR(200)  NOT NULL,
    order_date              DATE          NOT NULL,
    estimated_delivery_date DATE          NULL,
    status                  VARCHAR(20)   NOT NULL DEFAULT 'CONFIRMED',
    remarks                 VARCHAR(MAX)  NULL,
    subtotal                DECIMAL(12,2) NOT NULL DEFAULT 0,
    igv                     DECIMAL(12,2) NOT NULL DEFAULT 0,
    total                   DECIMAL(12,2) NOT NULL DEFAULT 0,
    active                  BIT           NOT NULL DEFAULT 1,
    created_at              DATETIME2     NULL,
    updated_at              DATETIME2     NULL,
    CONSTRAINT CK_co_s4_status CHECK (status IN ('PENDING','CONFIRMED','IN_PROCESS','DELIVERED','CANCELLED'))
);
PRINT 'Tabla customer_orders_s4 creada.';
GO

CREATE TABLE dbo.customer_order_details_s4 (
    id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
    order_id     BIGINT        NOT NULL,
    product_id   VARCHAR(100)  NOT NULL,
    product_name VARCHAR(200)  NOT NULL,
    product_unit VARCHAR(50)   NULL,
    quantity     INT           NOT NULL,
    unit_price   DECIMAL(12,2) NOT NULL,
    subtotal     DECIMAL(12,2) NOT NULL,
    remark       VARCHAR(MAX)  NULL,
    created_at   DATETIME2     NULL,
    CONSTRAINT FK_cod_s4_order FOREIGN KEY (order_id) REFERENCES dbo.customer_orders_s4 (id) ON DELETE CASCADE,
    CONSTRAINT CK_cod_s4_qty   CHECK (quantity > 0)
);
PRINT 'Tabla customer_order_details_s4 creada.';
GO

IF OBJECT_ID('dbo.agrochemical_application_details', 'U') IS NOT NULL DROP TABLE dbo.agrochemical_application_details;
IF OBJECT_ID('dbo.agrochemical_applications', 'U') IS NOT NULL DROP TABLE dbo.agrochemical_applications;
GO

CREATE TABLE dbo.agrochemical_applications (
    id                  BIGINT        IDENTITY(1,1) PRIMARY KEY,
    application_number  VARCHAR(50)   NOT NULL UNIQUE,
    field_name          VARCHAR(200)  NOT NULL,
    area_hectares       DECIMAL(10,2) NOT NULL,
    application_date    DATE          NOT NULL,
    responsible         VARCHAR(200)  NOT NULL,
    temperature_celsius DECIMAL(5,2)  NULL,
    humidity_percentage DECIMAL(5,2)  NULL,
    wind_conditions     VARCHAR(20)   NULL,
    status              VARCHAR(20)   NOT NULL DEFAULT 'SCHEDULED',
    remarks             VARCHAR(MAX)  NULL,
    total_products      INT           NOT NULL DEFAULT 0,
    total_cost          DECIMAL(12,2) NOT NULL DEFAULT 0,
    active              BIT           NOT NULL DEFAULT 1,
    created_at          DATETIME2     NULL,
    updated_at          DATETIME2     NULL,
    CONSTRAINT CK_aa_s4_status CHECK (status IN ('SCHEDULED','IN_PROCESS','COMPLETED','CANCELLED'))
);
PRINT 'Tabla agrochemical_applications creada.';
GO

CREATE TABLE dbo.agrochemical_application_details (
    id                    BIGINT        IDENTITY(1,1) PRIMARY KEY,
    application_id        BIGINT        NOT NULL,
    agrochemical_id       VARCHAR(100)  NOT NULL,
    agrochemical_name     VARCHAR(200)  NOT NULL,
    category              VARCHAR(50)   NULL,
    applied_dose          DECIMAL(10,2) NOT NULL,
    unit_measure          VARCHAR(20)   NOT NULL,
    treated_area_hectares DECIMAL(10,2) NOT NULL,
    unit_cost             DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_cost            DECIMAL(12,2) NOT NULL DEFAULT 0,
    remark                VARCHAR(MAX)  NULL,
    created_at            DATETIME2     NULL,
    CONSTRAINT FK_aad_s4_app FOREIGN KEY (application_id) REFERENCES dbo.agrochemical_applications (id) ON DELETE CASCADE
);
PRINT 'Tabla agrochemical_application_details creada.';
GO

-- ============================================================
-- 2. DEFAULTS
-- ============================================================
IF OBJECT_ID('DF_agrochemical_active',        'D') IS NULL ALTER TABLE dbo.agrochemical        ADD CONSTRAINT DF_agrochemical_active        DEFAULT 1 FOR active;
IF OBJECT_ID('DF_app_users_active',           'D') IS NULL ALTER TABLE dbo.app_users           ADD CONSTRAINT DF_app_users_active           DEFAULT 1 FOR active;
IF OBJECT_ID('DF_producers_active',           'D') IS NULL ALTER TABLE dbo.producers           ADD CONSTRAINT DF_producers_active           DEFAULT 1 FOR active;
IF OBJECT_ID('DF_fields_active',              'D') IS NULL ALTER TABLE dbo.fields              ADD CONSTRAINT DF_fields_active              DEFAULT 1 FOR active;
IF OBJECT_ID('DF_production_lots_active',     'D') IS NULL ALTER TABLE dbo.production_lots     ADD CONSTRAINT DF_production_lots_active     DEFAULT 1 FOR active;
IF OBJECT_ID('DF_field_applications_active',  'D') IS NULL ALTER TABLE dbo.field_applications  ADD CONSTRAINT DF_field_applications_active  DEFAULT 1 FOR active;
IF OBJECT_ID('DF_inventory_deliveries_active','D') IS NULL ALTER TABLE dbo.inventory_deliveries ADD CONSTRAINT DF_inventory_deliveries_active DEFAULT 1 FOR active;
IF OBJECT_ID('DF_alerts_active',              'D') IS NULL ALTER TABLE dbo.alerts              ADD CONSTRAINT DF_alerts_active              DEFAULT 1 FOR active;
IF OBJECT_ID('DF_audit_logs_active',          'D') IS NULL ALTER TABLE dbo.audit_logs          ADD CONSTRAINT DF_audit_logs_active          DEFAULT 1 FOR active;
IF OBJECT_ID('DF_customer_active',            'D') IS NULL ALTER TABLE dbo.customer            ADD CONSTRAINT DF_customer_active            DEFAULT 1 FOR active;
IF OBJECT_ID('DF_productos_estado',           'D') IS NULL ALTER TABLE dbo.productos           ADD CONSTRAINT DF_productos_estado           DEFAULT 1 FOR estado;
IF OBJECT_ID('DF_productores_active',         'D') IS NULL ALTER TABLE dbo.productores         ADD CONSTRAINT DF_productores_active         DEFAULT 1 FOR active;
GO

-- ============================================================
-- 3. STORED PROCEDURES
-- ============================================================
IF OBJECT_ID('dbo.sp_soft_delete', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_soft_delete;
GO
CREATE PROCEDURE dbo.sp_soft_delete @table NVARCHAR(128), @id BIGINT
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'UPDATE ' + QUOTENAME(@table) + N' SET active=0, deleted_at=SYSUTCDATETIME(), restored_at=NULL WHERE id=@id;';
    EXEC sp_executesql @sql, N'@id BIGINT', @id;
END
GO

IF OBJECT_ID('dbo.sp_restore', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_restore;
GO
CREATE PROCEDURE dbo.sp_restore @table NVARCHAR(128), @id BIGINT
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'UPDATE ' + QUOTENAME(@table) + N' SET active=1, restored_at=SYSUTCDATETIME(), deleted_at=NULL WHERE id=@id;';
    EXEC sp_executesql @sql, N'@id BIGINT', @id;
END
GO

-- ============================================================
-- 4. SEED DATA
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM dbo.app_users)
BEGIN
    INSERT INTO dbo.app_users (username,password_hash,full_name,email,role,active,created_at) VALUES
    ('admin','admin123','Carlos Mendoza Ríos','admin@avsa.pe','ROLE_ADMIN',1,SYSUTCDATETIME()),
    ('supervisor1','supervisor1123','María Elena Torres','mtorres@avsa.pe','ROLE_SUPERVISOR',1,SYSUTCDATETIME()),
    ('tech_juan','tech_juan123','Juan Pérez Castro','jperez@avsa.pe','ROLE_TECHNICIAN',1,SYSUTCDATETIME()),
    ('tech_rosa','tech_rosa123','Rosa Huamán Valdez','rhuaman@avsa.pe','ROLE_TECHNICIAN',1,SYSUTCDATETIME()),
    ('logistica1','logistica1123','Pedro García Flores','pgarcia@avsa.pe','ROLE_LOGISTICS',1,SYSUTCDATETIME()),
    ('cert_ana','cert_ana123','Ana Quispe Rojas','aquispe@avsa.pe','ROLE_CERTIFICACIONES',1,SYSUTCDATETIME()),
    ('supervisor2','supervisor2123','Luis Fernández Prado','lfernandez@avsa.pe','ROLE_SUPERVISOR',1,SYSUTCDATETIME()),
    ('tech_miguel','tech_miguel123','Miguel Ángel Ramos','mramos@avsa.pe','ROLE_TECHNICIAN',1,SYSUTCDATETIME()),
    ('logistica2','logistica2123','Carmen Díaz Luna','cdiaz@avsa.pe','ROLE_LOGISTICS',1,SYSUTCDATETIME()),
    ('admin2','admin2123','Jorge Vargas Medina','jvargas@avsa.pe','ROLE_ADMIN',1,SYSUTCDATETIME()),
    ('tech_sofia','tech_sofia123','Sofía Castillo Vera','scastillo@avsa.pe','ROLE_TECHNICIAN',1,SYSUTCDATETIME()),
    ('cert_diego','cert_diego123','Diego Morales Soto','dmorales@avsa.pe','ROLE_CERTIFICACIONES',1,SYSUTCDATETIME()),
    ('supervisor3','supervisor3123','Patricia Salazar Rojas','psalazar@avsa.pe','ROLE_SUPERVISOR',1,SYSUTCDATETIME()),
    ('tech_andres','tech_andres123','Andrés Villanueva Cruz','avillanueva@avsa.pe','ROLE_TECHNICIAN',1,SYSUTCDATETIME()),
    ('logistica3','logistica3123','Lucía Espinoza Ramos','lespinoza@avsa.pe','ROLE_LOGISTICS',1,SYSUTCDATETIME()),
    ('tech_daniela','tech_daniela123','Daniela Herrera Vega','dherrera@avsa.pe','ROLE_TECHNICIAN',1,SYSUTCDATETIME()),
    ('cert_raul','cert_raul123','Raúl Jiménez Paredes','rjimenez@avsa.pe','ROLE_CERTIFICACIONES',1,SYSUTCDATETIME()),
    ('supervisor4','supervisor4123','Verónica Núñez Silva','vnunez@avsa.pe','ROLE_SUPERVISOR',1,SYSUTCDATETIME()),
    ('tech_fernando','tech_fernando123','Fernando Rojas Paz','frojas@avsa.pe','ROLE_TECHNICIAN',1,SYSUTCDATETIME()),
    ('logistica4','logistica4123','Isabel Chávez Montoya','ichavez@avsa.pe','ROLE_LOGISTICS',1,SYSUTCDATETIME());
    PRINT '20 usuarios insertados.';
END
ELSE PRINT 'app_users ya tiene datos.';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.agrochemical)
BEGIN
    INSERT INTO dbo.agrochemical (commercial_name,active_ingredient,category,senasa_registration_number,registration_expiry,max_dose,waiting_period_days,manufacturer,active,created_at) VALUES
    ('Confidor 350 SC','Imidacloprid','INSECTICIDE','PQUA-01-2021','2027-06-15',0.5,14,'Bayer CropScience',1,SYSUTCDATETIME()),
    ('Amistar Top','Azoxystrobin + Difenoconazole','FUNGICIDE','PQUA-02-2021','2027-08-20',1.0,21,'Syngenta',1,SYSUTCDATETIME()),
    ('Roundup Max','Glifosato','HERBICIDE','PQUA-03-2020','2026-12-31',3.0,30,'Monsanto',1,SYSUTCDATETIME()),
    ('Karate Zeon','Lambda-Cihalotrina','INSECTICIDE','PQUA-04-2022','2028-03-10',0.4,7,'Syngenta',1,SYSUTCDATETIME()),
    ('Bayfolan Forte','NPK + Microelementos','FERTILIZER','PQUA-05-2021','2027-05-01',5.0,0,'Bayer CropScience',1,SYSUTCDATETIME()),
    ('Trichoderma Harzianum','Trichoderma harzianum','BIOSTIMULANT','PQUA-06-2023','2029-01-15',2.0,0,'BioAgro Peru',1,SYSUTCDATETIME()),
    ('Lannate 90 SP','Metomilo','INSECTICIDE','PQUA-07-2020','2026-09-30',0.3,14,'DuPont',1,SYSUTCDATETIME()),
    ('Score 250 EC','Difenoconazole','FUNGICIDE','PQUA-08-2022','2028-07-22',0.5,14,'Syngenta',1,SYSUTCDATETIME()),
    ('Paraquat Gramoxone','Paraquat','HERBICIDE','PQUA-09-2021','2027-04-18',2.5,21,'Syngenta',1,SYSUTCDATETIME()),
    ('Engeo 247 SC','Tiametoxam + Lambda-Cihalotrina','INSECTICIDE','PQUA-10-2023','2029-02-28',0.3,10,'Syngenta',1,SYSUTCDATETIME()),
    ('Mancozeb 80 WP','Mancozeb','FUNGICIDE','PQUA-11-2020','2026-11-15',2.5,14,'Dow AgroSciences',1,SYSUTCDATETIME()),
    ('Glufosinato Basta','Glufosinato de amonio','HERBICIDE','PQUA-12-2022','2028-06-10',2.0,21,'BASF',1,SYSUTCDATETIME()),
    ('Abamectina 1.8 EC','Abamectina','INSECTICIDE','PQUA-13-2021','2027-09-05',0.5,7,'Arysta LifeScience',1,SYSUTCDATETIME()),
    ('Carbendazim 500 SC','Carbendazim','FUNGICIDE','PQUA-14-2020','2026-08-20',1.0,14,'Nufarm',1,SYSUTCDATETIME()),
    ('Stimulate','Citoquininas + Giberelinas + Auxinas','BIOSTIMULANT','PQUA-15-2023','2029-04-12',0.5,0,'Stoller',1,SYSUTCDATETIME()),
    ('Sulfato de Potasio','K2SO4','FERTILIZER','PQUA-16-2022','2028-10-30',10.0,0,'SQM',1,SYSUTCDATETIME()),
    ('Acefato 75 SP','Acefato','INSECTICIDE','PQUA-17-2021','2027-03-25',1.0,14,'United Phosphorus',1,SYSUTCDATETIME()),
    ('Captan 50 WP','Captan','FUNGICIDE','PQUA-18-2022','2028-12-01',2.0,7,'Arysta LifeScience',1,SYSUTCDATETIME()),
    ('Aceite Agricola Citroliv','Aceite mineral','OTHER','PQUA-19-2021','2027-07-14',5.0,0,'Bayer CropScience',1,SYSUTCDATETIME()),
    ('Bacillus thuringiensis','Bt var. kurstaki','BIOSTIMULANT','PQUA-20-2023','2029-05-20',1.5,0,'BioAgro Peru',1,SYSUTCDATETIME());
    PRINT '20 agroquimicos insertados.';
END
ELSE PRINT 'agrochemical ya tiene datos.';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.producers)
BEGIN
    INSERT INTO dbo.producers (full_name,dni,phone,email,location,district,province,region,active,qr_token,created_at) VALUES
    ('Roberto Sánchez Luján','45678901','956123456','rsanchez@gmail.com','Fundo Santa Rosa Km 5','San Vicente','Cañete','Lima',1,'QR-PROD-001',SYSUTCDATETIME()),
    ('María Flores Huamán','45678902','956123457','mflores@gmail.com','Parcela 12 Valle Cañete','Imperial','Cañete','Lima',1,'QR-PROD-002',SYSUTCDATETIME()),
    ('José Luis Quispe Mamani','45678903','956123458','jquispe@gmail.com','Fundo La Esperanza','Lunahuaná','Cañete','Lima',1,'QR-PROD-003',SYSUTCDATETIME()),
    ('Ana Cristina Valdez Rojas','45678904','956123459','avaldez@gmail.com','Sector Herbay Alto','San Vicente','Cañete','Lima',1,'QR-PROD-004',SYSUTCDATETIME()),
    ('Pedro Antonio García López','45678905','956123460','pgarcia2@gmail.com','Fundo San Martín','Nuevo Imperial','Cañete','Lima',1,'QR-PROD-005',SYSUTCDATETIME()),
    ('Carmen Rosa Díaz Vega','45678906','956123461','cdiaz2@gmail.com','Parcela 28 Cerro Azul','Cerro Azul','Cañete','Lima',1,'QR-PROD-006',SYSUTCDATETIME()),
    ('Miguel Ángel Torres Prado','45678907','956123462','mtorres2@gmail.com','Fundo Los Olivos','Quilmaná','Cañete','Lima',1,'QR-PROD-007',SYSUTCDATETIME()),
    ('Lucía Fernández Castro','45678908','956123463','lfernandez2@gmail.com','Sector Hualcará','San Vicente','Cañete','Lima',1,'QR-PROD-008',SYSUTCDATETIME()),
    ('Eduardo Ramos Salazar','45678909','956123464','eramos@gmail.com','Fundo El Carmen','Asia','Cañete','Lima',1,'QR-PROD-009',SYSUTCDATETIME()),
    ('Sofía Castillo Mendoza','45678910','956123465','scastillo2@gmail.com','Parcela 45 Cañete Centro','San Vicente','Cañete','Lima',1,'QR-PROD-010',SYSUTCDATETIME()),
    ('Diego Morales Herrera','45678911','956123466','dmorales2@gmail.com','Fundo Vista Alegre','Imperial','Cañete','Lima',1,'QR-PROD-011',SYSUTCDATETIME()),
    ('Patricia Salazar Núñez','45678912','956123467','psalazar2@gmail.com','Sector Ungará','San Vicente','Cañete','Lima',1,'QR-PROD-012',SYSUTCDATETIME()),
    ('Andrés Villanueva Espinoza','45678913','956123468','avillanueva2@gmail.com','Fundo San Pedro','Lunahuaná','Cañete','Lima',1,'QR-PROD-013',SYSUTCDATETIME()),
    ('Daniela Herrera Jiménez','45678914','956123469','dherrera2@gmail.com','Parcela 67 Nuevo Imperial','Nuevo Imperial','Cañete','Lima',1,'QR-PROD-014',SYSUTCDATETIME()),
    ('Raúl Jiménez Chávez','45678915','956123470','rjimenez2@gmail.com','Fundo Las Palmas','Cerro Azul','Cañete','Lima',1,'QR-PROD-015',SYSUTCDATETIME()),
    ('Verónica Núñez Montoya','45678916','956123471','vnunez2@gmail.com','Sector Conta','San Vicente','Cañete','Lima',1,'QR-PROD-016',SYSUTCDATETIME()),
    ('Fernando Rojas Vega','45678917','956123472','frojas2@gmail.com','Fundo El Paraíso','Quilmaná','Cañete','Lima',1,'QR-PROD-017',SYSUTCDATETIME()),
    ('Isabel Chávez Luna','45678918','956123473','ichavez2@gmail.com','Parcela 89 Herbay Bajo','San Vicente','Cañete','Lima',1,'QR-PROD-018',SYSUTCDATETIME()),
    ('Gustavo Espinoza Ramos','45678919','956123474','gespinoza@gmail.com','Fundo San Juan','Imperial','Cañete','Lima',1,'QR-PROD-019',SYSUTCDATETIME()),
    ('Claudia Medina Torres','45678920','956123475','cmedina@gmail.com','Sector Cantagallo','San Vicente','Cañete','Lima',1,'QR-PROD-020',SYSUTCDATETIME());
    PRINT '20 productores insertados.';
END
ELSE PRINT 'producers ya tiene datos.';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.customer)
BEGIN
    INSERT INTO dbo.customer (codigo,razon_social,ruc,tipo_documento,numero_documento,pais,ciudad,direccion,telefono,email,contacto_principal,tipo_cliente,active,created_at) VALUES
    ('CLI-001','Agroindustrias del Sur S.A.C.','20512345678','RUC','20512345678','Perú','Lima','Av. La Marina 1234','01-4567890','ventas@agroindsur.pe','Luis Paredes','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-002','Fresh Fruits Export Ltd.',NULL,'TAX_ID','US-987654321','Estados Unidos','Miami','1200 Brickell Ave','+1-305-1234567','imports@freshfruits.com','John Smith','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-003','Supermercados Peruanos S.A.','20101234567','RUC','20101234567','Perú','Lima','Calle Morelli 181 San Borja','01-6180000','compras@spsa.pe','Martha Gutiérrez','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-004','European Organic Traders GmbH',NULL,'TAX_ID','DE-123456789','Alemania','Hamburgo','Hafenstraße 45','+49-40-12345','procurement@eot.de','Hans Mueller','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-005','Mercado Mayorista Cañete E.I.R.L.','20567890123','RUC','20567890123','Perú','Cañete','Jr. Bolognesi 456','01-5812345','info@mercadocanete.pe','Rosa Mendoza','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-006','Asia Pacific Foods Co.',NULL,'TAX_ID','JP-456789012','Japón','Tokio','Chiyoda-ku 3-1-1','+81-3-1234567','buy@apfoods.jp','Yuki Tanaka','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-007','Distribuidora Agrícola Lima S.A.C.','20234567890','RUC','20234567890','Perú','Lima','Av. Argentina 2345','01-3456789','pedidos@distagri.pe','Carlos Vega','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-008','Canadian Harvest Imports Inc.',NULL,'TAX_ID','CA-789012345','Canadá','Toronto','100 Queen St West','+1-416-9876543','sourcing@canharvest.ca','Emma Wilson','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-009','Cooperativa Agraria Cañete','20345678901','RUC','20345678901','Perú','Cañete','Av. Mariscal Benavides 789','01-5813456','cooperativa@coopcanete.pe','Jorge Salinas','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-010','UK Fresh Produce Ltd.',NULL,'TAX_ID','GB-321654987','Reino Unido','Londres','10 Downing Market','+44-20-7654321','orders@ukfresh.co.uk','James Brown','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-011','Restaurant Chain Peru S.A.C.','20456789012','RUC','20456789012','Perú','Lima','Av. Javier Prado 567','01-2345678','compras@restchain.pe','Andrea Paz','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-012','Chilean Agricultural Trading SpA',NULL,'TAX_ID','CL-765432109','Chile','Santiago','Av. Providencia 1234','+56-2-9876543','imports@chiletrade.cl','Pablo Muñoz','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-013','Exportadora Valle Sur S.A.','20567890234','RUC','20567890234','Perú','Ica','Panamericana Sur Km 300','056-234567','export@vallesur.pe','Diana Flores','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-014','Netherlands Tropical Fruits BV',NULL,'TAX_ID','NL-876543210','Países Bajos','Rotterdam','Europoort 789','+31-10-1234567','purchase@nltropical.nl','Pieter van Dijk','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-015','Agrícola Don Bosco S.A.C.','20678901234','RUC','20678901234','Perú','Lima','Av. Colonial 3456','01-5678901','gerencia@donboscoagri.pe','Manuel Ríos','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-016','Dubai Fresh Markets LLC',NULL,'TAX_ID','AE-543210987','Emiratos Árabes','Dubái','Jebel Ali Free Zone','+971-4-1234567','import@dubaifresh.ae','Ahmed Al-Rashid','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-017','Procesadora de Alimentos Lima S.A.','20789012345','RUC','20789012345','Perú','Lima','Av. Venezuela 890','01-4321098','logistica@proalim.pe','Sandra Morales','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-018','Brazilian Agro Commerce Ltda.',NULL,'TAX_ID','BR-210987654','Brasil','São Paulo','Rua Augusta 1500','+55-11-98765432','compras@brazilagro.com.br','Ricardo Silva','INTERNACIONAL',1,SYSUTCDATETIME()),
    ('CLI-019','Minimarket La Cosecha E.I.R.L.','10234567890','RUC','10234567890','Perú','Cañete','Calle Lima 234 Imperial','01-5814567','lacosecha@gmail.com','Julio Espinoza','NACIONAL',1,SYSUTCDATETIME()),
    ('CLI-020','South Korea Organic Co. Ltd.',NULL,'TAX_ID','KR-654321098','Corea del Sur','Seúl','Gangnam-gu 123','+82-2-1234567','organic@skorganic.kr','Min-Jun Park','INTERNACIONAL',1,SYSUTCDATETIME());
    PRINT '20 clientes insertados.';
END
ELSE PRINT 'customer ya tiene datos.';
GO

IF NOT EXISTS (SELECT 1 FROM dbo.productos)
BEGIN
    INSERT INTO dbo.productos (codigo,nombre,descripcion,categoria,unidad_medida,precio_unitario,stock_actual,stock_minimo,origen,estado,created_at) VALUES
    ('PROD-001','Mandarina Satsuma','Mandarina variedad Satsuma de primera calidad','Cítricos','Caja',85.00,500,50,'Cañete - San Vicente',1,SYSUTCDATETIME()),
    ('PROD-002','Palta Hass','Palta Hass calibre 16-20','Frutas','Caja',120.00,350,40,'Cañete - Lunahuaná',1,SYSUTCDATETIME()),
    ('PROD-003','Uva Red Globe','Uva de mesa variedad Red Globe','Frutas','Caja',95.00,280,30,'Cañete - Imperial',1,SYSUTCDATETIME()),
    ('PROD-004','Espárrago Verde','Espárrago verde fresco para exportación','Hortalizas','Kg',18.50,1200,100,'Cañete - Quilmaná',1,SYSUTCDATETIME()),
    ('PROD-005','Camote Amarillo','Camote amarillo tipo exportación','Tubérculos','Saco',45.00,600,60,'Cañete - Cerro Azul',1,SYSUTCDATETIME()),
    ('PROD-006','Mango Kent','Mango variedad Kent calibre 8-10','Frutas','Caja',75.00,420,50,'Cañete - San Vicente',1,SYSUTCDATETIME()),
    ('PROD-007','Maíz Morado','Maíz morado orgánico seco','Granos','Saco',55.00,800,80,'Cañete - Nuevo Imperial',1,SYSUTCDATETIME()),
    ('PROD-008','Limón Sutil','Limón sutil fresco calibre A','Cítricos','Caja',35.00,900,90,'Cañete - Asia',1,SYSUTCDATETIME()),
    ('PROD-009','Arándano Biloxi','Arándano fresco para exportación','Berries','Kg',28.00,400,40,'Cañete - Imperial',1,SYSUTCDATETIME()),
    ('PROD-010','Naranja Valencia','Naranja Valencia para jugo','Cítricos','Caja',42.00,650,65,'Cañete - Imperial',1,SYSUTCDATETIME()),
    ('PROD-011','Pimiento Piquillo','Pimiento piquillo fresco calibre AA','Hortalizas','Caja',68.00,300,30,'Cañete - Nuevo Imperial',1,SYSUTCDATETIME()),
    ('PROD-012','Algodón Tangüis','Fibra de algodón Tangüis primera','Fibras','Fardo',320.00,150,15,'Cañete - Quilmaná',1,SYSUTCDATETIME()),
    ('PROD-013','Quinua Orgánica','Quinua blanca orgánica certificada','Granos','Kg',12.50,2000,200,'Cañete - San Vicente',1,SYSUTCDATETIME()),
    ('PROD-014','Frijol Canario','Frijol canario seco de primera','Legumbres','Saco',85.00,500,50,'Cañete - Lunahuaná',1,SYSUTCDATETIME()),
    ('PROD-015','Higo Negro','Higo negro fresco temporada','Frutas','Kg',22.00,200,20,'Cañete - Imperial',1,SYSUTCDATETIME()),
    ('PROD-016','Tomate Cherry','Tomate cherry hidropónico','Hortalizas','Caja',55.00,350,35,'Cañete - San Vicente',1,SYSUTCDATETIME()),
    ('PROD-017','Ají Amarillo','Ají amarillo fresco grado exportación','Hortalizas','Kg',18.00,750,75,'Cañete - Cerro Azul',1,SYSUTCDATETIME()),
    ('PROD-018','Granadilla AA','Granadilla calibre AA para exportación','Frutas','Caja',92.00,280,28,'Cañete - San Vicente',1,SYSUTCDATETIME()),
    ('PROD-019','Yuca Amarilla','Yuca amarilla para procesamiento industrial','Tubérculos','Saco',38.00,700,70,'Cañete - Lunahuaná',1,SYSUTCDATETIME()),
    ('PROD-020','Camote Morado','Camote morado orgánico exportación','Tubérculos','Saco',52.00,450,45,'Cañete - Quilmaná',1,SYSUTCDATETIME());
    PRINT '20 productos insertados.';
END
ELSE PRINT 'productos ya tiene datos.';
GO

-- SEED: customer_orders_s4 (10 pedidos)
IF NOT EXISTS (SELECT 1 FROM dbo.customer_orders_s4)
BEGIN
    INSERT INTO dbo.customer_orders_s4 (order_number,customer_id,customer_name,order_date,estimated_delivery_date,status,subtotal,igv,total,active,created_at) VALUES
    ('ORD-S4-001','CLI-001','Agroindustrias del Sur S.A.C.','2026-09-01','2026-09-15','DELIVERED', 8500.00,1530.00,10030.00,1,SYSUTCDATETIME()),
    ('ORD-S4-002','CLI-003','Supermercados Peruanos S.A.','2026-09-05','2026-09-20','DELIVERED',12000.00,2160.00,14160.00,1,SYSUTCDATETIME()),
    ('ORD-S4-003','CLI-002','Fresh Fruits Export Ltd.','2026-09-10','2026-09-30','DELIVERED', 9500.00,1710.00,11210.00,1,SYSUTCDATETIME()),
    ('ORD-S4-004','CLI-007','Distribuidora Agrícola Lima S.A.C.','2026-09-15','2026-09-25','DELIVERED', 4250.00, 765.00, 5015.00,1,SYSUTCDATETIME()),
    ('ORD-S4-005','CLI-005','Mercado Mayorista Cañete E.I.R.L.','2026-10-01','2026-10-10','CONFIRMED', 6800.00,1224.00, 8024.00,1,SYSUTCDATETIME()),
    ('ORD-S4-006','CLI-004','European Organic Traders GmbH','2026-10-05','2026-10-25','IN_PROCESS',15000.00,2700.00,17700.00,1,SYSUTCDATETIME()),
    ('ORD-S4-007','CLI-009','Cooperativa Agraria Cañete','2026-10-08','2026-10-18','CONFIRMED', 3200.00, 576.00, 3776.00,1,SYSUTCDATETIME()),
    ('ORD-S4-008','CLI-011','Restaurant Chain Peru S.A.C.','2026-10-10','2026-10-20','PENDING',  5500.00, 990.00, 6490.00,1,SYSUTCDATETIME()),
    ('ORD-S4-009','CLI-006','Asia Pacific Foods Co.','2026-10-12','2026-11-01','PENDING', 18000.00,3240.00,21240.00,1,SYSUTCDATETIME()),
    ('ORD-S4-010','CLI-001','Agroindustrias del Sur S.A.C.','2026-10-15','2026-10-25','CANCELLED', 7000.00,1260.00, 8260.00,1,SYSUTCDATETIME());
    PRINT '10 pedidos S4 insertados.';
END
ELSE PRINT 'customer_orders_s4 ya tiene datos.';
GO

-- SEED: product_stock_movements (20 movimientos)
IF NOT EXISTS (SELECT 1 FROM dbo.product_stock_movements)
BEGIN
    INSERT INTO dbo.product_stock_movements (movement_number,product_id,product_name,movement_type,quantity,unit_measure,unit_cost,total_value,movement_date,reason,warehouse,responsible,remarks,active,created_at) VALUES
    ('MOV-001','PROD-001','Mandarina Satsuma','IN', 200,'Caja',  85.00, 17000.00,'2026-09-01','PURCHASE',   'Almacén Central','Pedro García','Ingreso cosecha temporada',1,SYSUTCDATETIME()),
    ('MOV-002','PROD-002','Palta Hass',       'IN', 150,'Caja', 120.00, 18000.00,'2026-09-02','PURCHASE',   'Almacén Central','Pedro García','Ingreso palta primera campaña',1,SYSUTCDATETIME()),
    ('MOV-003','PROD-001','Mandarina Satsuma','OUT',100,'Caja',  85.00,  8500.00,'2026-09-05','SALE',       'Almacén Central','Carmen Díaz', 'Despacho pedido ORD-S4-001',1,SYSUTCDATETIME()),
    ('MOV-004','PROD-003','Uva Red Globe',    'IN', 120,'Caja',  95.00, 11400.00,'2026-09-06','PURCHASE',   'Almacén Central','Pedro García','Uva Red Globe temporada',1,SYSUTCDATETIME()),
    ('MOV-005','PROD-002','Palta Hass',       'OUT',100,'Caja', 120.00, 12000.00,'2026-09-10','SALE',       'Almacén Central','Carmen Díaz', 'Despacho pedido ORD-S4-002',1,SYSUTCDATETIME()),
    ('MOV-006','PROD-004','Espárrago Verde',  'IN', 500,'Kg',    18.50,  9250.00,'2026-09-12','PRODUCTION', 'Almacén Frío',   'Pedro García','Cosecha espárrago lote 4',1,SYSUTCDATETIME()),
    ('MOV-007','PROD-003','Uva Red Globe',    'OUT', 80,'Caja',  95.00,  7600.00,'2026-09-15','SALE',       'Almacén Central','Carmen Díaz', 'Despacho exportación ORD-S4-003',1,SYSUTCDATETIME()),
    ('MOV-008','PROD-005','Camote Amarillo',  'IN', 300,'Saco',  45.00, 13500.00,'2026-09-18','PURCHASE',   'Almacén Central','Pedro García','Ingreso camote cosecha',1,SYSUTCDATETIME()),
    ('MOV-009','PROD-004','Espárrago Verde',  'OUT',200,'Kg',    18.50,  3700.00,'2026-09-20','SALE',       'Almacén Frío',   'Carmen Díaz', 'Despacho pedido ORD-S4-004',1,SYSUTCDATETIME()),
    ('MOV-010','PROD-006','Mango Kent',       'IN', 180,'Caja',  75.00, 13500.00,'2026-09-22','PRODUCTION', 'Almacén Central','Pedro García','Cosecha mango Kent',1,SYSUTCDATETIME()),
    ('MOV-011','PROD-007','Maíz Morado',      'IN', 400,'Saco',  55.00, 22000.00,'2026-09-25','PURCHASE',   'Almacén Seco',   'Isabel Chávez','Ingreso maíz morado orgánico',1,SYSUTCDATETIME()),
    ('MOV-012','PROD-001','Mandarina Satsuma','OUT', 50,'Caja',  85.00,  4250.00,'2026-10-01','SALE',       'Almacén Central','Carmen Díaz', 'Despacho pedido ORD-S4-005',1,SYSUTCDATETIME()),
    ('MOV-013','PROD-008','Limón Sutil',      'IN', 400,'Caja',  35.00, 14000.00,'2026-10-02','PRODUCTION', 'Almacén Central','Pedro García','Cosecha limón temporada alta',1,SYSUTCDATETIME()),
    ('MOV-014','PROD-002','Palta Hass',       'IN', 100,'Caja', 120.00, 12000.00,'2026-10-05','PURCHASE',   'Almacén Central','Pedro García','Reposición stock palta',1,SYSUTCDATETIME()),
    ('MOV-015','PROD-009','Arándano Biloxi',  'IN', 200,'Kg',    28.00,  5600.00,'2026-10-06','PRODUCTION', 'Almacén Frío',   'Pedro García','Primera cosecha arándano',1,SYSUTCDATETIME()),
    ('MOV-016','PROD-006','Mango Kent',       'OUT', 80,'Caja',  75.00,  6000.00,'2026-10-08','SALE',       'Almacén Central','Carmen Díaz', 'Exportación pedido ORD-S4-006',1,SYSUTCDATETIME()),
    ('MOV-017','PROD-010','Naranja Valencia', 'IN', 300,'Caja',  42.00, 12600.00,'2026-10-10','PRODUCTION', 'Almacén Central','Pedro García','Cosecha naranja Valencia',1,SYSUTCDATETIME()),
    ('MOV-018','PROD-005','Camote Amarillo',  'OUT',100,'Saco',  45.00,  4500.00,'2026-10-12','SALE',       'Almacén Central','Carmen Díaz', 'Despacho pedido ORD-S4-007',1,SYSUTCDATETIME()),
    ('MOV-019','PROD-013','Quinua Orgánica',  'IN',1000,'Kg',    12.50, 12500.00,'2026-10-14','PURCHASE',   'Almacén Seco',   'Isabel Chávez','Ingreso quinua orgánica certificada',1,SYSUTCDATETIME()),
    ('MOV-020','PROD-008','Limón Sutil',      'OUT',150,'Caja',  35.00,  5250.00,'2026-10-16','SALE',       'Almacén Central','Carmen Díaz', 'Despacho pedido ORD-S4-008',1,SYSUTCDATETIME());
    PRINT '20 movimientos de stock insertados.';
END
ELSE PRINT 'product_stock_movements ya tiene datos.';
GO

-- ============================================================
-- 5. VERIFICACION FINAL
-- ============================================================
SELECT 'customer_orders_s4'       AS tabla, COUNT(*) AS registros FROM dbo.customer_orders_s4
UNION ALL
SELECT 'customer_order_details_s4',         COUNT(*) FROM dbo.customer_order_details_s4
UNION ALL
SELECT 'product_stock_movements',           COUNT(*) FROM dbo.product_stock_movements
UNION ALL
SELECT 'customer',                          COUNT(*) FROM dbo.customer
UNION ALL
SELECT 'productos',                         COUNT(*) FROM dbo.productos
UNION ALL
SELECT 'app_users',                         COUNT(*) FROM dbo.app_users;
GO
