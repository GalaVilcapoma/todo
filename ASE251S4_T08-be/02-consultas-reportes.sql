-- ============================================================================
-- SCRIPT 2: QUERIES AND REPORTS (ALL IN ENGLISH)
-- Project: AVSA - Agroindustrial System
-- Database: avsa_db (SQL Server)
-- Execute manually when you need to query data
-- ============================================================================

USE avsa_db;
GO

PRINT '===========================================';
PRINT 'QUERIES AND REPORTS - AVSA SYSTEM';
PRINT '===========================================';
PRINT '';

-- ============================================================================
-- SECTION 1: STRUCTURE VERIFICATION
-- ============================================================================

PRINT 'SECTION 1: STRUCTURE VERIFICATION';
PRINT '-------------------------------------------';

-- Query 1.1: View all tables
PRINT '1.1. EXISTING TABLES';
SELECT name AS 'Table Name', create_date AS 'Created'
FROM sys.tables 
WHERE name IN ('customer_orders_s4', 'customer_order_details_s4',
               'agrochemical_applications', 'agrochemical_application_details',
               'product_stock_movements')
ORDER BY name;
PRINT '';

-- Query 1.2: View all indexes
PRINT '1.2. INDEXES';
SELECT t.name AS 'Table', i.name AS 'Index', COL_NAME(ic.object_id, ic.column_id) AS 'Column'
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE t.name IN ('customer_orders_s4', 'customer_order_details_s4',
                 'agrochemical_applications', 'agrochemical_application_details',
                 'product_stock_movements')
  AND i.name IS NOT NULL
ORDER BY t.name, i.name;
PRINT '';

-- Query 1.3: Count records
PRINT '1.3. RECORD COUNT';
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

-- ============================================================================
-- SECTION 2: CUSTOMER ORDERS
-- ============================================================================

PRINT 'SECTION 2: CUSTOMER ORDERS';
PRINT '-------------------------------------------';

-- Query 2.1: All orders
PRINT '2.1. ALL ORDERS';
SELECT order_number, customer_name, order_date, status, total
FROM customer_orders_s4
ORDER BY order_date DESC;
PRINT '';

-- Query 2.2: Search order by number
PRINT '2.2. SEARCH ORDER BY NUMBER';
-- Change 'ORD-2024-001' to search
SELECT order_number, customer_name, order_date, status, total
FROM customer_orders_s4
WHERE order_number = 'ORD-2024-001';
PRINT '';

-- Query 2.3: Orders by status
PRINT '2.3. ORDERS BY STATUS';
-- Statuses: PENDING, CONFIRMED, IN_PROCESS, DELIVERED, CANCELLED
SELECT order_number, customer_name, order_date, status, total
FROM customer_orders_s4
WHERE status = 'CONFIRMED'
ORDER BY order_date DESC;
PRINT '';

-- Query 2.4: Orders from customer
PRINT '2.4. ORDERS FROM CUSTOMER';
SELECT order_number, order_date, status, total
FROM customer_orders_s4
WHERE customer_id = 'CUST001'
ORDER BY order_date DESC;
PRINT '';

-- Query 2.5: Pending orders
PRINT '2.5. PENDING ORDERS';
SELECT order_number, customer_name, order_date, estimated_delivery_date, status, total
FROM customer_orders_s4
WHERE status IN ('PENDING', 'CONFIRMED', 'IN_PROCESS')
ORDER BY estimated_delivery_date ASC;
PRINT '';

-- Query 2.6: Complete order details
PRINT '2.6. COMPLETE ORDER DETAILS';
SELECT o.order_number, o.customer_name, d.product_name, d.quantity, d.unit_price, d.subtotal, o.total
FROM customer_orders_s4 o
INNER JOIN customer_order_details_s4 d ON o.id = d.order_id
WHERE o.order_number = 'ORD-2024-001'
ORDER BY d.id;
PRINT '';

-- Query 2.7: Summary by status
PRINT '2.7. SUMMARY BY STATUS';
SELECT status, COUNT(*) AS 'Quantity', SUM(total) AS 'Total'
FROM customer_orders_s4
GROUP BY status
ORDER BY COUNT(*) DESC;
PRINT '';

-- Query 2.8: Top 5 customers
PRINT '2.8. TOP 5 CUSTOMERS';
SELECT TOP 5 customer_name, COUNT(*) AS 'Orders', SUM(total) AS 'Amount'
FROM customer_orders_s4
GROUP BY customer_name
ORDER BY SUM(total) DESC;
PRINT '';

-- Query 2.9: Best-selling products
PRINT '2.9. BEST-SELLING PRODUCTS';
SELECT product_name, SUM(quantity) AS 'Total Qty', SUM(subtotal) AS 'Amount'
FROM customer_order_details_s4
GROUP BY product_name
ORDER BY SUM(quantity) DESC;
PRINT '';

-- ============================================================================
-- SECTION 3: AGROCHEMICAL APPLICATIONS
-- ============================================================================

PRINT 'SECTION 3: AGROCHEMICAL APPLICATIONS';
PRINT '-------------------------------------------';

-- Query 3.1: All applications
PRINT '3.1. ALL APPLICATIONS';
SELECT application_number, field_name, area_hectares, application_date, status, total_cost
FROM agrochemical_applications
ORDER BY application_date DESC;
PRINT '';

-- Query 3.2: Search application
PRINT '3.2. SEARCH APPLICATION';
SELECT application_number, field_name, application_date, responsible, status, total_cost
FROM agrochemical_applications
WHERE application_number = 'APP-2024-001';
PRINT '';

-- Query 3.3: Applications by status
PRINT '3.3. APPLICATIONS BY STATUS';
SELECT application_number, field_name, application_date, status, total_cost
FROM agrochemical_applications
WHERE status = 'COMPLETED'
ORDER BY application_date DESC;
PRINT '';

-- Query 3.4: Complete application details
PRINT '3.4. APPLICATION DETAILS';
SELECT a.application_number, a.field_name, d.agrochemical_name, d.applied_dose, d.unit_measure, d.total_cost
FROM agrochemical_applications a
INNER JOIN agrochemical_application_details d ON a.id = d.application_id
WHERE a.application_number = 'APP-2024-001'
ORDER BY d.id;
PRINT '';

-- Query 3.5: Most used agrochemicals
PRINT '3.5. MOST USED AGROCHEMICALS';
SELECT agrochemical_name, COUNT(*) AS 'Times Used', SUM(total_cost) AS 'Total Cost'
FROM agrochemical_application_details
GROUP BY agrochemical_name
ORDER BY COUNT(*) DESC;
PRINT '';

-- Query 3.6: Summary by status
PRINT '3.6. APPLICATIONS SUMMARY';
SELECT status, COUNT(*) AS 'Quantity', SUM(total_cost) AS 'Total Cost'
FROM agrochemical_applications
GROUP BY status
ORDER BY COUNT(*) DESC;
PRINT '';

-- ============================================================================
-- SECTION 4: INVENTORY MOVEMENTS
-- ============================================================================

PRINT 'SECTION 4: INVENTORY MOVEMENTS';
PRINT '-------------------------------------------';

-- Query 4.1: All movements
PRINT '4.1. ALL MOVEMENTS';
SELECT movement_number, product_name, movement_type, quantity, total_value, movement_date
FROM product_stock_movements
ORDER BY movement_date DESC;
PRINT '';

-- Query 4.2: Entries only (IN)
PRINT '4.2. ENTRIES (IN)';
SELECT movement_number, product_name, quantity, total_value, movement_date, reason
FROM product_stock_movements
WHERE movement_type = 'IN'
ORDER BY movement_date DESC;
PRINT '';

-- Query 4.3: Exits only (OUT)
PRINT '4.3. EXITS (OUT)';
SELECT movement_number, product_name, quantity, total_value, movement_date, reason
FROM product_stock_movements
WHERE movement_type = 'OUT'
ORDER BY movement_date DESC;
PRINT '';

-- Query 4.4: Product history
PRINT '4.4. PRODUCT HISTORY';
SELECT movement_number, movement_type, quantity, movement_date, reason
FROM product_stock_movements
WHERE product_id = 'PROD001'
ORDER BY movement_date DESC;
PRINT '';

-- Query 4.5: Summary by type
PRINT '4.5. SUMMARY BY TYPE';
SELECT movement_type, COUNT(*) AS 'Movements', SUM(total_value) AS 'Total Value'
FROM product_stock_movements
GROUP BY movement_type;
PRINT '';

-- ============================================================================
-- SECTION 5: GENERAL REPORTS
-- ============================================================================

PRINT 'SECTION 5: GENERAL REPORTS';
PRINT '-------------------------------------------';

-- Query 5.1: General statistics
PRINT '5.1. GENERAL STATISTICS';
SELECT 'Total Orders' AS 'Metric', COUNT(*) AS 'Value' FROM customer_orders_s4
UNION ALL
SELECT 'Total Sales', SUM(total) FROM customer_orders_s4
UNION ALL
SELECT 'Total Applications', COUNT(*) FROM agrochemical_applications
UNION ALL
SELECT 'Total Movements', COUNT(*) FROM product_stock_movements;
PRINT '';

-- Query 5.2: Current month orders
PRINT '5.2. CURRENT MONTH ORDERS';
SELECT order_number, customer_name, order_date, status, total
FROM customer_orders_s4
WHERE YEAR(order_date) = YEAR(GETDATE()) AND MONTH(order_date) = MONTH(GETDATE())
ORDER BY order_date DESC;
PRINT '';

-- Query 5.3: Sales by date
PRINT '5.3. SALES BY DATE';
SELECT order_date, COUNT(*) AS 'Orders', SUM(total) AS 'Total'
FROM customer_orders_s4
GROUP BY order_date
ORDER BY order_date DESC;
PRINT '';

-- Query 5.4: Last 10 movements
PRINT '5.4. LAST 10 MOVEMENTS';
SELECT TOP 10 movement_number, product_name, movement_type, quantity, movement_date
FROM product_stock_movements
ORDER BY created_at DESC;
PRINT '';

PRINT '===========================================';
PRINT 'QUERIES COMPLETED';
PRINT '===========================================';
