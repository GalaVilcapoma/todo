from app.database.connection import get_database
from app.database.sqlserver import (
    SQLServerUnavailable,
    fetch_all as sql_fetch_all,
    is_sqlserver_available,
)
from app.config.settings import settings
from typing import List, Dict, Any
from datetime import date, datetime
import logging

logger = logging.getLogger("uvicorn")

# Nombres de campos compatibles con el modelo Java (inglés) y con datos legacy
# en español, de modo que los indicadores funcionen con ambas fuentes.
_CAMPO_ACTIVO = {"$ifNull": ["$active", {"$ifNull": ["$estado", True]}]}
_CAMPO_CATEGORIA = {"$ifNull": ["$category", "$categoria"]}
_CAMPO_STOCK = {"$ifNull": ["$currentStock", "$stockActual"]}
_CAMPO_STOCK_MIN = {"$ifNull": ["$minimumStock", "$stockMinimo"]}
_CAMPO_PRECIO = {"$ifNull": ["$unitPrice", "$precioUnitario"]}
_CAMPO_CODIGO = {"$ifNull": ["$code", "$codigo"]}
_CAMPO_NOMBRE = {"$ifNull": ["$name", "$nombre"]}
_CAMPO_ORIGEN = {"$ifNull": ["$origin", "$origen"]}
_CAMPO_CLIENTE_NOMBRE = {"$ifNull": ["$businessName", "$razonSocial"]}
_CAMPO_CIUDAD = {"$ifNull": ["$city", "$ciudad"]}
_CAMPO_PAIS = {"$ifNull": ["$country", "$pais"]}
_CAMPO_TIPO_CLIENTE = {"$ifNull": ["$customerType", "$tipoCliente"]}


def _es_activo(registro: Dict[str, Any]) -> bool:
    if registro.get("active") is not None:
        return bool(registro.get("active"))
    if registro.get("estado") is not None:
        return bool(registro.get("estado"))
    return True


def _a_texto(valor: Any) -> str:
    return "" if valor is None else str(valor)


def _a_float(valor: Any) -> float:
    if valor is None:
        return 0.0
    try:
        return float(valor)
    except (TypeError, ValueError):
        return 0.0


def _a_entero(valor: Any) -> int:
    if valor is None:
        return 0
    try:
        return int(valor)
    except (TypeError, ValueError):
        return 0


def _fecha_iso(valor: Any) -> str:
    if valor is None:
        return ""
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    return str(valor)


def _primer(registro: Dict[str, Any], *campos: str) -> Any:
    for campo in campos:
        valor = registro.get(campo)
        if valor not in (None, ""):
            return valor
    return None


def _dias_desde(valor: Any) -> int:
    if valor is None:
        return 0
    try:
        if isinstance(valor, datetime):
            fecha = valor.date()
        elif isinstance(valor, date):
            fecha = valor
        else:
            fecha = datetime.fromisoformat(str(valor)[:10]).date()
        return max((date.today() - fecha).days, 0)
    except (TypeError, ValueError):
        return 0


async def _coleccion(db, *nombres: str):
    """Devuelve la primera colección existente (soporta nombres legacy)."""
    existentes = await db.list_collection_names()
    for nombre in nombres:
        if nombre in existentes:
            return db[nombre]
    return db[nombres[0]]


async def _productos(db):
    return await _coleccion(db, "products", "productos")


async def _clientes(db):
    return await _coleccion(db, "customers", "clientes")


async def _agroquimicos(db):
    return await _coleccion(db, "agrochemicals", "agroquimicos")

class AnalyticsRepository:

    # -------------------------------------------------------------------------
    # PIPELINE 1: Resumen Analítico de Productos por Categoría
    # Colección: productos
    # Toma de decisión: Evaluación de rotación, stock y valor de inventario
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_resumen_productos_por_categoria() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            # Etapa 1: Filtrar solo productos activos (modelo Java o datos legacy)
            {"$match": {"$expr": {"$eq": [_CAMPO_ACTIVO, True]}}},
            
            # Etapa 2: Agrupamiento por categoría y cálculo de métricas financieras/stock
            {
                "$group": {
                    "_id": _CAMPO_CATEGORIA,
                    "totalProductos": {"$sum": 1},
                    "stockTotal": {"$sum": _CAMPO_STOCK},
                    "valorTotalInventario": {
                        "$sum": {
                            "$multiply": [
                                _CAMPO_STOCK,
                                {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}}
                            ]
                        }
                    },
                    "precioPromedio": {
                        "$avg": {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}}
                    },
                    "productosStockBajo": {
                        "$sum": {
                            "$cond": [{"$lte": [_CAMPO_STOCK, _CAMPO_STOCK_MIN]}, 1, 0]
                        }
                    }
                }
            },
            
            # Etapa 3: Proyección y redondeo de montos numéricos
            {
                "$project": {
                    "_id": 0,
                    "categoria": "$_id",
                    "totalProductos": 1,
                    "stockTotal": 1,
                    "valorTotalInventario": {"$round": ["$valorTotalInventario", 2]},
                    "precioPromedio": {"$round": ["$precioPromedio", 2]},
                    "productosStockBajo": 1
                }
            },
            
            # Etapa 4: Ordenamiento por mayor valor de inventario acumulado
            {"$sort": {"valorTotalInventario": -1}}
        ]

        cursor = (await _productos(db)).aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"categoria": "Fertilizantes", "totalProductos": 8, "stockTotal": 1250, "valorTotalInventario": 118750.0, "precioPromedio": 95.0, "productosStockBajo": 1},
                {"categoria": "Semillas", "totalProductos": 5, "stockTotal": 450, "valorTotalInventario": 108225.0, "precioPromedio": 240.5, "productosStockBajo": 0},
                {"categoria": "Sistemas de Riego", "totalProductos": 4, "stockTotal": 120, "valorTotalInventario": 37200.0, "precioPromedio": 310.0, "productosStockBajo": 2}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 2: Ranking Analítico de Fabricantes de Agroquímicos
    # Colección: agrochemicals
    # Toma de decisión: Concentración de marcas y trazabilidad SENASA
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_ranking_fabricantes_agroquimicos() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            # Etapa 1: Filtrar agroquímicos activos
            {"$match": {"active": True}},
            
            # Etapa 2: Agrupar por fabricante
            {
                "$group": {
                    "_id": "$manufacturer",
                    "totalProductos": {"$sum": 1},
                    "categoriasManejadas": {"$addToSet": "$category"},
                    "carenciaPromedioDias": {"$avg": "$waitingPeriodDays"},
                    "dosisMaximaPromedio": {
                        "$avg": {"$toDouble": "$maxDose"}
                    }
                }
            },
            
            # Etapa 3: Renombrar campos y redondear
            {
                "$project": {
                    "_id": 0,
                    "fabricante": "$_id",
                    "totalProductos": 1,
                    "categoriasManejadas": 1,
                    "carenciaPromedioDias": {"$round": ["$carenciaPromedioDias", 1]},
                    "dosisMaximaPromedio": {"$round": ["$dosisMaximaPromedio", 2]}
                }
            },
            
            # Etapa 4: Ordenar por cantidad de agroquímicos ofertados (ranking)
            {"$sort": {"totalProductos": -1}}
        ]

        cursor = db.agrochemicals.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"fabricante": "Bayer CropScience", "totalProductos": 10, "categoriasManejadas": ["HERBICIDE", "FUNGICIDE"], "carenciaPromedioDias": 14.0, "dosisMaximaPromedio": 3.25},
                {"fabricante": "Syngenta", "totalProductos": 7, "categoriasManejadas": ["INSECTICIDE", "FUNGICIDE"], "carenciaPromedioDias": 10.5, "dosisMaximaPromedio": 1.50},
                {"fabricante": "Yara International", "totalProductos": 4, "categoriasManejadas": ["FERTILIZER"], "carenciaPromedioDias": 0.0, "dosisMaximaPromedio": 150.0}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 3: Alerta Analítica de Reabastecimiento Crítico de Inventario
    # Colección: productos
    # Toma de decisión: Reposición de stock crítico y presupuesto de compra
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_alerta_reabastecimiento() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            # Etapa 1: Filtrar productos cuyo stockActual <= stockMinimo
            {
                "$match": {
                    "$expr": {
                        "$and": [
                            {"$eq": [_CAMPO_ACTIVO, True]},
                            {"$lte": [_CAMPO_STOCK, _CAMPO_STOCK_MIN]}
                        ]
                    }
                }
            },
            
            # Etapa 2: Calcular déficit, presupuesto estimado y nivel de riesgo
            {
                "$project": {
                    "_id": 0,
                    "id": {"$toString": "$_id"},
                    "codigo": _CAMPO_CODIGO,
                    "nombre": _CAMPO_NOMBRE,
                    "categoria": _CAMPO_CATEGORIA,
                    "precioUnitario": {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}},
                    "stockActual": _CAMPO_STOCK,
                    "stockMinimo": _CAMPO_STOCK_MIN,
                    "deficitStock": {"$subtract": [_CAMPO_STOCK_MIN, _CAMPO_STOCK]},
                    "costoReabastecimientoEstimado": {
                        "$round": [
                            {
                                "$multiply": [
                                    {"$subtract": [_CAMPO_STOCK_MIN, _CAMPO_STOCK]},
                                    {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}}
                                ]
                            },
                            2
                        ]
                    },
                    "nivelRiesgo": {
                        "$cond": [
                            {"$eq": [_CAMPO_STOCK, 0]},
                            "CRITICO",
                            {
                                "$cond": [
                                    {"$lt": [_CAMPO_STOCK, {"$divide": [_CAMPO_STOCK_MIN, 2]}]},
                                    "ALTO",
                                    "MEDIO"
                                ]
                            }
                        ]
                    }
                }
            },
            
            # Etapa 3: Ordenar por déficit de stock descendente
            {"$sort": {"deficitStock": -1}}
        ]

        cursor = (await _productos(db)).aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"id": "650f1a2b3c4d5e6f7a8b9c01", "codigo": "PROD-901", "nombre": "Manguera Riego Goteo 16mm", "categoria": "Sistemas de Riego", "precioUnitario": 120.0, "stockActual": 0, "stockMinimo": 25, "deficitStock": 25, "costoReabastecimientoEstimado": 3000.0, "nivelRiesgo": "CRITICO"},
                {"id": "650f1a2b3c4d5e6f7a8b9c02", "codigo": "PROD-202", "nombre": "Bio-Estimulante Raíz Pro", "categoria": "Fertilizantes", "precioUnitario": 85.5, "stockActual": 4, "stockMinimo": 20, "deficitStock": 16, "costoReabastecimientoEstimado": 1368.0, "nivelRiesgo": "ALTO"}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 4: Resumen Analítico de Clientes
    # Colección: customers
    # Toma de decisión: Segmentación de cartera de clientes por país y tipo
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_resumen_clientes() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            # Etapa 1: Solo clientes activos
            {"$match": {"active": True}},

            # Etapa 2: Agrupar por país y contar
            {
                "$group": {
                    "_id": "$country",
                    "totalClientes": {"$sum": 1}
                }
            },

            # Etapa 3: Proyección
            {
                "$project": {
                    "_id": 0,
                    "pais": "$_id",
                    "totalClientes": 1
                }
            },

            # Etapa 4: Ordenar por mayor cantidad
            {"$sort": {"totalClientes": -1}}
        ]

        cursor = db.customers.aggregate(pipeline)
        result = await cursor.to_list(length=100)

        if not result:
            return [
                {"pais": "Perú", "totalClientes": 20},
                {"pais": "Chile", "totalClientes": 5},
                {"pais": "Alemania", "totalClientes": 3},
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 5: Distribución de Clientes por Tipo
    # Colección: customers
    # Toma de decisión: Segmentación comercial por tipo de cliente
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_clientes_por_tipo() -> List[Dict[str, Any]]:
        db = get_database()

        # Obtener total de activos para calcular porcentaje
        total = await db.customers.count_documents({"active": True})

        pipeline = [
            {"$match": {"active": True}},
            {
                "$group": {
                    "_id": "$customerType",
                    "totalClientes": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "tipoCliente": "$_id",
                    "totalClientes": 1,
                    "porcentaje": {
                        "$round": [
                            {"$multiply": [{"$divide": ["$totalClientes", total]}, 100]},
                            1
                        ]
                    }
                }
            },
            {"$sort": {"totalClientes": -1}}
        ]

        cursor = db.customers.aggregate(pipeline)
        result = await cursor.to_list(length=100)

        if not result:
            return [
                {"tipoCliente": "exportador", "totalClientes": 10, "porcentaje": 33.3},
                {"tipoCliente": "importador", "totalClientes": 8,  "porcentaje": 26.7},
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 6: KPIs Generales de Clientes
    # Colección: customers
    # Toma de decisión: Visión ejecutiva del estado de la cartera de clientes
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_kpis_clientes() -> Dict[str, Any]:
        db = get_database()

        total     = await db.customers.count_documents({})
        activos   = await db.customers.count_documents({"active": True})
        inactivos = await db.customers.count_documents({"active": False})

        # Países distintos con al menos un cliente activo
        paises = await db.customers.distinct("country", {"active": True})

        # Tipos distintos con al menos un cliente activo
        tipos = await db.customers.distinct("customerType", {"active": True})

        return {
            "totalClientes":   total,
            "clientesActivos": activos,
            "clientesInactivos": inactivos,
            "totalPaises": len(paises),
            "totalTiposCliente": len(tipos),
            "tasaActividad": round(activos * 100 / total, 1) if total > 0 else 0.0
        }

    # -------------------------------------------------------------------------
    # PIPELINE 7: Distribución de Agroquímicos por Categoría
    # Colección: agrochemicals
    # Toma de decisión: Composición del portafolio de productos fitosanitarios
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_agroquimicos_por_categoria() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"active": True}},
            {
                "$group": {
                    "_id": "$category",
                    "totalProductos": {"$sum": 1},
                    "dosisPromedioHa": {"$avg": {"$toDouble": "$maxDose"}},
                    "carenciaPromedioDias": {"$avg": "$waitingPeriodDays"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "categoria": "$_id",
                    "totalProductos": 1,
                    "dosisPromedioHa": {"$round": ["$dosisPromedioHa", 2]},
                    "carenciaPromedioDias": {"$round": ["$carenciaPromedioDias", 1]}
                }
            },
            {"$sort": {"totalProductos": -1}}
        ]

        cursor = db.agrochemicals.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"categoria": "HERBICIDE", "totalProductos": 8, "dosisPromedioHa": 2.3, "carenciaPromedioDias": 14.5},
                {"categoria": "INSECTICIDE", "totalProductos": 6, "dosisPromedioHa": 1.8, "carenciaPromedioDias": 18.0}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 8: Agroquímicos con Registro SENASA Próximo a Vencer
    # Colección: agrochemicals
    # Toma de decisión: Control regulatorio y prevención de vencimientos
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_agroquimicos_vencimiento_senasa() -> List[Dict[str, Any]]:
        db = get_database()
        from datetime import datetime, timedelta
        
        # Fecha actual + 180 días (6 meses)
        fecha_limite = datetime.now() + timedelta(days=180)
        
        pipeline = [
            {
                "$match": {
                    "active": True,
                    "registrationExpiry": {"$lte": fecha_limite.strftime("%Y-%m-%d")}
                }
            },
            {
                "$addFields": {
                    "diasParaVencer": {
                        "$dateDiff": {
                            "startDate": "$$NOW",
                            "endDate": {"$dateFromString": {"dateString": "$registrationExpiry"}},
                            "unit": "day"
                        }
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "nombreComercial": "$commercialName",
                    "fabricante": "$manufacturer",
                    "categoria": "$category",
                    "registroSenasa": "$senasaRegistrationNumber",
                    "fechaVencimiento": "$registrationExpiry",
                    "diasParaVencer": 1,
                    "estadoAlerta": {
                        "$cond": [
                            {"$lte": ["$diasParaVencer", 30]},
                            "URGENTE",
                            {
                                "$cond": [
                                    {"$lte": ["$diasParaVencer", 90]},
                                    "ATENCION",
                                    "PROXIMAMENTE"
                                ]
                            }
                        ]
                    }
                }
            },
            {"$sort": {"diasParaVencer": 1}}
        ]

        cursor = db.agrochemicals.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"nombreComercial": "Roundup Max", "fabricante": "Bayer", "categoria": "HERBICIDE", "registroSenasa": "SEN-2024-001", "fechaVencimiento": "2025-03-15", "diasParaVencer": 45, "estadoAlerta": "ATENCION"}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 9: Análisis de Ingredientes Activos Más Utilizados
    # Colección: agrochemicals
    # Toma de decisión: Diversificación de principios activos
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_ingredientes_activos() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"active": True}},
            {
                "$group": {
                    "_id": "$activeIngredient",
                    "totalFormulaciones": {"$sum": 1},
                    "categorias": {"$addToSet": "$category"},
                    "fabricantes": {"$addToSet": "$manufacturer"},
                    "carenciaPromedio": {"$avg": "$waitingPeriodDays"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "ingredienteActivo": "$_id",
                    "totalFormulaciones": 1,
                    "totalCategorias": {"$size": "$categorias"},
                    "totalFabricantes": {"$size": "$fabricantes"},
                    "carenciaPromedioDias": {"$round": ["$carenciaPromedio", 1]}
                }
            },
            {"$sort": {"totalFormulaciones": -1}},
            {"$limit": 20}
        ]

        cursor = db.agrochemicals.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"ingredienteActivo": "Glifosato 74.7%", "totalFormulaciones": 5, "totalCategorias": 1, "totalFabricantes": 3, "carenciaPromedioDias": 14.0}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 10: Comparativa de Tiempos de Carencia por Categoría
    # Colección: agrochemicals
    # Toma de decisión: Planificación de cosecha y cumplimiento fitosanitario
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_carencia_por_categoria() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"active": True}},
            {
                "$group": {
                    "_id": "$category",
                    "carenciaMinima": {"$min": "$waitingPeriodDays"},
                    "carenciaMaxima": {"$max": "$waitingPeriodDays"},
                    "carenciaPromedio": {"$avg": "$waitingPeriodDays"},
                    "totalProductos": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "categoria": "$_id",
                    "carenciaMinima": 1,
                    "carenciaMaxima": 1,
                    "carenciaPromedio": {"$round": ["$carenciaPromedio", 1]},
                    "totalProductos": 1,
                    "rangoCarencia": {
                        "$concat": [
                            {"$toString": "$carenciaMinima"},
                            " - ",
                            {"$toString": "$carenciaMaxima"},
                            " días"
                        ]
                    }
                }
            },
            {"$sort": {"carenciaPromedio": -1}}
        ]

        cursor = db.agrochemicals.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"categoria": "INSECTICIDE", "carenciaMinima": 14, "carenciaMaxima": 28, "carenciaPromedio": 21.0, "totalProductos": 6, "rangoCarencia": "14 - 28 días"}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 11: Análisis de Dosificación por Tipo de Agroquímico
    # Colección: agrochemicals
    # Toma de decisión: Optimización de costos de aplicación por hectárea
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_dosificacion_por_tipo() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"active": True}},
            {
                "$group": {
                    "_id": "$category",
                    "dosisMinima": {"$min": {"$toDouble": "$maxDose"}},
                    "dosisMaxima": {"$max": {"$toDouble": "$maxDose"}},
                    "dosisPromedio": {"$avg": {"$toDouble": "$maxDose"}},
                    "totalProductos": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "categoria": "$_id",
                    "dosisMinima": {"$round": ["$dosisMinima", 2]},
                    "dosisMaxima": {"$round": ["$dosisMaxima", 2]},
                    "dosisPromedio": {"$round": ["$dosisPromedio", 2]},
                    "totalProductos": 1,
                    "unidadMedida": {
                        "$cond": [
                            {"$eq": ["$_id", "FERTILIZER"]},
                            "kg/ha",
                            "L/ha"
                        ]
                    }
                }
            },
            {"$sort": {"dosisPromedio": -1}}
        ]

        cursor = db.agrochemicals.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"categoria": "FERTILIZER", "dosisMinima": 150.0, "dosisMaxima": 250.0, "dosisPromedio": 200.0, "totalProductos": 4, "unidadMedida": "kg/ha"}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 12: Rotación de Inventario (MongoDB + SQL Server)
    # Colecciones/Tablas: products + product_stock_movements
    # Toma de decisión: Identificar productos de baja rotación y capital inmovilizado
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_rotacion_inventario() -> List[Dict[str, Any]]:
        db = get_database()
        productos = await _productos(db)
        movimientos: Dict[str, Dict[str, Any]] = {}

        try:
            tabla = settings.SQLSERVER_MOVEMENTS_TABLE
            filas = await sql_fetch_all(
                f"""
                SELECT product_id,
                       SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) AS salidas,
                       SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) AS entradas,
                       SUM(CASE WHEN movement_type = 'OUT' THEN total_value ELSE 0 END) AS valorSalidas,
                       COUNT(*) AS movimientos,
                       MAX(movement_date) AS ultimoMovimiento
                FROM {tabla}
                WHERE active = 1 AND movement_date >= DATEADD(DAY, -90, GETDATE())
                GROUP BY product_id
                """
            )
            movimientos = {str(fila["product_id"]): fila for fila in filas}
        except (SQLServerUnavailable, Exception) as exc:
            logger.warning("Rotación de inventario sin SQL Server: %s", exc)

        documentos = await productos.find({}).to_list(length=1000)
        resultado: List[Dict[str, Any]] = []

        for producto in documentos:
            if not _es_activo(producto):
                continue

            pid = str(producto.get("_id"))
            movimiento = movimientos.get(pid, {})
            stock = _a_entero(_primer(producto, "currentStock", "stockActual"))
            salidas = _a_entero(movimiento.get("salidas"))
            entradas = _a_entero(movimiento.get("entradas"))
            valorSalidas = round(_a_float(movimiento.get("valorSalidas")), 2)
            rotacion = round(salidas / stock, 2) if stock > 0 else float(salidas)

            if rotacion >= 1:
                clasificacion = "ALTA"
            elif rotacion >= 0.3:
                clasificacion = "MEDIA"
            else:
                clasificacion = "BAJA"

            resultado.append(
                {
                    "id": pid,
                    "codigo": _a_texto(_primer(producto, "code", "codigo")),
                    "nombre": _a_texto(_primer(producto, "name", "nombre")),
                    "categoria": _a_texto(_primer(producto, "category", "categoria")),
                    "stockActual": stock,
                    "entradas90Dias": entradas,
                    "salidas90Dias": salidas,
                    "valorSalidas90Dias": valorSalidas,
                    "rotacion": rotacion,
                    "clasificacionRotacion": clasificacion,
                    "movimientos90Dias": _a_entero(movimiento.get("movimientos")),
                    "ultimoMovimiento": _fecha_iso(movimiento.get("ultimoMovimiento")),
                }
            )

        resultado.sort(key=lambda item: item["rotacion"], reverse=True)

        if not resultado:
            return [
                {"id": "650f1a2b3c4d5e6f7a8b9c10", "codigo": "PROD-001", "nombre": "Mandarina Satsuma", "categoria": "Cítricos", "stockActual": 500, "entradas90Dias": 120, "salidas90Dias": 640, "valorSalidas90Dias": 54400.0, "rotacion": 1.28, "clasificacionRotacion": "ALTA", "movimientos90Dias": 18, "ultimoMovimiento": "2026-10-15"},
                {"id": "650f1a2b3c4d5e6f7a8b9c11", "codigo": "PROD-008", "nombre": "Algodón Tangüis", "categoria": "Fibras", "stockActual": 150, "entradas90Dias": 20, "salidas90Dias": 15, "valorSalidas90Dias": 3750.0, "rotacion": 0.1, "clasificacionRotacion": "BAJA", "movimientos90Dias": 3, "ultimoMovimiento": "2026-08-02"},
            ]
        return resultado

    # -------------------------------------------------------------------------
    # PIPELINE 13: Productos con Mayor Valor de Stock
    # Colección: products
    # Toma de decisión: Priorizar capital inmovilizado y protección de inventario
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_productos_mayor_valor_stock() -> List[Dict[str, Any]]:
        db = get_database()
        productos = await _productos(db)
        pipeline = [
            {"$match": {"$expr": {"$eq": [_CAMPO_ACTIVO, True]}}},
            {
                "$addFields": {
                    "valorStock": {
                        "$multiply": [
                            _CAMPO_STOCK,
                            {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}},
                        ]
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "id": {"$toString": "$_id"},
                    "codigo": _CAMPO_CODIGO,
                    "nombre": _CAMPO_NOMBRE,
                    "categoria": _CAMPO_CATEGORIA,
                    "origen": _CAMPO_ORIGEN,
                    "stockActual": _CAMPO_STOCK,
                    "stockMinimo": _CAMPO_STOCK_MIN,
                    "precioUnitario": {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}},
                    "valorStock": {"$round": ["$valorStock", 2]},
                }
            },
            {"$sort": {"valorStock": -1}},
            {"$limit": 15},
        ]

        cursor = productos.aggregate(pipeline)
        resultado = await cursor.to_list(length=100)

        if not resultado:
            return [
                {"id": "650f1a2b3c4d5e6f7a8b9c01", "codigo": "PROD-001", "nombre": "Mandarina Satsuma", "categoria": "Cítricos", "origen": "Cañete - San Vicente", "stockActual": 500, "stockMinimo": 50, "precioUnitario": 85.0, "valorStock": 42500.0, "participacion": 21.4, "ranking": 1},
                {"id": "650f1a2b3c4d5e6f7a8b9c02", "codigo": "PROD-004", "nombre": "Espárrago Verde", "categoria": "Hortalizas", "origen": "Cañete - Quilmaná", "stockActual": 1200, "stockMinimo": 100, "precioUnitario": 18.5, "valorStock": 22200.0, "participacion": 11.2, "ranking": 2},
            ]

        total = sum(_a_float(item.get("valorStock")) for item in resultado) or 1.0
        for indice, item in enumerate(resultado, start=1):
            item["ranking"] = indice
            item["participacion"] = round(_a_float(item.get("valorStock")) * 100 / total, 1)
        return resultado

    # -------------------------------------------------------------------------
    # PIPELINE 14: Productos por Origen
    # Colección: products
    # Toma de decisión: Diversificación de zonas de abastecimiento y riesgo logístico
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_productos_por_origen() -> List[Dict[str, Any]]:
        db = get_database()
        productos = await _productos(db)
        pipeline = [
            {"$match": {"$expr": {"$eq": [_CAMPO_ACTIVO, True]}}},
            {
                "$group": {
                    "_id": _CAMPO_ORIGEN,
                    "totalProductos": {"$sum": 1},
                    "stockTotal": {"$sum": _CAMPO_STOCK},
                    "valorTotalStock": {
                        "$sum": {
                            "$multiply": [
                                _CAMPO_STOCK,
                                {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}},
                            ]
                        }
                    },
                    "precioPromedio": {
                        "$avg": {"$toDouble": {"$ifNull": [_CAMPO_PRECIO, 0]}}
                    },
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "origen": {"$ifNull": ["$_id", "SIN ORIGEN"]},
                    "totalProductos": 1,
                    "stockTotal": 1,
                    "valorTotalStock": {"$round": ["$valorTotalStock", 2]},
                    "precioPromedio": {"$round": ["$precioPromedio", 2]},
                }
            },
            {"$sort": {"totalProductos": -1, "valorTotalStock": -1}},
        ]

        cursor = productos.aggregate(pipeline)
        resultado = await cursor.to_list(length=100)

        if not resultado:
            return [
                {"origen": "Cañete - San Vicente", "totalProductos": 4, "stockTotal": 1970, "valorTotalStock": 130000.0, "precioPromedio": 93.75},
                {"origen": "Cañete - Imperial", "totalProductos": 3, "stockTotal": 1730, "valorTotalStock": 54500.0, "precioPromedio": 83.17},
            ]

        totalProductos = sum(_a_entero(item.get("totalProductos")) for item in resultado) or 1
        for item in resultado:
            item["participacion"] = round(
                _a_entero(item.get("totalProductos")) * 100 / totalProductos, 1
            )
        return resultado

    # -------------------------------------------------------------------------
    # PIPELINE 15: Top Clientes Potenciales (MongoDB + SQL Server)
    # Colecciones/Tablas: customers + customer_orders_s4
    # Toma de decisión: Priorizar cartera comercial y acciones de fidelización
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_top_clientes_potencial() -> List[Dict[str, Any]]:
        db = get_database()
        clientes = await _clientes(db)
        documentos = await clientes.find({}).to_list(length=1000)
        mapa_clientes = {str(cliente.get("_id")): cliente for cliente in documentos}

        pedidos: List[Dict[str, Any]] = []
        try:
            tabla = settings.SQLSERVER_ORDERS_TABLE
            pedidos = await sql_fetch_all(
                f"""
                SELECT customer_id,
                       COUNT(*) AS totalPedidos,
                       SUM(total) AS montoTotalComprado,
                       AVG(total) AS ticketPromedio,
                       MAX(order_date) AS ultimoPedido,
                       SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS pedidosEntregados
                FROM {tabla}
                WHERE active = 1
                GROUP BY customer_id
                """
            )
        except (SQLServerUnavailable, Exception) as exc:
            logger.warning("Top clientes potenciales sin SQL Server: %s", exc)

        resultado: List[Dict[str, Any]] = []
        for pedido in pedidos:
            cliente = mapa_clientes.get(str(pedido.get("customer_id")))
            if cliente is None:
                continue

            monto = _a_float(pedido.get("montoTotalComprado"))
            total_pedidos = _a_entero(pedido.get("totalPedidos"))

            if monto >= 50000:
                segmento = "VIP"
            elif monto >= 15000:
                segmento = "ALTO"
            elif monto >= 5000:
                segmento = "MEDIO"
            else:
                segmento = "BAJO"

            resultado.append(
                {
                    "customerId": str(cliente.get("_id")),
                    "codigo": _a_texto(_primer(cliente, "code", "codigo")),
                    "cliente": _a_texto(_primer(cliente, "businessName", "razonSocial")),
                    "pais": _a_texto(_primer(cliente, "country", "pais")),
                    "ciudad": _a_texto(_primer(cliente, "city", "ciudad")),
                    "tipoCliente": _a_texto(_primer(cliente, "customerType", "tipoCliente")),
                    "totalPedidos": total_pedidos,
                    "montoTotalComprado": round(monto, 2),
                    "ticketPromedio": round(_a_float(pedido.get("ticketPromedio")), 2),
                    "pedidosEntregados": _a_entero(pedido.get("pedidosEntregados")),
                    "ultimoPedido": _fecha_iso(pedido.get("ultimoPedido")),
                    "diasDesdeUltimoPedido": _dias_desde(pedido.get("ultimoPedido")),
                    "segmentoPotencial": segmento,
                    "indicePotencial": round(monto + total_pedidos * 1000, 2),
                }
            )

        resultado.sort(key=lambda item: item["montoTotalComprado"], reverse=True)

        if not resultado:
            return [
                {"customerId": "650f1a2b3c4d5e6f7a8b9c21", "codigo": "CLI-001", "cliente": "Agroindustrias del Sur S.A.C.", "pais": "Perú", "ciudad": "Lima", "tipoCliente": "NACIONAL", "totalPedidos": 12, "montoTotalComprado": 68450.0, "ticketPromedio": 5704.17, "pedidosEntregados": 11, "ultimoPedido": "2026-10-12", "diasDesdeUltimoPedido": 10, "segmentoPotencial": "VIP", "indicePotencial": 80450.0},
                {"customerId": "650f1a2b3c4d5e6f7a8b9c22", "codigo": "CLI-003", "cliente": "Supermercados Peruanos S.A.", "pais": "Perú", "ciudad": "Lima", "tipoCliente": "NACIONAL", "totalPedidos": 8, "montoTotalComprado": 32100.0, "ticketPromedio": 4012.5, "pedidosEntregados": 8, "ultimoPedido": "2026-10-05", "diasDesdeUltimoPedido": 17, "segmentoPotencial": "ALTO", "indicePotencial": 40100.0},
            ]
        return resultado[:15]

    # -------------------------------------------------------------------------
    # PIPELINE 16: Distribución de Clientes por Ciudad
    # Colección: customers
    # Toma de decisión: Cobertura urbana y planificación de fuerza de ventas
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_clientes_por_ciudad() -> List[Dict[str, Any]]:
        db = get_database()
        clientes = await _clientes(db)
        pipeline = [
            {"$match": {"$expr": {"$eq": [_CAMPO_ACTIVO, True]}}},
            {
                "$group": {
                    "_id": {"ciudad": _CAMPO_CIUDAD, "pais": _CAMPO_PAIS},
                    "totalClientes": {"$sum": 1},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "ciudad": {"$ifNull": ["$_id.ciudad", "SIN CIUDAD"]},
                    "pais": {"$ifNull": ["$_id.pais", "SIN PAIS"]},
                    "totalClientes": 1,
                }
            },
            {"$sort": {"totalClientes": -1, "ciudad": 1}},
        ]

        cursor = clientes.aggregate(pipeline)
        resultado = await cursor.to_list(length=100)

        if not resultado:
            return [
                {"ciudad": "Lima", "pais": "Perú", "totalClientes": 5, "porcentaje": 33.3},
                {"ciudad": "Cañete", "pais": "Perú", "totalClientes": 2, "porcentaje": 13.3},
            ]

        total = sum(_a_entero(item.get("totalClientes")) for item in resultado) or 1
        for item in resultado:
            item["porcentaje"] = round(
                _a_entero(item.get("totalClientes")) * 100 / total, 1
            )
        return resultado

    # -------------------------------------------------------------------------
    # PIPELINE 17: Pedidos por Cliente (SQL Server + MongoDB)
    # Colecciones/Tablas: customers + customer_orders_s4
    # Toma de decisión: Evaluar frecuencia, cumplimiento y concentración de pedidos
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_pedidos_por_cliente() -> List[Dict[str, Any]]:
        db = get_database()
        clientes = await _clientes(db)
        documentos = await clientes.find({}).to_list(length=1000)
        mapa_clientes = {str(cliente.get("_id")): cliente for cliente in documentos}

        pedidos: List[Dict[str, Any]] = []
        try:
            tabla = settings.SQLSERVER_ORDERS_TABLE
            pedidos = await sql_fetch_all(
                f"""
                SELECT customer_id,
                       COUNT(*) AS totalPedidos,
                       SUM(total) AS montoTotal,
                       AVG(total) AS ticketPromedio,
                       SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS entregados,
                       SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelados,
                       MIN(order_date) AS primerPedido,
                       MAX(order_date) AS ultimoPedido
                FROM {tabla}
                WHERE active = 1
                GROUP BY customer_id
                """
            )
        except (SQLServerUnavailable, Exception) as exc:
            logger.warning("Pedidos por cliente sin SQL Server: %s", exc)

        resultado: List[Dict[str, Any]] = []
        for pedido in pedidos:
            cliente = mapa_clientes.get(str(pedido.get("customer_id")))
            total_pedidos = _a_entero(pedido.get("totalPedidos"))
            entregados = _a_entero(pedido.get("entregados"))
            cancelados = _a_entero(pedido.get("cancelados"))

            resultado.append(
                {
                    "customerId": str(pedido.get("customer_id")),
                    "codigo": _a_texto(_primer(cliente or {}, "code", "codigo")),
                    "cliente": _a_texto(
                        _primer(cliente or {}, "businessName", "razonSocial")
                    ),
                    "pais": _a_texto(_primer(cliente or {}, "country", "pais")),
                    "ciudad": _a_texto(_primer(cliente or {}, "city", "ciudad")),
                    "totalPedidos": total_pedidos,
                    "montoTotal": round(_a_float(pedido.get("montoTotal")), 2),
                    "ticketPromedio": round(_a_float(pedido.get("ticketPromedio")), 2),
                    "pedidosEntregados": entregados,
                    "pedidosCancelados": cancelados,
                    "tasaCumplimiento": round(entregados * 100 / total_pedidos, 1)
                    if total_pedidos > 0
                    else 0.0,
                    "primerPedido": _fecha_iso(pedido.get("primerPedido")),
                    "ultimoPedido": _fecha_iso(pedido.get("ultimoPedido")),
                }
            )

        resultado.sort(key=lambda item: item["totalPedidos"], reverse=True)

        if not resultado:
            return [
                {"customerId": "650f1a2b3c4d5e6f7a8b9c21", "codigo": "CLI-001", "cliente": "Agroindustrias del Sur S.A.C.", "pais": "Perú", "ciudad": "Lima", "totalPedidos": 12, "montoTotal": 68450.0, "ticketPromedio": 5704.17, "pedidosEntregados": 11, "pedidosCancelados": 1, "tasaCumplimiento": 91.7, "primerPedido": "2026-06-01", "ultimoPedido": "2026-10-12"},
                {"customerId": "650f1a2b3c4d5e6f7a8b9c23", "codigo": "CLI-005", "cliente": "Mercado Mayorista Cañete E.I.R.L.", "pais": "Perú", "ciudad": "Cañete", "totalPedidos": 6, "montoTotal": 12400.0, "ticketPromedio": 2066.67, "pedidosEntregados": 5, "pedidosCancelados": 1, "tasaCumplimiento": 83.3, "primerPedido": "2026-07-10", "ultimoPedido": "2026-09-28"},
            ]
        return resultado

    # -------------------------------------------------------------------------
    # PIPELINE 18: Movimientos de Stock Valorados (SQL Server + MongoDB)
    # Colecciones/Tablas: products + product_stock_movements
    # Toma de decisión: Controlar entradas/salidas valoradas y detectar desbalances
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_movimientos_stock_valorados() -> List[Dict[str, Any]]:
        db = get_database()
        productos = await _productos(db)
        documentos = await productos.find({}).to_list(length=1000)
        mapa_productos = {str(producto.get("_id")): producto for producto in documentos}

        movimientos: List[Dict[str, Any]] = []
        try:
            tabla = settings.SQLSERVER_MOVEMENTS_TABLE
            movimientos = await sql_fetch_all(
                f"""
                SELECT product_id,
                       SUM(CASE WHEN movement_type = 'IN' THEN quantity ELSE 0 END) AS entradas,
                       SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) AS salidas,
                       SUM(CASE WHEN movement_type = 'IN' THEN total_value ELSE 0 END) AS valorEntradas,
                       SUM(CASE WHEN movement_type = 'OUT' THEN total_value ELSE 0 END) AS valorSalidas,
                       COUNT(*) AS totalMovimientos,
                       MAX(movement_date) AS ultimoMovimiento
                FROM {tabla}
                WHERE active = 1
                GROUP BY product_id
                """
            )
        except (SQLServerUnavailable, Exception) as exc:
            logger.warning("Movimientos valorados sin SQL Server: %s", exc)

        resultado: List[Dict[str, Any]] = []
        for movimiento in movimientos:
            producto = mapa_productos.get(str(movimiento.get("product_id"))) or {}
            valor_entradas = round(_a_float(movimiento.get("valorEntradas")), 2)
            valor_salidas = round(_a_float(movimiento.get("valorSalidas")), 2)
            valor_neto = round(valor_entradas - valor_salidas, 2)

            resultado.append(
                {
                    "productId": str(movimiento.get("product_id")),
                    "codigo": _a_texto(_primer(producto, "code", "codigo")),
                    "producto": _a_texto(_primer(producto, "name", "nombre")),
                    "categoria": _a_texto(_primer(producto, "category", "categoria")),
                    "entradas": _a_entero(movimiento.get("entradas")),
                    "salidas": _a_entero(movimiento.get("salidas")),
                    "valorEntradas": valor_entradas,
                    "valorSalidas": valor_salidas,
                    "valorNeto": valor_neto,
                    "totalMovimientos": _a_entero(movimiento.get("totalMovimientos")),
                    "ultimoMovimiento": _fecha_iso(movimiento.get("ultimoMovimiento")),
                    "estadoBalance": "SUPERAVIT" if valor_neto >= 0 else "DEFICIT",
                }
            )

        resultado.sort(key=lambda item: abs(item["valorNeto"]), reverse=True)

        if not resultado:
            return [
                {"productId": "650f1a2b3c4d5e6f7a8b9c01", "codigo": "PROD-001", "producto": "Mandarina Satsuma", "categoria": "Cítricos", "entradas": 800, "salidas": 640, "valorEntradas": 68000.0, "valorSalidas": 54400.0, "valorNeto": 13600.0, "totalMovimientos": 24, "ultimoMovimiento": "2026-10-15", "estadoBalance": "SUPERAVIT"},
                {"productId": "650f1a2b3c4d5e6f7a8b9c04", "codigo": "PROD-004", "producto": "Espárrago Verde", "categoria": "Hortalizas", "entradas": 900, "salidas": 1100, "valorEntradas": 16650.0, "valorSalidas": 20350.0, "valorNeto": -3700.0, "totalMovimientos": 31, "ultimoMovimiento": "2026-10-18", "estadoBalance": "DEFICIT"},
            ]
        return resultado

    # -------------------------------------------------------------------------
    # PIPELINE 12: Análisis de Rotación de Inventario
    # Colección: productos
    # Toma de decisión: Identificar productos de lenta rotación que ocupan capital
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_rotacion_inventario() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"estado": True}},
            {
                "$project": {
                    "_id": 0,
                    "codigo": 1,
                    "nombre": 1,
                    "categoria": 1,
                    "stockActual": 1,
                    "precioUnitario": {"$toDouble": "$precioUnitario"},
                    "valorInventario": {
                        "$round": [
                            {"$multiply": ["$stockActual", {"$toDouble": "$precioUnitario"}]},
                            2
                        ]
                    },
                    "diasStockEstimado": {
                        "$cond": [
                            {"$gt": ["$stockActual", 0]},
                            {"$multiply": ["$stockActual", 30]},  # Estimación simplificada
                            0
                        ]
                    },
                    "clasificacionRotacion": {
                        "$cond": [
                            {"$gte": ["$stockActual", {"$multiply": ["$stockMinimo", 3]}]},
                            "LENTA",
                            {
                                "$cond": [
                                    {"$gte": ["$stockActual", {"$multiply": ["$stockMinimo", 1.5]}]},
                                    "MEDIA",
                                    "RAPIDA"
                                ]
                            }
                        ]
                    }
                }
            },
            {"$sort": {"valorInventario": -1}},
            {"$limit": 50}
        ]

        cursor = db.productos.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"codigo": "PROD-101", "nombre": "Fertilizante NPK", "categoria": "Fertilizantes", "stockActual": 500, "precioUnitario": 95.0, "valorInventario": 47500.0, "diasStockEstimado": 15000, "clasificacionRotacion": "LENTA"}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 13: Productos con Mayor Valor en Stock
    # Colección: productos
    # Toma de decisión: Priorización de seguridad y control de inventario de alto valor
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_productos_mayor_valor_stock() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"estado": True}},
            {
                "$addFields": {
                    "valorTotalStock": {
                        "$multiply": ["$stockActual", {"$toDouble": "$precioUnitario"}]
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "codigo": 1,
                    "nombre": 1,
                    "categoria": 1,
                    "stockActual": 1,
                    "precioUnitario": {"$toDouble": "$precioUnitario"},
                    "valorTotalStock": {"$round": ["$valorTotalStock", 2]},
                    "porcentajeStock": {
                        "$cond": [
                            {"$gt": ["$stockMinimo", 0]},
                            {
                                "$round": [
                                    {"$multiply": [{"$divide": ["$stockActual", "$stockMinimo"]}, 100]},
                                    1
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            {"$sort": {"valorTotalStock": -1}},
            {"$limit": 20}
        ]

        cursor = db.productos.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"codigo": "PROD-201", "nombre": "Sistema Riego Automático", "categoria": "Sistemas de Riego", "stockActual": 50, "precioUnitario": 1500.0, "valorTotalStock": 75000.0, "porcentajeStock": 250.0}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 14: Productos por Origen Geográfico
    # Colección: productos
    # Toma de decisión: Análisis de dependencia de proveedores por país
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_productos_por_origen() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"estado": True}},
            {
                "$group": {
                    "_id": "$origen",
                    "totalProductos": {"$sum": 1},
                    "stockTotal": {"$sum": "$stockActual"},
                    "valorTotal": {
                        "$sum": {
                            "$multiply": ["$stockActual", {"$toDouble": "$precioUnitario"}]
                        }
                    },
                    "precioPromedio": {"$avg": {"$toDouble": "$precioUnitario"}},
                    "categorias": {"$addToSet": "$categoria"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "paisOrigen": "$_id",
                    "totalProductos": 1,
                    "stockTotal": 1,
                    "valorTotal": {"$round": ["$valorTotal", 2]},
                    "precioPromedio": {"$round": ["$precioPromedio", 2]},
                    "totalCategorias": {"$size": "$categorias"}
                }
            },
            {"$sort": {"valorTotal": -1}}
        ]

        cursor = db.productos.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"paisOrigen": "Perú", "totalProductos": 15, "stockTotal": 2500, "valorTotal": 185000.0, "precioPromedio": 120.5, "totalCategorias": 4},
                {"paisOrigen": "Chile", "totalProductos": 8, "stockTotal": 800, "valorTotal": 95000.0, "precioPromedio": 150.0, "totalCategorias": 3}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 15: Top Clientes por Potencial de Compra
    # Colección: customers
    # Toma de decisión: Priorización comercial y asignación de recursos de venta
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_top_clientes_potencial() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"active": True}},
            {
                "$project": {
                    "_id": 0,
                    "code": 1,
                    "businessName": 1,
                    "country": 1,
                    "city": 1,
                    "customerType": 1,
                    "primaryContact": 1,
                    "potencialCompra": {
                        "$switch": {
                            "branches": [
                                {"case": {"$eq": ["$customerType", "exportador"]}, "then": "ALTO"},
                                {"case": {"$eq": ["$customerType", "importador"]}, "then": "ALTO"},
                                {"case": {"$eq": ["$customerType", "mayorista"]}, "then": "MEDIO"},
                                {"case": {"$eq": ["$customerType", "distribuidor"]}, "then": "MEDIO"}
                            ],
                            "default": "BAJO"
                        }
                    },
                    "prioridad": {
                        "$switch": {
                            "branches": [
                                {"case": {"$eq": ["$customerType", "exportador"]}, "then": 5},
                                {"case": {"$eq": ["$customerType", "importador"]}, "then": 5},
                                {"case": {"$eq": ["$customerType", "mayorista"]}, "then": 3},
                                {"case": {"$eq": ["$customerType", "distribuidor"]}, "then": 3}
                            ],
                            "default": 1
                        }
                    }
                }
            },
            {"$sort": {"prioridad": -1, "businessName": 1}},
            {"$limit": 30}
        ]

        cursor = db.customers.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"code": "CLI-001", "businessName": "Agro Export SAC", "country": "Perú", "city": "Lima", "customerType": "exportador", "primaryContact": {"name": "Juan Pérez", "email": "juan@agroexport.com"}, "potencialCompra": "ALTO", "prioridad": 5}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 16: Clientes por Ciudad/Región
    # Colección: customers
    # Toma de decisión: Planificación de rutas comerciales y expansión territorial
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_clientes_por_ciudad() -> List[Dict[str, Any]]:
        db = get_database()
        pipeline = [
            {"$match": {"active": True}},
            {
                "$group": {
                    "_id": {
                        "pais": "$country",
                        "ciudad": "$city"
                    },
                    "totalClientes": {"$sum": 1},
                    "tiposCliente": {"$addToSet": "$customerType"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "pais": "$_id.pais",
                    "ciudad": "$_id.ciudad",
                    "totalClientes": 1,
                    "diversidadTipos": {"$size": "$tiposCliente"}
                }
            },
            {"$sort": {"totalClientes": -1}}
        ]

        cursor = db.customers.aggregate(pipeline)
        result = await cursor.to_list(length=100)
        
        if not result:
            return [
                {"pais": "Perú", "ciudad": "Lima", "totalClientes": 15, "diversidadTipos": 4},
                {"pais": "Perú", "ciudad": "Arequipa", "totalClientes": 5, "diversidadTipos": 2}
            ]
        return result

    # -------------------------------------------------------------------------
    # PIPELINE 17: Análisis de Pedidos por Cliente (SQL Server + MongoDB)
    # Colecciones/Tablas: customer_orders_s4 (SQL) + customers (MongoDB)
    # Toma de decisión: Identificación de clientes frecuentes y volumen de negocio
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_pedidos_por_cliente() -> List[Dict[str, Any]]:
        """
        INDICADOR TRANSVERSAL: Combina datos de SQL Server (pedidos) con MongoDB (clientes)
        Para una implementación completa, necesitarías conectar a SQL Server.
        Por ahora, retorna estructura de ejemplo con datos simulados.
        """
        # TODO: Implementar conexión a SQL Server para obtener pedidos reales
        # from app.database.sqlserver_connection import get_sqlserver_connection
        
        # Simulación de datos transversales
        return [
            {
                "customerId": "650f1a2b3c4d5e6f7a8b9c01",
                "customerName": "Agro Export SAC",
                "country": "Perú",
                "totalPedidos": 15,
                "pedidosPendientes": 2,
                "pedidosEntregados": 13,
                "montoTotalAcumulado": 125000.50,
                "ticketPromedio": 8333.37,
                "ultimoPedidoFecha": "2024-01-15",
                "estado": "ACTIVO"
            },
            {
                "customerId": "650f1a2b3c4d5e6f7a8b9c02",
                "customerName": "Distribuidora del Valle EIRL",
                "country": "Perú",
                "totalPedidos": 8,
                "pedidosPendientes": 1,
                "pedidosEntregados": 7,
                "montoTotalAcumulado": 45600.00,
                "ticketPromedio": 5700.0,
                "ultimoPedidoFecha": "2024-01-10",
                "estado": "ACTIVO"
            }
        ]

    # -------------------------------------------------------------------------
    # PIPELINE 18: Movimientos de Stock Valorados (SQL Server + MongoDB)
    # Colecciones/Tablas: product_stock_movements (SQL) + products (MongoDB)
    # Toma de decisión: Control de valoración de entradas y salidas de inventario
    # -------------------------------------------------------------------------
    @staticmethod
    async def aggregate_movimientos_stock_valorados() -> List[Dict[str, Any]]:
        """
        INDICADOR TRANSVERSAL: Combina datos de SQL Server (movimientos) con MongoDB (productos)
        Para una implementación completa, necesitarías conectar a SQL Server.
        Por ahora, retorna estructura de ejemplo con datos simulados.
        """
        # TODO: Implementar conexión a SQL Server para obtener movimientos reales
        # from app.database.sqlserver_connection import get_sqlserver_connection
        
        # Simulación de datos transversales
        return [
            {
                "productId": "650f1a2b3c4d5e6f7a8b9c10",
                "productCode": "PROD-101",
                "productName": "Fertilizante NPK 20-20-20",
                "categoria": "Fertilizantes",
                "totalMovimientos": 25,
                "movimientosIN": 15,
                "movimientosOUT": 10,
                "cantidadTotalIN": 800,
                "cantidadTotalOUT": 550,
                "valorTotalIN": 76000.0,
                "valorTotalOUT": 52250.0,
                "diferenciaValor": 23750.0,
                "stockActual": 250,
                "valorStockActual": 23750.0
            },
            {
                "productId": "650f1a2b3c4d5e6f7a8b9c11",
                "productCode": "PROD-202",
                "productName": "Semilla Maíz Híbrido",
                "categoria": "Semillas",
                "totalMovimientos": 18,
                "movimientosIN": 10,
                "movimientosOUT": 8,
                "cantidadTotalIN": 400,
                "cantidadTotalOUT": 320,
                "valorTotalIN": 96000.0,
                "valorTotalOUT": 76800.0,
                "diferenciaValor": 19200.0,
                "stockActual": 80,
                "valorStockActual": 19200.0
            }
        ]
