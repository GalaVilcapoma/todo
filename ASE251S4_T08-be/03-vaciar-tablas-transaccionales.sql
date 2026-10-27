-- ============================================================================
-- SCRIPT 3: VACIAR TABLAS TRANSACCIONALES
-- Para presentación: Dejar tablas creadas pero SIN datos
-- ============================================================================

USE avsa_db;
GO

PRINT '===========================================';
PRINT 'VACIANDO TABLAS TRANSACCIONALES';
PRINT '===========================================';
PRINT '';

-- Eliminar datos (primero detalles, luego cabeceras)
DELETE FROM customer_order_details_s4;
DELETE FROM customer_orders_s4;
DELETE FROM agrochemical_application_details;
DELETE FROM agrochemical_applications;
DELETE FROM product_stock_movements;
GO

-- Reiniciar contadores de identidad a 0
DBCC CHECKIDENT ('customer_orders_s4', RESEED, 0);
DBCC CHECKIDENT ('customer_order_details_s4', RESEED, 0);
DBCC CHECKIDENT ('agrochemical_applications', RESEED, 0);
DBCC CHECKIDENT ('agrochemical_application_details', RESEED, 0);
DBCC CHECKIDENT ('product_stock_movements', RESEED, 0);
GO

PRINT '✅ Tablas vaciadas correctamente';
PRINT '';

-- Verificar que están vacías
SELECT 'Orders' AS 'Table', COUNT(*) AS 'Records' FROM customer_orders_s4
UNION ALL
SELECT 'Order Details', COUNT(*) FROM customer_order_details_s4
UNION ALL
SELECT 'Applications', COUNT(*) FROM agrochemical_applications
UNION ALL
SELECT 'Application Details', COUNT(*) FROM agrochemical_application_details
UNION ALL
SELECT 'Movements', COUNT(*) FROM product_stock_movements;

PRINT '';
PRINT '===========================================';
PRINT 'LISTO PARA PRESENTACIÓN';
PRINT 'Tablas creadas pero SIN datos';
PRINT '===========================================';
