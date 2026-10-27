"""
Script de prueba rápida para los 18 endpoints analíticos
Ejecutar: python test_endpoints.py
"""
import asyncio
import sys
from app.services.analytics_service import AnalyticsService
from app.database.connection import connect_to_mongo, close_mongo_connection

async def test_all_endpoints():
    """Prueba todos los endpoints analíticos"""
    
    print("=" * 80)
    print("🚀 INICIANDO PRUEBAS DE LOS 18 ENDPOINTS ANALÍTICOS")
    print("=" * 80)
    
    # Conectar a MongoDB
    print("\n📡 Conectando a MongoDB...")
    await connect_to_mongo()
    print("✅ Conexión establecida\n")
    
    endpoints = [
        ("1. Resumen por Categoría", AnalyticsService.get_resumen_productos_por_categoria),
        ("2. Ranking de Fabricantes", AnalyticsService.get_ranking_fabricantes_agroquimicos),
        ("3. Alerta de Reabastecimiento", AnalyticsService.get_alerta_reabastecimiento),
        ("4. KPIs de Clientes", AnalyticsService.get_kpis_clientes),
        ("5. Clientes por País", AnalyticsService.get_resumen_clientes),
        ("6. Clientes por Tipo", AnalyticsService.get_clientes_por_tipo),
        ("7. Agroquímicos por Categoría", AnalyticsService.get_agroquimicos_por_categoria),
        ("8. Vencimiento SENASA", AnalyticsService.get_agroquimicos_vencimiento_senasa),
        ("9. Ingredientes Activos", AnalyticsService.get_ingredientes_activos),
        ("10. Carencia por Categoría", AnalyticsService.get_carencia_por_categoria),
        ("11. Dosificación por Tipo", AnalyticsService.get_dosificacion_por_tipo),
        ("12. Rotación de Inventario", AnalyticsService.get_rotacion_inventario),
        ("13. Productos Mayor Valor Stock", AnalyticsService.get_productos_mayor_valor_stock),
        ("14. Productos por Origen", AnalyticsService.get_productos_por_origen),
        ("15. Top Clientes Potencial", AnalyticsService.get_top_clientes_potencial),
        ("16. Clientes por Ciudad", AnalyticsService.get_clientes_por_ciudad),
        ("17. Pedidos por Cliente", AnalyticsService.get_pedidos_por_cliente),
        ("18. Movimientos Stock Valorados", AnalyticsService.get_movimientos_stock_valorados),
    ]
    
    success_count = 0
    failed_count = 0
    
    for name, func in endpoints:
        try:
            print(f"📊 Probando: {name}")
            result = await func()
            
            if isinstance(result, list):
                count = len(result)
                print(f"   ✅ OK - {count} registros retornados")
            elif isinstance(result, dict):
                print(f"   ✅ OK - Datos: {result}")
            else:
                print(f"   ✅ OK - Tipo: {type(result)}")
            
            success_count += 1
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            failed_count += 1
        print()
    
    # Cerrar conexión
    await close_mongo_connection()
    
    print("=" * 80)
    print(f"📈 RESUMEN DE PRUEBAS:")
    print(f"   ✅ Exitosas: {success_count}/18")
    print(f"   ❌ Fallidas: {failed_count}/18")
    print("=" * 80)
    
    return failed_count == 0

if __name__ == "__main__":
    result = asyncio.run(test_all_endpoints())
    sys.exit(0 if result else 1)
