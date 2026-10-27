from typing import Any, List

from pydantic import BaseModel, Field

# Model 1: Resumen de Productos por Categoría
class CategoriaResumenModel(BaseModel):
    categoria: str = Field(..., example="Fertilizantes", description="Nombre de la categoría del producto")
    totalProductos: int = Field(..., example=12, description="Cantidad total de productos registrados en la categoría")
    stockTotal: int = Field(..., example=1450, description="Suma acumulada del stock disponible")
    valorTotalInventario: float = Field(..., example=137750.00, description="Valor económico total del inventario en soles (S/)")
    precioPromedio: float = Field(..., example=95.00, description="Precio unitario promedio de la categoría")
    productosStockBajo: int = Field(..., example=2, description="Cantidad de productos en estado de alerta de stock mínimo")

# Model 2: Ranking de Fabricantes de Agroquímicos
class FabricanteRankingModel(BaseModel):
    fabricante: str = Field(..., example="Bayer CropScience", description="Nombre de la marca o fabricante agrícola")
    totalProductos: int = Field(..., example=8, description="Número de agroquímicos comercializados por el fabricante")
    categoriasManejadas: List[str] = Field(..., example=["HERBICIDE", "FUNGICIDE"], description="Categorías de pesticidas/fertilizantes que produce")
    carenciaPromedioDias: float = Field(..., example=14.5, description="Promedio de días de carencia requeridos por SENASA")
    dosisMaximaPromedio: float = Field(..., example=2.75, description="Promedio de dosis máxima recomendada (L/ha o kg/ha)")

# Model 3: Reporte de Alertas de Reabastecimiento Crítico
class AlertaReabastecimientoModel(BaseModel):
    id: str = Field(..., example="650f1a2b3c4d5e6f7a8b9c01", description="ID único del producto en MongoDB")
    codigo: str = Field(..., example="PROD-2026", description="Código alfanumérico identificador")
    nombre: str = Field(..., example="Fertilizante Bio-Power X", description="Nombre comercial del producto")
    categoria: str = Field(..., example="Fertilizantes", description="Categoría asignada")
    precioUnitario: float = Field(..., example=95.00, description="Precio de venta unitario")
    stockActual: int = Field(..., example=5, description="Cantidad de existencias en almacén")
    stockMinimo: int = Field(..., example=20, description="Nivel mínimo requerido de seguridad")
    deficitStock: int = Field(..., example=15, description="Unidades faltantes para cubrir el mínimo requerimiento")
    costoReabastecimientoEstimado: float = Field(..., example=1425.00, description="Inversión estimada para cubrir el déficit (S/)")
    nivelRiesgo: str = Field(..., example="CRITICO", description="Clasificación del riesgo: CRITICO (Stock 0), ALTO o MEDIO")

# Model 4: Clientes agrupados por país
class ClientesPorPaisModel(BaseModel):
    pais: str = Field(..., example="Perú", description="País de origen o sede del cliente")
    totalClientes: int = Field(..., example=20, description="Cantidad de clientes activos en ese país")

# Model 5: Distribución de clientes por tipo
class ClientesPorTipoModel(BaseModel):
    tipoCliente: str = Field(..., example="exportador", description="Clasificación comercial del cliente")
    totalClientes: int = Field(..., example=10, description="Cantidad de clientes activos de ese tipo")
    porcentaje: float = Field(..., example=33.3, description="Porcentaje que representa sobre el total de clientes activos")

# Model 6: KPIs generales de clientes
class KpisClientesModel(BaseModel):
    totalClientes: int = Field(..., example=33, description="Total de clientes registrados en el sistema")
    clientesActivos: int = Field(..., example=30, description="Clientes con estado activo")
    clientesInactivos: int = Field(..., example=3, description="Clientes con estado inactivo")
    totalPaises: int = Field(..., example=8, description="Número de países distintos con clientes activos")
    totalTiposCliente: int = Field(..., example=6, description="Número de tipos de cliente distintos registrados")
    tasaActividad: float = Field(..., example=90.9, description="Porcentaje de clientes activos sobre el total (%)")

# Model 7: Distribución de Agroquímicos por Categoría
class AgroquimicosPorCategoriaModel(BaseModel):
    categoria: str = Field(..., example="HERBICIDE", description="Categoría fitosanitaria")
    totalProductos: int = Field(..., example=8, description="Cantidad de productos en la categoría")
    dosisPromedioHa: float = Field(..., example=2.3, description="Dosis promedio de aplicación por hectárea")
    carenciaPromedioDias: float = Field(..., example=14.5, description="Tiempo promedio de carencia SENASA en días")

# Model 8: Alerta de Vencimiento SENASA
class VencimientoSenasaModel(BaseModel):
    nombreComercial: str = Field(..., example="Roundup Max", description="Nombre comercial del agroquímico")
    fabricante: str = Field(..., example="Bayer", description="Marca o laboratorio fabricante")
    categoria: str = Field(..., example="HERBICIDE", description="Tipo fitosanitario")
    registroSenasa: str = Field(..., example="SEN-2024-001", description="Número de registro oficial SENASA")
    fechaVencimiento: str = Field(..., example="2025-03-15", description="Fecha de expiración del registro")
    diasParaVencer: int = Field(..., example=45, description="Días restantes hasta el vencimiento")
    estadoAlerta: str = Field(..., example="ATENCION", description="Nivel de alerta: URGENTE, ATENCION o PROXIMAMENTE")

# Model 9: Ingredientes Activos
class IngredienteActivoModel(BaseModel):
    ingredienteActivo: str = Field(..., example="Glifosato 74.7%", description="Compuesto químico o biológico base")
    totalFormulaciones: int = Field(..., example=5, description="Número de productos con este ingrediente")
    totalCategorias: int = Field(..., example=1, description="Diversidad de usos fitosanitarios")
    totalFabricantes: int = Field(..., example=3, description="Cantidad de proveedores")
    carenciaPromedioDias: float = Field(..., example=14.0, description="Tiempo promedio de espera antes de cosecha")

# Model 10: Carencia por Categoría
class CarenciaPorCategoriaModel(BaseModel):
    categoria: str = Field(..., example="INSECTICIDE", description="Tipo fitosanitario")
    carenciaMinima: int = Field(..., example=14, description="Menor tiempo de espera registrado (días)")
    carenciaMaxima: int = Field(..., example=28, description="Mayor tiempo de espera registrado (días)")
    carenciaPromedio: float = Field(..., example=21.0, description="Promedio de días de carencia")
    totalProductos: int = Field(..., example=6, description="Cantidad de productos en la categoría")
    rangoCarencia: str = Field(..., example="14 - 28 días", description="Rango textual del período de espera")

# Model 11: Dosificación por Tipo
class DosificacionPorTipoModel(BaseModel):
    categoria: str = Field(..., example="FERTILIZER", description="Tipo de agroquímico")
    dosisMinima: float = Field(..., example=150.0, description="Menor dosis registrada")
    dosisMaxima: float = Field(..., example=250.0, description="Mayor dosis registrada")
    dosisPromedio: float = Field(..., example=200.0, description="Dosis promedio de aplicación")
    totalProductos: int = Field(..., example=4, description="Cantidad de productos analizados")
    unidadMedida: str = Field(..., example="kg/ha", description="Unidad de medida (kg/ha o L/ha)")

# Model 12: Rotación de Inventario (MongoDB + SQL Server)
class RotacionInventarioModel(BaseModel):
    id: str = Field(..., example="650f1a2b3c4d5e6f7a8b9c10", description="ID del producto en MongoDB")
    codigo: str = Field(..., example="PROD-001", description="Código del producto")
    nombre: str = Field(..., example="Mandarina Satsuma", description="Nombre del producto")
    categoria: str = Field(..., example="Cítricos", description="Categoría del producto")
    stockActual: int = Field(..., example=500, description="Stock disponible actual")
    entradas90Dias: int = Field(..., example=120, description="Unidades ingresadas en los últimos 90 días")
    salidas90Dias: int = Field(..., example=640, description="Unidades despachadas en los últimos 90 días")
    valorSalidas90Dias: float = Field(..., example=54400.0, description="Valor económico de las salidas (S/)")
    rotacion: float = Field(..., example=1.28, description="Salidas del período / stock actual")
    clasificacionRotacion: str = Field(..., example="ALTA", description="ALTA (>=1), MEDIA (>=0.3) o BAJA")
    movimientos90Dias: int = Field(..., example=18, description="Cantidad de movimientos registrados")
    ultimoMovimiento: str = Field(..., example="2026-10-15", description="Fecha del último movimiento")

# Model 13: Productos con mayor valor de stock
class ProductoMayorValorStockModel(BaseModel):
    id: str = Field(..., example="650f1a2b3c4d5e6f7a8b9c01", description="ID del producto en MongoDB")
    codigo: str = Field(..., example="PROD-001", description="Código del producto")
    nombre: str = Field(..., example="Mandarina Satsuma", description="Nombre del producto")
    categoria: str = Field(..., example="Cítricos", description="Categoría del producto")
    origen: str = Field(..., example="Cañete - San Vicente", description="Zona de origen o procedencia")
    stockActual: int = Field(..., example=500, description="Stock disponible actual")
    stockMinimo: int = Field(..., example=50, description="Stock mínimo de seguridad")
    precioUnitario: float = Field(..., example=85.0, description="Precio unitario en soles (S/)")
    valorStock: float = Field(..., example=42500.0, description="Valor total del stock (S/)")
    participacion: float = Field(..., example=21.4, description="Participación sobre el valor total (%)")
    ranking: int = Field(..., example=1, description="Posición en el ranking de valor")

# Model 14: Productos por origen
class ProductosPorOrigenModel(BaseModel):
    origen: str = Field(..., example="Cañete - San Vicente", description="Zona de origen o procedencia")
    totalProductos: int = Field(..., example=4, description="Cantidad de productos del origen")
    stockTotal: int = Field(..., example=1970, description="Stock acumulado del origen")
    valorTotalStock: float = Field(..., example=130000.0, description="Valor económico del stock (S/)")
    precioPromedio: float = Field(..., example=93.75, description="Precio unitario promedio (S/)")
    participacion: float = Field(..., example=33.3, description="Participación sobre el total de productos (%)")

# Model 15: Top clientes potenciales (MongoDB + SQL Server)
class TopClientePotencialModel(BaseModel):
    customerId: str = Field(..., example="650f1a2b3c4d5e6f7a8b9c21", description="ID del cliente en MongoDB")
    codigo: str = Field(..., example="CLI-001", description="Código del cliente")
    cliente: str = Field(..., example="Agroindustrias del Sur S.A.C.", description="Razón social")
    pais: str = Field(..., example="Perú", description="País del cliente")
    ciudad: str = Field(..., example="Lima", description="Ciudad del cliente")
    tipoCliente: str = Field(..., example="NACIONAL", description="Segmento comercial")
    totalPedidos: int = Field(..., example=12, description="Pedidos registrados en SQL Server")
    montoTotalComprado: float = Field(..., example=68450.0, description="Monto total comprado (S/)")
    ticketPromedio: float = Field(..., example=5704.17, description="Ticket promedio por pedido (S/)")
    pedidosEntregados: int = Field(..., example=11, description="Pedidos entregados")
    ultimoPedido: str = Field(..., example="2026-10-12", description="Fecha del último pedido")
    diasDesdeUltimoPedido: int = Field(..., example=10, description="Días transcurridos desde el último pedido")
    segmentoPotencial: str = Field(..., example="VIP", description="Segmento: VIP, ALTO, MEDIO o BAJO")
    indicePotencial: float = Field(..., example=80450.0, description="Índice compuesto de potencial comercial")

# Model 16: Clientes por ciudad
class ClientesPorCiudadModel(BaseModel):
    ciudad: str = Field(..., example="Lima", description="Ciudad de residencia del cliente")
    pais: str = Field(..., example="Perú", description="País del cliente")
    totalClientes: int = Field(..., example=5, description="Clientes activos en la ciudad")
    porcentaje: float = Field(..., example=33.3, description="Participación sobre el total de clientes activos (%)")

# Model 17: Pedidos por cliente (SQL Server + MongoDB)
class PedidosPorClienteModel(BaseModel):
    customerId: str = Field(..., example="650f1a2b3c4d5e6f7a8b9c21", description="ID del cliente en MongoDB")
    codigo: str = Field(..., example="CLI-001", description="Código del cliente")
    cliente: str = Field(..., example="Agroindustrias del Sur S.A.C.", description="Razón social")
    pais: str = Field(..., example="Perú", description="País del cliente")
    ciudad: str = Field(..., example="Lima", description="Ciudad del cliente")
    totalPedidos: int = Field(..., example=12, description="Total de pedidos registrados")
    montoTotal: float = Field(..., example=68450.0, description="Monto total pedido (S/)")
    ticketPromedio: float = Field(..., example=5704.17, description="Ticket promedio (S/)")
    pedidosEntregados: int = Field(..., example=11, description="Pedidos con estado DELIVERED")
    pedidosCancelados: int = Field(..., example=1, description="Pedidos con estado CANCELLED")
    tasaCumplimiento: float = Field(..., example=91.7, description="Pedidos entregados / total (%)")
    primerPedido: str = Field(..., example="2026-06-01", description="Fecha del primer pedido")
    ultimoPedido: str = Field(..., example="2026-10-12", description="Fecha del último pedido")

# Model 18: Movimientos de stock valorados (SQL Server + MongoDB)
class MovimientoStockValoradoModel(BaseModel):
    productId: str = Field(..., example="650f1a2b3c4d5e6f7a8b9c01", description="ID del producto en MongoDB")
    codigo: str = Field(..., example="PROD-001", description="Código del producto")
    producto: str = Field(..., example="Mandarina Satsuma", description="Nombre del producto")
    categoria: str = Field(..., example="Cítricos", description="Categoría del producto")
    entradas: int = Field(..., example=800, description="Unidades ingresadas")
    salidas: int = Field(..., example=640, description="Unidades despachadas")
    valorEntradas: float = Field(..., example=68000.0, description="Valor económico de entradas (S/)")
    valorSalidas: float = Field(..., example=54400.0, description="Valor económico de salidas (S/)")
    valorNeto: float = Field(..., example=13600.0, description="Diferencia valorizada entradas - salidas (S/)")
    totalMovimientos: int = Field(..., example=24, description="Cantidad total de movimientos")
    ultimoMovimiento: str = Field(..., example="2026-10-15", description="Fecha del último movimiento")
    estadoBalance: str = Field(..., example="SUPERAVIT", description="SUPERAVIT si valorNeto >= 0, si no DEFICIT")

# Contenedor estándar de respuesta HTTP para todos los endpoints analíticos
class ApiResponseContainer(BaseModel):
    status: str = Field(default="success", example="success", description="Estado de la transacción de la API")
    timestamp: str = Field(..., example="2026-09-24T00:00:00Z", description="Estampa de tiempo de ejecución UTC ISO 8601")
    count: int = Field(..., example=3, description="Número total de registros analíticos retornados")
    data: List[Any] = Field(..., description="Resultados procesados por la agregación de MongoDB")

__all__ = [
    "CategoriaResumenModel",
    "FabricanteRankingModel",
    "AlertaReabastecimientoModel",
    "ClientesPorPaisModel",
    "ClientesPorTipoModel",
    "KpisClientesModel",
    "AgroquimicosPorCategoriaModel",
    "VencimientoSenasaModel",
    "IngredienteActivoModel",
    "CarenciaPorCategoriaModel",
    "DosificacionPorTipoModel",
    "RotacionInventarioModel",
    "ProductoMayorValorStockModel",
    "ProductosPorOrigenModel",
    "TopClientePotencialModel",
    "ClientesPorCiudadModel",
    "PedidosPorClienteModel",
    "MovimientoStockValoradoModel",
    "ApiResponseContainer",
]