-- ============================================================================
-- SCRIPT 1: CREACIÓN COMPLETA DE BASE DE DATOS TRANSACCIONALES
-- Proyecto: AVSA - Sistema Agroindustrial
-- Base de datos: avsa_db (SQL Server)
-- ============================================================================
-- 
-- PROPÓSITO:
-- Este script crea toda la estructura de base de datos para los módulos
-- TRANSACCIONALES del sistema AVSA. Los datos MAESTROS (catálogos) están
-- en MongoDB, no aquí.
--
-- QUÉ CREA ESTE SCRIPT:
-- 1. Base de datos: avsa_db
-- 2. Tablas de PEDIDOS DE CLIENTES (cabecera + detalles)
-- 3. Tablas de APLICACIONES DE AGROQUÍMICOS (cabecera + detalles)
-- 4. Tabla de MOVIMIENTOS DE INVENTARIO
-- 5. Índices para optimización
-- 6. Datos de prueba para todas las tablas
--
-- EJECUTAR: Solo UNA VEZ al iniciar el proyecto
--
-- NOTA IMPORTANTE:
-- - MongoDB contiene: clientes, productos, agroquímicos (MAESTROS)
-- - SQL Server contiene: pedidos, aplicaciones, movimientos (TRANSACCIONES)
-- ============================================================================

PRINT '============================================';
PRINT 'INICIO DE CREACIÓN DE BASE DE DATOS';
PRINT '============================================';
PRINT '';

-- ============================================================================
-- PASO 1: CREAR LA BASE DE DATOS
-- Verifica si existe, si no la crea
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'avsa_db')
BEGIN
    CREATE DATABASE avsa_db;
    PRINT '✅ Base de datos avsa_db creada exitosamente';
END
ELSE
BEGIN
    PRINT '⚠️  Base de datos avsa_db ya existe - continuando...';
END
GO

USE avsa_db;
GO

PRINT '';
PRINT '============================================';
PRINT 'CREANDO TABLAS TRANSACCIONALES';
PRINT '============================================';
PRINT '';

-- ============================================================================
-- MÓDULO 1: PEDIDOS DE CLIENTES
-- ============================================================================

PRINT '--- MÓDULO 1: PEDIDOS DE CLIENTES ---';
PRINT '';

-- ----------------------------------------------------------------------------
-- TABLA: customer_orders_s4 (CABECERA DE PEDIDOS)
-- Propósito: Almacena información principal de cada pedido del cliente
-- Relación: Un pedido tiene muchos detalles (1:N)
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'customer_orders_s4')
BEGIN
    CREATE TABLE customer_orders_s4 (
        -- Clave primaria autoincremental
        id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
        
        -- Número único del pedido (ej: ORD-2024-001)
        order_number            VARCHAR(50) NOT NULL UNIQUE,
        
        -- ID del cliente (hace referencia a MongoDB collection: customer)
        customer_id             VARCHAR(100) NOT NULL,
        
        -- Razón social del cliente (desnormalizada para evitar joins con Mongo)
        customer_name           VARCHAR(200),
        
        -- Fechas del pedido
        order_date              DATE NOT NULL,              -- Fecha de creación
        estimated_delivery_date DATE,                       -- Fecha estimada de entrega
        
        -- Estado del pedido: solo acepta estos valores
        -- PENDING: recién creado, sin confirmar
        -- CONFIRMED: pedido confirmado por ventas
        -- IN_PROCESS: en preparación o envío
        -- DELIVERED: completado y entregado
        -- CANCELLED: anulado por algún motivo
        status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING'
            CONSTRAINT ck_orders_status CHECK (status IN ('PENDING','CONFIRMED','IN_PROCESS','DELIVERED','CANCELLED')),
        
        -- Observaciones adicionales del pedido
        remarks                 VARCHAR(MAX),
        
        -- Montos calculados del pedido (en soles)
        subtotal                DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Suma de productos sin impuesto
        igv                     DECIMAL(12,2) NOT NULL DEFAULT 0,  -- IGV 18%
        total                   DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Total = subtotal + IGV
        
        -- Soft delete: 1=activo, 0=eliminado lógicamente
        active                  BIT NOT NULL DEFAULT 1,
        
        -- Auditoría: registro de fechas de cambios
        created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),  -- Fecha de creación
        updated_at              DATETIME2 NOT NULL DEFAULT GETDATE()   -- Última modificación
    );
    
    PRINT '✅ Tabla customer_orders_s4 creada (cabecera de pedidos)';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla customer_orders_s4 ya existe';
END
GO

-- ----------------------------------------------------------------------------
-- TABLA: customer_order_details_s4 (DETALLES/LÍNEAS DE PEDIDOS)
-- Propósito: Almacena cada producto incluido en un pedido
-- Relación: Muchos detalles pertenecen a un pedido (N:1)
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'customer_order_details_s4')
BEGIN
    CREATE TABLE customer_order_details_s4 (
        -- Clave primaria autoincremental
        id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
        
        -- Foreign key: referencia a la cabecera del pedido
        order_id                BIGINT NOT NULL,
        
        -- ID del producto (referencia a MongoDB collection: productos)
        product_id              VARCHAR(100) NOT NULL,
        
        -- Información desnormalizada del producto (para evitar joins con Mongo)
        product_name            VARCHAR(200),                   -- Nombre del producto
        product_unit            VARCHAR(50),                    -- KILOGRAM, LITER, BAG, etc.
        
        -- Cantidades y precios
        quantity                INT NOT NULL,                   -- Cantidad solicitada
        unit_price              DECIMAL(12,2) NOT NULL,         -- Precio por unidad
        subtotal                DECIMAL(12,2) NOT NULL,         -- quantity * unit_price
        
        -- Observación específica de esta línea
        remark                  VARCHAR(MAX),
        
        -- Auditoría
        created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        -- Clave foránea: relación con la cabecera
        -- ON DELETE CASCADE: si se elimina el pedido, se eliminan automáticamente sus detalles
        CONSTRAINT FK_order_details_order 
            FOREIGN KEY (order_id) 
            REFERENCES customer_orders_s4(id)
            ON DELETE CASCADE
    );
    
    PRINT '✅ Tabla customer_order_details_s4 creada (detalles de pedidos)';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla customer_order_details_s4 ya existe';
END
GO

PRINT '';

-- ============================================================================
-- MÓDULO 2: APLICACIONES DE AGROQUÍMICOS EN CAMPO
-- ============================================================================

PRINT '--- MÓDULO 2: APLICACIONES DE AGROQUÍMICOS ---';
PRINT '';

-- ----------------------------------------------------------------------------
-- TABLA: agrochemical_applications (CABECERA DE APLICACIONES)
-- Propósito: Registra aplicaciones de agroquímicos en campo con condiciones
-- Relación: Una aplicación tiene muchos detalles (1:N)
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'agrochemical_applications')
BEGIN
    CREATE TABLE agrochemical_applications (
        -- Clave primaria autoincremental
        id                    BIGINT IDENTITY(1,1) PRIMARY KEY,
        
        -- Número único de aplicación (ej: APP-20240920-001)
        application_number    VARCHAR(50) NOT NULL UNIQUE,
        
        -- Información del campo tratado
        field_name            VARCHAR(200) NOT NULL,          -- Nombre del campo
        area_hectares         DECIMAL(10,2) NOT NULL,         -- Área en hectáreas
        
        -- Fecha de la aplicación
        application_date      DATE NOT NULL,
        
        -- Responsable de la aplicación (técnico, operador)
        responsible           VARCHAR(200) NOT NULL,
        
        -- Condiciones climáticas al momento de aplicar
        temperature_celsius   DECIMAL(5,2),                   -- Temperatura en °C
        humidity_percentage   DECIMAL(5,2),                   -- Humedad relativa %
        wind_conditions       VARCHAR(50),                    -- LIGHT, MODERATE, STRONG
        
        -- Estado de la aplicación
        -- SCHEDULED: programada, aún no realizada
        -- IN_PROCESS: en ejecución
        -- COMPLETED: completada satisfactoriamente
        -- CANCELLED: cancelada por algún motivo
        status                VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
            CONSTRAINT ck_applications_status CHECK (status IN ('SCHEDULED','IN_PROCESS','COMPLETED','CANCELLED')),
        
        -- Observaciones generales
        remarks               VARCHAR(MAX),
        
        -- Totales calculados
        total_products        INT NOT NULL DEFAULT 0,          -- Cantidad de productos usados
        total_cost            DECIMAL(12,2) NOT NULL DEFAULT 0,  -- Costo total de la aplicación
        
        -- Soft delete
        active                BIT NOT NULL DEFAULT 1,
        
        -- Auditoría
        created_at            DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at            DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    
    PRINT '✅ Tabla agrochemical_applications creada (cabecera de aplicaciones)';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla agrochemical_applications ya existe';
END
GO

-- ----------------------------------------------------------------------------
-- TABLA: agrochemical_application_details (DETALLES DE APLICACIONES)
-- Propósito: Cada agroquímico usado en una aplicación con su dosis
-- Relación: Muchos detalles pertenecen a una aplicación (N:1)
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'agrochemical_application_details')
BEGIN
    CREATE TABLE agrochemical_application_details (
        -- Clave primaria autoincremental
        id                      BIGINT IDENTITY(1,1) PRIMARY KEY,
        
        -- Foreign key: referencia a la cabecera de aplicación
        application_id          BIGINT NOT NULL,
        
        -- ID del agroquímico (referencia a MongoDB collection: agrochemicals)
        agrochemical_id         VARCHAR(100) NOT NULL,
        
        -- Información desnormalizada del agroquímico
        agrochemical_name       VARCHAR(200) NOT NULL,          -- Nombre comercial
        category                VARCHAR(50),                     -- INSECTICIDE, HERBICIDE, FUNGICIDE
        
        -- Dosis aplicada
        applied_dose            DECIMAL(10,2) NOT NULL,         -- Cantidad de dosis
        unit_measure            VARCHAR(20) NOT NULL,           -- L/ha, kg/ha, etc.
        treated_area_hectares   DECIMAL(10,2) NOT NULL,         -- Hectáreas tratadas
        
        -- Costos
        unit_cost               DECIMAL(12,2) NOT NULL,         -- Costo por unidad
        total_cost              DECIMAL(12,2) NOT NULL,         -- Costo total de esta línea
        
        -- Observación específica
        remark                  VARCHAR(MAX),
        
        -- Auditoría
        created_at              DATETIME2 NOT NULL DEFAULT GETDATE(),

        -- Clave foránea
        CONSTRAINT FK_application_details 
            FOREIGN KEY (application_id) 
            REFERENCES agrochemical_applications(id)
            ON DELETE CASCADE
    );
    
    PRINT '✅ Tabla agrochemical_application_details creada (detalles de aplicaciones)';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla agrochemical_application_details ya existe';
END
GO

PRINT '';

-- ============================================================================
-- MÓDULO 3: MOVIMIENTOS DE INVENTARIO
-- ============================================================================

PRINT '--- MÓDULO 3: MOVIMIENTOS DE INVENTARIO ---';
PRINT '';

-- ----------------------------------------------------------------------------
-- TABLA: product_stock_movements (MOVIMIENTOS DE INVENTARIO)
-- Propósito: Registra entradas y salidas de productos del almacén
-- Tipos: IN (entrada), OUT (salida)
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'product_stock_movements')
BEGIN
    CREATE TABLE product_stock_movements (
        -- Clave primaria autoincremental
        id                    BIGINT IDENTITY(1,1) PRIMARY KEY,
        
        -- Número único del movimiento (ej: MOV-2024-001)
        movement_number       VARCHAR(50) NOT NULL UNIQUE,
        
        -- ID del producto (referencia a MongoDB collection: productos)
        product_id            VARCHAR(100) NOT NULL,
        
        -- Nombre del producto (desnormalizado)
        product_name          VARCHAR(200),
        
        -- Tipo de movimiento:
        -- IN: entrada al almacén (compras, devoluciones, ajustes positivos)
        -- OUT: salida del almacén (ventas, consumo, ajustes negativos, mermas)
        movement_type         VARCHAR(10) NOT NULL
            CONSTRAINT ck_movements_type CHECK (movement_type IN ('IN','OUT')),
        
        -- Cantidad del movimiento
        quantity              INT NOT NULL,
        
        -- Unidad de medida del producto
        unit_measure          VARCHAR(50),
        
        -- Valores monetarios
        unit_cost             DECIMAL(12,2) NOT NULL,         -- Costo unitario
        total_value           DECIMAL(12,2) NOT NULL,         -- Valor total = cantidad * costo_unitario
        
        -- Fecha del movimiento
        movement_date         DATE NOT NULL DEFAULT GETDATE(),
        
        -- Motivo del movimiento (compra, venta, ajuste, merma, etc.)
        reason                VARCHAR(100),
        
        -- Almacén origen/destino
        warehouse             VARCHAR(200),
        
        -- Responsable del movimiento
        responsible           VARCHAR(200),
        
        -- Observaciones
        remarks               VARCHAR(MAX),
        
        -- Soft delete
        active                BIT NOT NULL DEFAULT 1,
        
        -- Auditoría
        created_at            DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at            DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    
    PRINT '✅ Tabla product_stock_movements creada (movimientos de inventario)';
END
ELSE
BEGIN
    PRINT '⚠️  Tabla product_stock_movements ya existe';
END
GO

PRINT '';
PRINT '============================================';
PRINT 'CREANDO ÍNDICES DE OPTIMIZACIÓN';
PRINT '============================================';
PRINT '';

-- ============================================================================
-- ÍNDICES PARA MEJORAR EL RENDIMIENTO DE LAS CONSULTAS
-- Los índices son estructuras que aceleran las búsquedas en columnas específicas
-- ============================================================================

PRINT '--- ÍNDICES MÓDULO PEDIDOS ---';

-- Índice para buscar pedidos por su número único
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_order_number')
BEGIN
    CREATE INDEX idx_order_number ON customer_orders_s4(order_number);
    PRINT '✅ Índice idx_order_number creado';
END
GO

-- Índice para listar todos los pedidos de un cliente
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_customer_id')
BEGIN
    CREATE INDEX idx_customer_id ON customer_orders_s4(customer_id);
    PRINT '✅ Índice idx_customer_id creado';
END
GO

-- Índice para acelerar el JOIN entre cabecera y detalles de pedidos
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_order_id_detail')
BEGIN
    CREATE INDEX idx_order_id_detail ON customer_order_details_s4(order_id);
    PRINT '✅ Índice idx_order_id_detail creado';
END
GO

PRINT '';
PRINT '--- ÍNDICES MÓDULO APLICACIONES ---';

-- Índice para buscar aplicaciones por su número único
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_application_number')
BEGIN
    CREATE INDEX idx_application_number ON agrochemical_applications(application_number);
    PRINT '✅ Índice idx_application_number creado';
END
GO

-- Índice para acelerar el JOIN entre cabecera y detalles de aplicaciones
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_application_id_detail')
BEGIN
    CREATE INDEX idx_application_id_detail ON agrochemical_application_details(application_id);
    PRINT '✅ Índice idx_application_id_detail creado';
END
GO

PRINT '';
PRINT '--- ÍNDICES MÓDULO INVENTARIO ---';

-- Índice para buscar movimientos por su número único
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movement_number')
BEGIN
    CREATE INDEX idx_movement_number ON product_stock_movements(movement_number);
    PRINT '✅ Índice idx_movement_number creado';
END
GO

-- Índice para ver historial de movimientos de un producto
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movement_product_id')
BEGIN
    CREATE INDEX idx_movement_product_id ON product_stock_movements(product_id);
    PRINT '✅ Índice idx_movement_product_id creado';
END
GO

PRINT '';
PRINT '============================================';
PRINT 'INSERTANDO DATOS DE PRUEBA';
PRINT '============================================';
PRINT '';

-- ============================================================================
-- DATOS DE PRUEBA PARA TESTING Y DESARROLLO
-- Estos datos permiten probar el sistema sin necesidad de usar la API
-- ============================================================================

-- Limpiar datos anteriores (para poder ejecutar el script múltiples veces)
DELETE FROM customer_order_details_s4;
DELETE FROM customer_orders_s4;
DELETE FROM agrochemical_application_details;
DELETE FROM agrochemical_applications;
DELETE FROM product_stock_movements;
GO

-- Reiniciar los contadores de identidad
DBCC CHECKIDENT ('customer_orders_s4', RESEED, 0);
DBCC CHECKIDENT ('customer_order_details_s4', RESEED, 0);
DBCC CHECKIDENT ('agrochemical_applications', RESEED, 0);
DBCC CHECKIDENT ('agrochemical_application_details', RESEED, 0);
DBCC CHECKIDENT ('product_stock_movements', RESEED, 0);
GO

PRINT '--- INSERTANDO PEDIDOS DE PRUEBA ---';
PRINT '';

-- PEDIDO 1: Juan Pérez SAC
INSERT INTO customer_orders_s4 
(order_number, customer_id, customer_name, order_date, estimated_delivery_date, 
 status, remarks, subtotal, igv, total, active, created_at, updated_at)
VALUES 
('ORD-2024-001', 'CUST001', 'Juan Pérez SAC', '2024-09-20', '2024-09-25', 
 'CONFIRMED', 'Urgent order', 1000.00, 180.00, 1180.00, 1, GETDATE(), GETDATE());

DECLARE @Order1Id BIGINT = SCOPE_IDENTITY();

INSERT INTO customer_order_details_s4 
(order_id, product_id, product_name, product_unit, quantity, unit_price, subtotal, remark, created_at)
VALUES 
(@Order1Id, 'PROD001', 'NPK Fertilizer', 'KILOGRAM', 10, 50.00, 500.00, NULL, GETDATE()),
(@Order1Id, 'PROD002', 'Lambda Insecticide', 'LITER', 5, 100.00, 500.00, NULL, GETDATE());

-- PEDIDO 2: María González EIRL
INSERT INTO customer_orders_s4 
(order_number, customer_id, customer_name, order_date, estimated_delivery_date, 
 status, remarks, subtotal, igv, total, active, created_at, updated_at)
VALUES 
('ORD-2024-002', 'CUST002', 'María González EIRL', '2024-09-21', '2024-09-26', 
 'PENDING', 'Check stock', 2500.00, 450.00, 2950.00, 1, GETDATE(), GETDATE());

DECLARE @Order2Id BIGINT = SCOPE_IDENTITY();

INSERT INTO customer_order_details_s4 
(order_id, product_id, product_name, product_unit, quantity, unit_price, subtotal, remark, created_at)
VALUES 
(@Order2Id, 'PROD003', 'Glyphosate Herbicide', 'LITER', 20, 75.00, 1500.00, NULL, GETDATE()),
(@Order2Id, 'PROD004', 'Organic Fertilizer', 'BAG', 10, 100.00, 1000.00, NULL, GETDATE());

-- PEDIDO 3: Agroindustrias del Norte SA
INSERT INTO customer_orders_s4 
(order_number, customer_id, customer_name, order_date, estimated_delivery_date, 
 status, remarks, subtotal, igv, total, active, created_at, updated_at)
VALUES 
('ORD-2024-003', 'CUST003', 'Agroindustrias del Norte SA', '2024-09-22', '2024-09-28', 
 'IN_PROCESS', 'Large order', 5000.00, 900.00, 5900.00, 1, GETDATE(), GETDATE());

DECLARE @Order3Id BIGINT = SCOPE_IDENTITY();

INSERT INTO customer_order_details_s4 
(order_id, product_id, product_name, product_unit, quantity, unit_price, subtotal, remark, created_at)
VALUES 
(@Order3Id, 'PROD001', 'NPK Fertilizer', 'KILOGRAM', 50, 50.00, 2500.00, NULL, GETDATE()),
(@Order3Id, 'PROD002', 'Lambda Insecticide', 'LITER', 15, 100.00, 1500.00, NULL, GETDATE()),
(@Order3Id, 'PROD005', 'Copper Fungicide', 'KILOGRAM', 10, 100.00, 1000.00, NULL, GETDATE());

PRINT '✅ 3 pedidos con 7 líneas de detalle insertados';
PRINT '';

PRINT '--- INSERTANDO APLICACIONES DE AGROQUÍMICOS ---';
PRINT '';

-- APLICACIÓN 1: Campo Norte
INSERT INTO agrochemical_applications 
(application_number, field_name, area_hectares, application_date, responsible,
 temperature_celsius, humidity_percentage, wind_conditions, status, remarks,
 total_products, total_cost, active, created_at, updated_at)
VALUES 
('APP-2024-001', 'Campo Norte', 4.50, '2024-09-20', 'Carlos Mendoza',
 22.5, 65.0, 'LIGHT', 'COMPLETED', 'Aplicación de insecticida en maíz',
 2, 315.00, 1, GETDATE(), GETDATE());

DECLARE @App1Id BIGINT = SCOPE_IDENTITY();

INSERT INTO agrochemical_application_details 
(application_id, agrochemical_id, agrochemical_name, category, applied_dose,
 unit_measure, treated_area_hectares, unit_cost, total_cost, remark, created_at)
VALUES 
(@App1Id, 'AGR001', 'Karate Zeon', 'INSECTICIDE', 1.5, 'L/ha', 4.50, 40.00, 180.00, NULL, GETDATE()),
(@App1Id, 'AGR002', 'Amistar Top', 'FUNGICIDE', 1.0, 'L/ha', 4.50, 30.00, 135.00, NULL, GETDATE());

-- APLICACIÓN 2: Campo Sur
INSERT INTO agrochemical_applications 
(application_number, field_name, area_hectares, application_date, responsible,
 temperature_celsius, humidity_percentage, wind_conditions, status, remarks,
 total_products, total_cost, active, created_at, updated_at)
VALUES 
('APP-2024-002', 'Campo Sur', 8.00, '2024-09-21', 'Rosa Espinoza',
 26.0, 58.0, 'MODERATE', 'SCHEDULED', 'Control de hongos programado',
 1, 320.00, 1, GETDATE(), GETDATE());

DECLARE @App2Id BIGINT = SCOPE_IDENTITY();

INSERT INTO agrochemical_application_details 
(application_id, agrochemical_id, agrochemical_name, category, applied_dose,
 unit_measure, treated_area_hectares, unit_cost, total_cost, remark, created_at)
VALUES 
(@App2Id, 'AGR003', 'Roundup Max', 'HERBICIDE', 2.0, 'L/ha', 8.00, 20.00, 320.00, NULL, GETDATE());

PRINT '✅ 2 aplicaciones con 3 líneas de detalle insertadas';
PRINT '';

PRINT '--- INSERTANDO MOVIMIENTOS DE INVENTARIO ---';
PRINT '';

-- MOVIMIENTO 1: Entrada por compra
INSERT INTO product_stock_movements 
(movement_number, product_id, product_name, movement_type, quantity, unit_measure,
 unit_cost, total_value, movement_date, reason, warehouse, responsible, remarks, active, created_at, updated_at)
VALUES 
('MOV-2024-001', 'PROD001', 'Fertilizante NPK', 'IN', 100, 'KILOGRAMO',
 45.00, 4500.00, '2024-09-15', 'Compra a proveedor', 'Almacén Central', 'Luis Torres', NULL, 1, GETDATE(), GETDATE());

-- MOVIMIENTO 2: Salida por venta
INSERT INTO product_stock_movements 
(movement_number, product_id, product_name, movement_type, quantity, unit_measure,
 unit_cost, total_value, movement_date, reason, warehouse, responsible, remarks, active, created_at, updated_at)
VALUES 
('MOV-2024-002', 'PROD002', 'Insecticida Lambda', 'OUT', 20, 'LITRO',
 95.00, 1900.00, '2024-09-18', 'Venta a cliente', 'Almacén Central', 'Ana Rojas', 'Pedido PED-2024-001', 1, GETDATE(), GETDATE());

-- MOVIMIENTO 3: Entrada por devolución
INSERT INTO product_stock_movements 
(movement_number, product_id, product_name, movement_type, quantity, unit_measure,
 unit_cost, total_value, movement_date, reason, warehouse, responsible, remarks, active, created_at, updated_at)
VALUES 
('MOV-2024-003', 'PROD003', 'Herbicida Glifosato', 'IN', 5, 'LITRO',
 70.00, 350.00, '2024-09-19', 'Devolución de cliente', 'Almacén Central', 'Pedro Vera', 'Producto sin usar', 1, GETDATE(), GETDATE());

PRINT '✅ 3 movimientos de inventario insertados';
PRINT '';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

PRINT '============================================';
PRINT 'VERIFICACIÓN DE CREACIÓN';
PRINT '============================================';
PRINT '';

-- Contar tablas
SELECT 
    'Tablas creadas' AS Resumen,
    COUNT(*) AS Cantidad
FROM sys.tables 
WHERE name IN ('customer_orders_s4', 'customer_order_details_s4',
               'agrochemical_applications', 'agrochemical_application_details',
               'product_stock_movements');
PRINT '';

-- Contar índices
SELECT 
    'Índices creados' AS Resumen,
    COUNT(*) AS Cantidad
FROM sys.indexes 
WHERE name IN ('idx_numero_pedido', 'idx_customer_id', 'idx_order_id_detail',
               'idx_application_number', 'idx_application_id_detail',
               'idx_movement_number', 'idx_movement_product_id');
PRINT '';

-- Contar registros
SELECT 'Pedidos' AS Tabla, COUNT(*) AS Registros FROM customer_orders_s4
UNION ALL
SELECT 'Detalles Pedidos', COUNT(*) FROM customer_order_details_s4
UNION ALL
SELECT 'Aplicaciones', COUNT(*) FROM agrochemical_applications
UNION ALL
SELECT 'Detalles Aplicaciones', COUNT(*) FROM agrochemical_application_details
UNION ALL
SELECT 'Movimientos', COUNT(*) FROM product_stock_movements;

PRINT '';
PRINT '============================================';
PRINT '✅ SCRIPT COMPLETADO EXITOSAMENTE';
PRINT '============================================';
PRINT '';
PRINT 'RESUMEN:';
PRINT '- Base de datos: avsa_db';
PRINT '- Tablas: 5 (2 pedidos, 2 aplicaciones, 1 movimientos)';
PRINT '- Índices: 7';
PRINT '- Datos de prueba: 8 registros de cabecera + detalles';
PRINT '';
PRINT 'SIGUIENTE PASO:';
PRINT 'Ejecutar el script 02-consultas-reportes.sql para ver los datos';
PRINT '';
