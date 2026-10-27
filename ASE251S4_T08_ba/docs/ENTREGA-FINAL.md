# ENTREGA FINAL - BACKEND ANALÍTICO

## ASE251S4_T08_ba

## Resumen ejecutivo

Se implementaron 18 indicadores analíticos con FastAPI, MongoDB Aggregation Framework y consultas de lectura a SQL Server. La aplicación registra las 18 rutas en OpenAPI y la colección Postman contiene los 18 requests.

La ejecución de los pipelines con datos reales queda pendiente de un entorno con MongoDB y SQL Server activos. Este documento no presenta resultados de ejecución no realizados.

## Distribución de indicadores

### Productos e inventario (6)
- #1 Resumen por categoría.
- #3 Alerta de reabastecimiento.
- #12 Rotación de inventario.
- #13 Productos con mayor valor de stock.
- #14 Productos por origen.
- #18 Movimientos de stock valorados.

### Agroquímicos (6)
- #2 Ranking de fabricantes.
- #7 Distribución por categoría.
- #8 Vencimiento SENASA.
- #9 Ingredientes activos.
- #10 Carencia por categoría.
- #11 Dosificación por tipo.

### Clientes (5)
- #4 KPIs de clientes.
- #5 Clientes por país.
- #6 Clientes por tipo.
- #15 Top clientes potenciales.
- #16 Clientes por ciudad.

### Pedidos (1)
- #17 Pedidos por cliente.

## Endpoints implementados

| # | Método | Endpoint |
|---|---|---|
| 1 | GET | `/api/v1/analytics/productos/resumen-categoria` |
| 2 | GET | `/api/v1/analytics/agroquimicos/ranking-fabricantes` |
| 3 | GET | `/api/v1/analytics/inventario/alerta-reabastecimiento` |
| 4 | GET | `/api/v1/analytics/clientes/kpis` |
| 5 | GET | `/api/v1/analytics/clientes/por-pais` |
| 6 | GET | `/api/v1/analytics/clientes/por-tipo` |
| 7 | GET | `/api/v1/analytics/agroquimicos/por-categoria` |
| 8 | GET | `/api/v1/analytics/agroquimicos/vencimiento-senasa` |
| 9 | GET | `/api/v1/analytics/agroquimicos/ingredientes-activos` |
| 10 | GET | `/api/v1/analytics/agroquimicos/carencia-por-categoria` |
| 11 | GET | `/api/v1/analytics/agroquimicos/dosificacion-por-tipo` |
| 12 | GET | `/api/v1/analytics/inventario/rotacion` |
| 13 | GET | `/api/v1/analytics/productos/mayor-valor-stock` |
| 14 | GET | `/api/v1/analytics/productos/por-origen` |
| 15 | GET | `/api/v1/analytics/clientes/top-potencial` |
| 16 | GET | `/api/v1/analytics/clientes/por-ciudad` |
| 17 | GET | `/api/v1/analytics/pedidos/por-cliente` |
| 18 | GET | `/api/v1/analytics/inventario/movimientos-valorados` |

## Cómo ejecutar

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI: `http://localhost:8000/openapi.json`
- Postman: importar `Backend-Analitico-API.postman_collection.json`
- Script de verificación: `python test_endpoints.py`

## Verificación realizada

| Verificación | Resultado |
|---|---|
| `py_compile` de los módulos | Correcto |
| Importación de `app.main` | Correcto |
| Rutas en OpenAPI | 18 |
| Uvicorn + `/openapi.json` | HTTP 200 con `--lifespan off` |
| Pipelines con MongoDB real | Pendiente |
| Indicadores con SQL Server real | Pendiente |

## Archivos entregables

- `app/routers/analytics.py`: 18 endpoints REST.
- `app/services/analytics_service.py`: métodos de servicio.
- `app/repositories/analytics_repository.py`: pipelines y consultas SQL.
- `app/schemas/analytics_schema.py`: modelos Pydantic.
- `app/database/sqlserver.py`: conexión SQL Server.
- `Backend-Analitico-API.postman_collection.json`: 18 requests.
- `test_endpoints.py`: verificación de los 18 métodos.
- `README.md`, `CHECKLIST.md`, `INSTRUCCIONES-RAPIDAS.md`: documentación.
- `EJEMPLOS-RESPUESTAS.json`: ejemplos ilustrativos de contratos.

## Tecnologías utilizadas

- FastAPI, Uvicorn y Pydantic v2.
- Motor / PyMongo para MongoDB.
- PyODBC para SQL Server.
- MongoDB Aggregation Framework.
- Swagger / OpenAPI.

## Desviación documentada

La arquitectura de referencia menciona Flask + Pandas. La implementación del equipo usa FastAPI y no usa Pandas. Se decidió mantener FastAPI para conservar los 18 indicadores y documentar la diferencia.

## Estado final

Implementación de código y registro de rutas: completados y verificados.

Ejecución con datos reales: pendiente de MongoDB y SQL Server. No se declaran los 18 indicadores como probados hasta completar esa ejecución.
