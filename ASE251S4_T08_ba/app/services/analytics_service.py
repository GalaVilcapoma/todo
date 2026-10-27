from app.repositories.analytics_repository import AnalyticsRepository
from typing import List, Dict, Any

class AnalyticsService:

    @staticmethod
    async def get_resumen_productos_por_categoria() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_resumen_productos_por_categoria()

    @staticmethod
    async def get_ranking_fabricantes_agroquimicos() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_ranking_fabricantes_agroquimicos()

    @staticmethod
    async def get_alerta_reabastecimiento() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_alerta_reabastecimiento()

    @staticmethod
    async def get_resumen_clientes() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_resumen_clientes()

    @staticmethod
    async def get_clientes_por_tipo() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_clientes_por_tipo()

    @staticmethod
    async def get_kpis_clientes() -> Dict[str, Any]:
        return await AnalyticsRepository.aggregate_kpis_clientes()

    @staticmethod
    async def get_agroquimicos_por_categoria() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_agroquimicos_por_categoria()

    @staticmethod
    async def get_agroquimicos_vencimiento_senasa() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_agroquimicos_vencimiento_senasa()

    @staticmethod
    async def get_ingredientes_activos() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_ingredientes_activos()

    @staticmethod
    async def get_carencia_por_categoria() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_carencia_por_categoria()

    @staticmethod
    async def get_dosificacion_por_tipo() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_dosificacion_por_tipo()

    @staticmethod
    async def get_rotacion_inventario() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_rotacion_inventario()

    @staticmethod
    async def get_productos_mayor_valor_stock() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_productos_mayor_valor_stock()

    @staticmethod
    async def get_productos_por_origen() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_productos_por_origen()

    @staticmethod
    async def get_top_clientes_potencial() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_top_clientes_potencial()

    @staticmethod
    async def get_clientes_por_ciudad() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_clientes_por_ciudad()

    @staticmethod
    async def get_pedidos_por_cliente() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_pedidos_por_cliente()

    @staticmethod
    async def get_movimientos_stock_valorados() -> List[Dict[str, Any]]:
        return await AnalyticsRepository.aggregate_movimientos_stock_valorados()
