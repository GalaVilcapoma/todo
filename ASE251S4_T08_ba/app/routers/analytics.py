from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.schemas.analytics_schema import ApiResponseContainer
from app.services.analytics_service import AnalyticsService

router = APIRouter(
    prefix="/analytics",
    tags=["Servicios Analíticos - Toma de Decisiones Empresariales"],
)

def _utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


# -----------------------------------------------------------------------------
# ENDPOINT 1: Resumen Analítico de Productos por Categoría
# -----------------------------------------------------------------------------
@router.get(
    "/productos/resumen-categoria",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="1. Resumen Analítico de Productos por Categoría",
    description="""
    ### Pipeline de Agregación MongoDB:
    Agrupa los productos activos por su categoría para generar indicadores clave de negocio:
    - **totalProductos**: Cantidad de productos en la categoría.
    - **stockTotal**: Suma del stock disponible en almacén.
    - **valorTotalInventario**: Valoración económica total en soles (S/).
    - **precioPromedio**: Precio unitario promedio redondeado.
    - **productosStockBajo**: Conteo de productos en nivel crítico de inventario.

    *Orientado a la toma de decisiones empresariales sobre valoración de inventario y rotación.*
    """,
)
async def get_resumen_productos_categoria():
    try:
        data = await AnalyticsService.get_resumen_productos_por_categoria()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar el pipeline analítico por categoría: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 2: Ranking Analítico de Fabricantes de Agroquímicos
# -----------------------------------------------------------------------------
@router.get(
    "/agroquimicos/ranking-fabricantes",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="2. Ranking Analítico de Fabricantes de Agroquímicos",
    description="""
    ### Pipeline de Agregación MongoDB:
    Analiza la oferta de marcas/proveedores en la colección `agrochemicals` activos:
    - **fabricante**: Marca o laboratorio fabricante.
    - **totalProductos**: Cantidad de agroquímicos registrados.
    - **categoriasManejadas**: Conjunto sin duplicados de familias de pesticidas/fertilizantes.
    - **carenciaPromedioDias**: Promedio de días de espera fitosanitaria (SENASA).
    - **dosisMaximaPromedio**: Dosis media aplicada por hectárea.

    *Permite evaluar la concentración de compras por fabricante y la regulación sanitaria SENASA.*
    """,
)
async def get_ranking_fabricantes():
    try:
        data = await AnalyticsService.get_ranking_fabricantes_agroquimicos()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar el pipeline analítico de fabricantes: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 3: Alerta Analítica de Reabastecimiento Crítico
# -----------------------------------------------------------------------------
@router.get(
    "/inventario/alerta-reabastecimiento",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="3. Alerta Analítica de Reabastecimiento Crítico de Inventario",
    description="""
    ### Pipeline de Agregación MongoDB:
    Filtra y analiza los productos cuyo `stockActual` es menor o igual a su `stockMinimo`:
    - **deficitStock**: Unidades faltantes para reponer la reserva mínima de seguridad.
    - **costoReabastecimientoEstimado**: Presupuesto estimado en soles (S/) para cubrir el déficit.
    - **nivelRiesgo**: Categorización dinámica:
      - `CRITICO`: Stock totalmente agotado (0 unidades).
      - `ALTO`: Stock menor al 50% del mínimo requerido.
      - `MEDIO`: Stock cercano al mínimo.

    *Asistencia directa en la toma de decisiones empresariales de abastecimiento y gestión presupuestaria.*
    """,
)
async def get_alerta_reabastecimiento():
    try:
        data = await AnalyticsService.get_alerta_reabastecimiento()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar la alerta analítica de reabastecimiento: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 4: KPIs Generales de Clientes
# -----------------------------------------------------------------------------
@router.get(
    "/clientes/kpis",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="4. KPIs Generales de Cartera de Clientes",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `customers`
    Genera los indicadores clave de negocio (KPIs) sobre la cartera completa de clientes:
    - **totalClientes**: Clientes registrados en el sistema.
    - **clientesActivos / clientesInactivos**: Estado actual de la cartera.
    - **totalPaises**: Diversidad geográfica de la cartera activa.
    - **totalTiposCliente**: Variedad de segmentos comerciales atendidos.
    - **tasaActividad**: Porcentaje de clientes activos sobre el total (%).

    *Visión ejecutiva para la toma de decisiones sobre expansión y retención de clientes.*
    """,
)
async def get_kpis_clientes():
    try:
        data = await AnalyticsService.get_kpis_clientes()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": 1,
            "data": [data],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener KPIs de clientes: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 5: Distribución de Clientes por País
# -----------------------------------------------------------------------------
@router.get(
    "/clientes/por-pais",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="5. Distribución Analítica de Clientes por País",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `customers`
    Agrupa los clientes activos por país de origen para análisis de cobertura geográfica:
    - **pais**: País de sede o registro del cliente.
    - **totalClientes**: Cantidad de clientes activos por país.

    Ordenado de mayor a menor concentración geográfica.

    *Asistencia en la toma de decisiones sobre mercados objetivo y expansión internacional.*
    """,
)
async def get_clientes_por_pais():
    try:
        data = await AnalyticsService.get_resumen_clientes()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar el pipeline analítico por país: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 6: Distribución de Clientes por Tipo
# -----------------------------------------------------------------------------
@router.get(
    "/clientes/por-tipo",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="6. Segmentación Analítica de Clientes por Tipo Comercial",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `customers`
    Segmenta la cartera de clientes activos por su clasificación comercial:
    - **tipoCliente**: Segmento comercial (exportador, importador, mayorista, etc.).
    - **totalClientes**: Cantidad de clientes activos en ese segmento.
    - **porcentaje**: Peso porcentual del segmento sobre el total de clientes activos.

    Ordenado por mayor volumen de clientes por segmento.

    *Permite decisiones sobre estrategias de ventas diferenciadas por tipo de cliente.*
    """,
)
async def get_clientes_por_tipo():
    try:
        data = await AnalyticsService.get_clientes_por_tipo()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar el pipeline analítico por tipo: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 7: Distribución de Agroquímicos por Categoría
# -----------------------------------------------------------------------------
@router.get(
    "/agroquimicos/por-categoria",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="7. Distribución de Agroquímicos por Categoría Fitosanitaria",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `agrochemicals`
    Analiza la composición del portafolio de productos fitosanitarios por categoría:
    - **categoria**: Tipo de agroquímico (HERBICIDE, INSECTICIDE, FUNGICIDE, FERTILIZER, BIOSTIMULANT).
    - **totalProductos**: Cantidad de productos activos en esa categoría.
    - **dosisPromedioHa**: Dosis promedio de aplicación por hectárea.
    - **carenciaPromedioDias**: Tiempo promedio de espera antes de cosecha (SENASA).

    *Permite evaluar el balance del portafolio y la composición de productos fitosanitarios.*
    """,
)
async def get_agroquimicos_por_categoria():
    try:
        data = await AnalyticsService.get_agroquimicos_por_categoria()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar el pipeline de categorías: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 8: Agroquímicos con Registro SENASA Próximo a Vencer
# -----------------------------------------------------------------------------
@router.get(
    "/agroquimicos/vencimiento-senasa",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="8. Alerta de Vencimiento de Registros SENASA",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `agrochemicals`
    Identifica agroquímicos cuyo registro SENASA vence en los próximos 6 meses:
    - **nombreComercial**: Nombre comercial del producto.
    - **fabricante**: Marca o laboratorio.
    - **categoria**: Tipo fitosanitario.
    - **registroSenasa**: Número de registro oficial SENASA.
    - **fechaVencimiento**: Fecha de expiración del registro.
    - **diasParaVencer**: Días restantes hasta el vencimiento.
    - **estadoAlerta**: URGENTE (≤30 días), ATENCION (≤90 días), PROXIMAMENTE (≤180 días).

    *Control regulatorio preventivo para evitar comercialización de productos sin registro vigente.*
    """,
)
async def get_vencimiento_senasa():
    try:
        data = await AnalyticsService.get_agroquimicos_vencimiento_senasa()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar alerta de vencimiento SENASA: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 9: Análisis de Ingredientes Activos Más Utilizados
# -----------------------------------------------------------------------------
@router.get(
    "/agroquimicos/ingredientes-activos",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="9. Ranking de Ingredientes Activos Más Utilizados",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `agrochemicals`
    Analiza los principios activos con mayor presencia en el portafolio:
    - **ingredienteActivo**: Compuesto químico o biológico base.
    - **totalFormulaciones**: Número de productos que contienen ese ingrediente.
    - **totalCategorias**: Diversidad de usos fitosanitarios (herbicida, fungicida, etc.).
    - **totalFabricantes**: Cantidad de proveedores que ofrecen ese principio activo.
    - **carenciaPromedioDias**: Tiempo promedio de espera antes de cosecha.

    Limitado a los 20 ingredientes activos más comunes.

    *Permite evaluar la diversificación de principios activos y dependencia de compuestos específicos.*
    """,
)
async def get_ingredientes_activos():
    try:
        data = await AnalyticsService.get_ingredientes_activos()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar ingredientes activos: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 10: Comparativa de Tiempos de Carencia por Categoría
# -----------------------------------------------------------------------------
@router.get(
    "/agroquimicos/carencia-por-categoria",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="10. Análisis de Tiempos de Carencia Fitosanitaria por Categoría",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `agrochemicals`
    Compara los períodos de carencia (días antes de cosecha) por tipo de agroquímico:
    - **categoria**: Tipo fitosanitario.
    - **carenciaMinima**: Menor tiempo de espera registrado (días).
    - **carenciaMaxima**: Mayor tiempo de espera registrado (días).
    - **carenciaPromedio**: Promedio de días de carencia.
    - **totalProductos**: Cantidad de productos en esa categoría.
    - **rangoCarencia**: Rango textual del período de espera.

    *Útil para la planificación de cosecha y cumplimiento de normativas fitosanitarias SENASA.*
    """,
)
async def get_carencia_por_categoria():
    try:
        data = await AnalyticsService.get_carencia_por_categoria()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar carencia por categoría: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 11: Análisis de Dosificación por Tipo de Agroquímico
# -----------------------------------------------------------------------------
@router.get(
    "/agroquimicos/dosificacion-por-tipo",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="11. Análisis de Dosificación y Costos de Aplicación por Tipo",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `agrochemicals`
    Analiza las dosis de aplicación por categoría fitosanitaria:
    - **categoria**: Tipo de agroquímico.
    - **dosisMinima**: Menor dosis registrada.
    - **dosisMaxima**: Mayor dosis registrada.
    - **dosisPromedio**: Dosis promedio de aplicación.
    - **totalProductos**: Cantidad de productos analizados.
    - **unidadMedida**: kg/ha para fertilizantes, L/ha para fitosanitarios.

    *Optimización de costos operativos y planificación de compras por hectárea cultivada.*
    """,
)
async def get_dosificacion_por_tipo():
    try:
        data = await AnalyticsService.get_dosificacion_por_tipo()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar dosificación por tipo: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 12: Rotación de Inventario (MongoDB + SQL Server)
# -----------------------------------------------------------------------------
@router.get(
    "/inventario/rotacion",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="12. Rotación de Inventario en los Últimos 90 Días",
    description="""
    ### Indicador Transversal — MongoDB (`products`) + SQL Server (`product_stock_movements`)
    Calcula la rotación real de cada producto a partir de los movimientos valorados:
    - **entradas90Dias / salidas90Dias**: Unidades ingresadas y despachadas en 90 días.
    - **valorSalidas90Dias**: Valor económico despachado en soles (S/).
    - **rotacion**: Salidas del período divididas entre el stock actual.
    - **clasificacionRotacion**: `ALTA` (=1), `MEDIA` (=0.3) o `BAJA` (<0.3).
    - **movimientos90Dias / ultimoMovimiento**: Actividad reciente del producto.

    *Permite detectar capital inmovilizado y priorizar acciones de liquidación o reposición.*
    """,
)
async def get_rotacion_inventario():
    try:
        data = await AnalyticsService.get_rotacion_inventario()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular la rotación de inventario: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 13: Productos con Mayor Valor de Stock
# -----------------------------------------------------------------------------
@router.get(
    "/productos/mayor-valor-stock",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="13. Ranking de Productos con Mayor Valor de Stock",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `products`
    Ordena los productos activos por valor económico de inventario:
    - **valorStock**: `stockActual × precioUnitario` en soles (S/).
    - **participacion**: Peso del producto sobre el valor total del inventario (%).
    - **ranking**: Posición del producto (top 15).
    - **origen / categoria / stockMinimo**: Contexto para decisiones de compra.

    *Apoya la priorización de capital inmovilizado y la protección del inventario de mayor valor.*
    """,
)
async def get_productos_mayor_valor_stock():
    try:
        data = await AnalyticsService.get_productos_mayor_valor_stock()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular productos de mayor valor: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 14: Productos por Origen
# -----------------------------------------------------------------------------
@router.get(
    "/productos/por-origen",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="14. Distribución de Productos por Origen",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `products`
    Agrupa los productos activos según su zona de procedencia:
    - **origen**: Zona o centro de abastecimiento.
    - **totalProductos / stockTotal**: Volumen del portafolio y existencias.
    - **valorTotalStock / precioPromedio**: Valor económico y precio medio (S/).
    - **participacion**: Peso del origen sobre el total de productos (%).

    *Permite diversificar el abastecimiento y evaluar el riesgo logístico por zona.*
    """,
)
async def get_productos_por_origen():
    try:
        data = await AnalyticsService.get_productos_por_origen()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al agrupar productos por origen: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 15: Top Clientes Potenciales (MongoDB + SQL Server)
# -----------------------------------------------------------------------------
@router.get(
    "/clientes/top-potencial",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="15. Top Clientes con Mayor Potencial Comercial",
    description="""
    ### Indicador Transversal — MongoDB (`customers`) + SQL Server (`customer_orders_s4`)
    Cruza la ficha maestra del cliente con su historial transaccional:
    - **montoTotalComprado / ticketPromedio**: Valor y ticket medio por pedido (S/).
    - **totalPedidos / pedidosEntregados**: Frecuencia y cumplimiento de pedidos.
    - **diasDesdeUltimoPedido**: Recencia de compra para acciones de reactivación.
    - **segmentoPotencial**: `VIP` (=S/ 50 000), `ALTO` (=S/ 15 000), `MEDIO` (=S/ 5 000) o `BAJO`.
    - **indicePotencial**: Métrica compuesta de monto y frecuencia.

    *Prioriza la cartera comercial para fidelización y asignación de fuerza de ventas.*
    """,
)
async def get_top_clientes_potencial():
    try:
        data = await AnalyticsService.get_top_clientes_potencial()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular el top de clientes potenciales: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 16: Clientes por Ciudad
# -----------------------------------------------------------------------------
@router.get(
    "/clientes/por-ciudad",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="16. Distribución de Clientes por Ciudad",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `customers`
    Agrupa los clientes activos por ciudad y país:
    - **ciudad / pais**: Ubicación geográfica del cliente.
    - **totalClientes**: Cantidad de clientes activos en la ciudad.
    - **porcentaje**: Peso sobre el total de clientes activos (%).

    *Apoya la planificación territorial de ventas, distribución y visitas comerciales.*
    """,
)
async def get_clientes_por_ciudad():
    try:
        data = await AnalyticsService.get_clientes_por_ciudad()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al agrupar clientes por ciudad: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 17: Pedidos por Cliente (SQL Server + MongoDB)
# -----------------------------------------------------------------------------
@router.get(
    "/pedidos/por-cliente",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="17. Pedidos por Cliente con Tasa de Cumplimiento",
    description="""
    ### Indicador Transversal — SQL Server (`customer_orders_s4`) + MongoDB (`customers`)
    Consolida el historial de pedidos por cliente:
    - **totalPedidos / montoTotal / ticketPromedio**: Volumen y valor facturado (S/).
    - **pedidosEntregados / pedidosCancelados**: Estado operativo de los pedidos.
    - **tasaCumplimiento**: Porcentaje de pedidos entregados sobre el total.
    - **primerPedido / ultimoPedido**: Antigüedad y recencia de la relación comercial.

    *Evalúa concentración de ventas, cumplimiento logístico y riesgo de abandono.*
    """,
)
async def get_pedidos_por_cliente():
    try:
        data = await AnalyticsService.get_pedidos_por_cliente()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al consolidar pedidos por cliente: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 18: Movimientos de Stock Valorados (SQL Server + MongoDB)
# -----------------------------------------------------------------------------
@router.get(
    "/inventario/movimientos-valorados",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="18. Movimientos de Stock Valorados por Producto",
    description="""
    ### Indicador Transversal — SQL Server (`product_stock_movements`) + MongoDB (`products`)
    Valoriza las entradas y salidas de almacén por producto:
    - **entradas / salidas**: Unidades movilizadas en el período analizado.
    - **valorEntradas / valorSalidas**: Valor económico de cada flujo (S/).
    - **valorNeto**: Diferencia valorizada (entradas - salidas).
    - **estadoBalance**: `SUPERAVIT` si el neto es positivo, `DEFICIT` si es negativo.
    - **totalMovimientos / ultimoMovimiento**: Intensidad y recencia de la actividad.

    *Controla el flujo valorizado del almacén y detecta desbalances de inventario.*
    """,
)
async def get_movimientos_stock_valorados():
    try:
        data = await AnalyticsService.get_movimientos_stock_valorados()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al valorizar los movimientos de stock: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 12: Análisis de Rotación de Inventario
# -----------------------------------------------------------------------------
@router.get(
    "/inventario/rotacion",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="12. Análisis de Rotación de Inventario por Producto",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `productos`
    Identifica productos con diferente velocidad de rotación según su stock:
    - **valorInventario**: Valor monetario inmovilizado en ese producto.
    - **diasStockEstimado**: Estimación de días de cobertura con el stock actual.
    - **clasificacionRotacion**: LENTA (>3x stock mínimo), MEDIA (1.5-3x), RAPIDA (<1.5x).

    Ordenado por mayor valor de inventario inmovilizado.

    *Permite identificar productos de baja rotación que ocupan capital de trabajo.*
    """,
)
async def get_rotacion_inventario():
    try:
        data = await AnalyticsService.get_rotacion_inventario()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar rotación de inventario: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 13: Productos con Mayor Valor en Stock
# -----------------------------------------------------------------------------
@router.get(
    "/productos/mayor-valor-stock",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="13. Productos con Mayor Valor en Stock",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `productos`
    Lista los 20 productos con mayor valoración de inventario actual:
    - **valorTotalStock**: Valoración del inventario disponible (stock × precio).
    - **porcentajeStock**: Nivel de stock actual respecto al mínimo requerido (%).

    Ordenado de mayor a menor valor total en stock.

    *Priorización de seguridad física y control de inventario de alto valor económico.*
    """,
)
async def get_productos_mayor_valor_stock():
    try:
        data = await AnalyticsService.get_productos_mayor_valor_stock()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar productos de mayor valor: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 14: Productos por Origen Geográfico
# -----------------------------------------------------------------------------
@router.get(
    "/productos/por-origen",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="14. Análisis de Productos por Origen Geográfico",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `productos`
    Agrupa los productos activos por país de origen/fabricación:
    - **paisOrigen**: País de procedencia del producto.
    - **totalProductos**: Cantidad de productos de ese origen.
    - **stockTotal**: Unidades totales disponibles de ese origen.
    - **valorTotal**: Valoración total del inventario por origen.
    - **precioPromedio**: Precio unitario promedio de productos de ese origen.
    - **totalCategorias**: Diversidad de categorías por país.

    Ordenado por mayor valoración total de inventario.

    *Análisis de dependencia de proveedores por país y diversificación geográfica.*
    """,
)
async def get_productos_por_origen():
    try:
        data = await AnalyticsService.get_productos_por_origen()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar productos por origen: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 15: Top Clientes por Potencial de Compra
# -----------------------------------------------------------------------------
@router.get(
    "/clientes/top-potencial",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="15. Top Clientes por Potencial de Compra",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `customers`
    Clasifica a los clientes activos según su potencial comercial:
    - **potencialCompra**: ALTO (exportador/importador), MEDIO (mayorista/distribuidor), BAJO (otros).
    - **prioridad**: Valor numérico de 1 a 5 para ordenamiento.
    - **customerType**: Tipo de cliente que determina el potencial.

    Limitado a los 30 clientes con mayor prioridad comercial.

    *Asignación estratégica de recursos comerciales y focalización de esfuerzos de venta.*
    """,
)
async def get_top_clientes_potencial():
    try:
        data = await AnalyticsService.get_top_clientes_potencial()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar top clientes potenciales: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 16: Clientes por Ciudad/Región
# -----------------------------------------------------------------------------
@router.get(
    "/clientes/por-ciudad",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="16. Distribución de Clientes por Ciudad/Región",
    description="""
    ### Pipeline de Agregación MongoDB — Colección: `customers`
    Agrupa los clientes activos por ubicación geográfica (país + ciudad):
    - **pais**: País donde está ubicado el cliente.
    - **ciudad**: Ciudad específica de operación.
    - **totalClientes**: Cantidad de clientes en esa ubicación.
    - **diversidadTipos**: Cantidad de tipos diferentes de clientes en esa ciudad.

    Ordenado por mayor concentración de clientes por ciudad.

    *Planificación de rutas comerciales, logística y expansión territorial.*
    """,
)
async def get_clientes_por_ciudad():
    try:
        data = await AnalyticsService.get_clientes_por_ciudad()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar clientes por ciudad: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 17: Análisis de Pedidos por Cliente (SQL Server + MongoDB)
# -----------------------------------------------------------------------------
@router.get(
    "/pedidos/por-cliente",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="17. Análisis de Pedidos por Cliente (Indicador Transversal)",
    description="""
    ### Análisis Transversal: SQL Server + MongoDB
    Combina datos transaccionales de pedidos (SQL Server) con maestro de clientes (MongoDB):
    - **totalPedidos**: Cantidad total de pedidos históricos del cliente.
    - **pedidosPendientes**: Pedidos en proceso o confirmados.
    - **pedidosEntregados**: Pedidos completados exitosamente.
    - **montoTotalAcumulado**: Facturación total generada por el cliente.
    - **ticketPromedio**: Monto promedio por pedido.
    - **ultimoPedidoFecha**: Fecha del pedido más reciente.

    Ordenado por mayor volumen de facturación acumulada.

    *Identificación de clientes frecuentes, valoración de cartera y estrategias de fidelización.*
    """,
)
async def get_pedidos_por_cliente():
    try:
        data = await AnalyticsService.get_pedidos_por_cliente()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar pedidos por cliente: {str(e)}",
        )


# -----------------------------------------------------------------------------
# ENDPOINT 18: Movimientos de Stock Valorados (SQL Server + MongoDB)
# -----------------------------------------------------------------------------
@router.get(
    "/inventario/movimientos-valorados",
    response_model=ApiResponseContainer,
    status_code=status.HTTP_200_OK,
    summary="18. Análisis de Movimientos de Stock Valorados (Indicador Transversal)",
    description="""
    ### Análisis Transversal: SQL Server + MongoDB
    Combina movimientos de almacén (SQL Server) con maestro de productos (MongoDB):
    - **totalMovimientos**: Cantidad total de transacciones de entrada y salida.
    - **movimientosIN / movimientosOUT**: Conteo por tipo de operación.
    - **cantidadTotalIN / cantidadTotalOUT**: Unidades totales de cada tipo.
    - **valorTotalIN / valorTotalOUT**: Valoración monetaria de entradas y salidas.
    - **diferenciaValor**: Diferencia entre valor de entradas y salidas.
    - **stockActual**: Stock disponible actual.
    - **valorStockActual**: Valoración del inventario disponible.

    Ordenado por mayor valor de stock actual.

    *Control de valoración de inventario, análisis de entradas/salidas y trazabilidad financiera.*
    """,
)
async def get_movimientos_stock_valorados():
    try:
        data = await AnalyticsService.get_movimientos_stock_valorados()
        return {
            "status": "success",
            "timestamp": _utc_timestamp(),
            "count": len(data),
            "data": data,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al analizar movimientos de stock valorados: {str(e)}",
        )
