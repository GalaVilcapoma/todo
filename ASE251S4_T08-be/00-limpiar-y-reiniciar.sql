-- ============================================================================
-- SCRIPT 0: LIMPIEZA COMPLETA Y REINICIO
-- Proyecto: AVSA - Sistema Agroindustrial
-- Base de datos: avsa_db (SQL Server)
-- ============================================================================
--
-- PROPÓSITO:
-- Este script ELIMINA completamente todas las tablas antiguas para que
-- puedas ejecutar el script 01-crear-estructura-completa.sql desde cero.
--
-- EJECUTAR: Solo cuando quieras empezar de cero limpiando todo
--
-- ⚠️ ADVERTENCIA:
-- Esto BORRARÁ TODOS LOS DATOS. Solo úsalo si quieres reiniciar.
-- ============================================================================

USE avsa_db;
GO

PRINT '============================================';
PRINT 'LIMPIEZA COMPLETA DE BASE DE DATOS';
PRINT '============================================';
PRINT '';

-- Eliminar tablas en orden (primero detalles, luego cabeceras)
PRINT 'Eliminando tablas antiguas...';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'customer_order_details_s4')
BEGIN
    DROP TABLE customer_order_details_s4;
    PRINT '✅ Tabla customer_order_details_s4 eliminada';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'customer_orders_s4')
BEGIN
    DROP TABLE customer_orders_s4;
    PRINT '✅ Tabla customer_orders_s4 eliminada';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'agrochemical_application_details')
BEGIN
    DROP TABLE agrochemical_application_details;
    PRINT '✅ Tabla agrochemical_application_details eliminada';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'agrochemical_applications')
BEGIN
    DROP TABLE agrochemical_applications;
    PRINT '✅ Tabla agrochemical_applications eliminada';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'product_stock_movements')
BEGIN
    DROP TABLE product_stock_movements;
    PRINT '✅ Tabla product_stock_movements eliminada';
END

PRINT '';
PRINT '============================================';
PRINT '✅ LIMPIEZA COMPLETADA';
PRINT '============================================';
PRINT '';
PRINT 'Ahora ejecuta: 01-crear-estructura-completa.sql';
PRINT '';
