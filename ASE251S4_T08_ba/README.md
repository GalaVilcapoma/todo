# ASE251S4_T08_ba - Backend Analítico (PIT)

Backend analítico del proyecto AVSA. Expone **18 indicadores** construidos con MongoDB Aggregation Framework y, para los indicadores transversales, consultas de lectura a SQL Server.

**Asignatura:** Proyectos de Innovación Tecnológica (PIT)  
**Organización:** Valle Grande (`vallegrande`)  
**Repositorio:** `ASE251S4_T08_ba`  
**Estructura base:** FastAPI + Pydantic + Motor MongoDB + Swagger OpenAPI

## 1. Estado verificado

| Verificación | Resultado |
|---|---|
| Compilación de los módulos Python | Correcta (`py_compile`) |
| Importación de `app.main` | Correcta |
| Esquema OpenAPI generado | 18 rutas registradas |
| Servidor Uvicorn y `/openapi.json` | HTTP 200 con `--lifespan off` |
| Ejecución de los 18 pipelines con datos reales | Pendiente: requiere MongoDB y SQL Server activos |

Este README no afirma que los pipelines hayan sido ejecutados contra una base real. La verificación de ejecución debe hacerse con los servicios de base de datos disponibles.

## 2. Stack y equivalencia técnica

- FastAPI + Uvicorn para la API HTTP.
- Pydantic v2 para contratos y documentación OpenAPI.
- Motor / PyMongo para MongoDB.
- PyODBC para SQL Server.
- Python 3.14.3 para la verificación local.

La arquitectura de referencia del curso menciona Flask + Pandas. La implementación real del equipo usa FastAPI y no usa Pandas. Se mantiene FastAPI para no reescribir los 18 indicadores; esta diferencia queda documentada como desviación técnica.

## 3. Arquitectura en capas

```text
routers -> services -> repositories -> database
```

- `app/routers/analytics.py`: endpoints REST y documentación Swagger.
- `app/services/analytics_service.py`: orquestación de los indicadores.
- `app/repositories/analytics_repository.py`: pipelines MongoDB y consultas SQL Server.
- `app/schemas/analytics_schema.py`: modelos Pydantic de respuesta.
- `app/database/connection.py`: conexión asíncrona a MongoDB.
- `app/database/sqlserver.py`: acceso opcional a SQL Server.
- `app/config/settings.py`: variables de entorno.

## 4. Fuentes de datos

| Fuente | Uso |
|---|---|
| MongoDB `products` | Productos, stock, precios y origen. |
| MongoDB `customers` | Clientes, país, ciudad y segmento. |
| MongoDB `agrochemicals` | Agroquímicos, categoría, dosis y carencia SENASA. |
| SQL Server `customer_orders_s4` | Pedidos por cliente e indicadores comerciales. |
| SQL Server `product_stock_movements` | Rotación y movimientos valorados de inventario. |

Los indicadores 12, 15, 17 y 18 combinan MongoDB con SQL Server. Si SQL Server no está disponible, el repositorio registra la advertencia y responde con los datos que pueda construir desde MongoDB, o con datos de ejemplo cuando el resultado queda vacío.

## 5. Los 18 indicadores

| # | Método | Endpoint | Fuente principal |
|---|---|---|---|
| 1 | GET | `/api/v1/analytics/productos/resumen-categoria` | MongoDB |
| 2 | GET | `/api/v1/analytics/agroquimicos/ranking-fabricantes` | MongoDB |
| 3 | GET | `/api/v1/analytics/inventario/alerta-reabastecimiento` | MongoDB |
| 4 | GET | `/api/v1/analytics/clientes/kpis` | MongoDB |
| 5 | GET | `/api/v1/analytics/clientes/por-pais` | MongoDB |
| 6 | GET | `/api/v1/analytics/clientes/por-tipo` | MongoDB |
| 7 | GET | `/api/v1/analytics/agroquimicos/por-categoria` | MongoDB |
| 8 | GET | `/api/v1/analytics/agroquimicos/vencimiento-senasa` | MongoDB |
| 9 | GET | `/api/v1/analytics/agroquimicos/ingredientes-activos` | MongoDB |
| 10 | GET | `/api/v1/analytics/agroquimicos/carencia-por-categoria` | MongoDB |
| 11 | GET | `/api/v1/analytics/agroquimicos/dosificacion-por-tipo` | MongoDB |
| 12 | GET | `/api/v1/analytics/inventario/rotacion` | MongoDB + SQL Server |
| 13 | GET | `/api/v1/analytics/productos/mayor-valor-stock` | MongoDB |
| 14 | GET | `/api/v1/analytics/productos/por-origen` | MongoDB |
| 15 | GET | `/api/v1/analytics/clientes/top-potencial` | MongoDB + SQL Server |
| 16 | GET | `/api/v1/analytics/clientes/por-ciudad` | MongoDB |
| 17 | GET | `/api/v1/analytics/pedidos/por-cliente` | SQL Server + MongoDB |
| 18 | GET | `/api/v1/analytics/inventario/movimientos-valorados` | SQL Server + MongoDB |

### Indicadores 12 a 18

- **12. Rotación de inventario:** entradas, salidas, valor de salidas, rotación de 90 días, clasificación `ALTA`/`MEDIA`/`BAJA`, movimientos y último movimiento.
- **13. Mayor valor de stock:** valor del stock por producto, participación porcentual y ranking.
- **14. Productos por origen:** productos, stock, valor y precio promedio por zona de origen.
- **15. Top clientes potenciales:** pedidos, monto comprado, ticket promedio, pedidos entregados, días desde el último pedido, segmento e índice de potencial.
- **16. Clientes por ciudad:** clientes activos y participación porcentual por ciudad y país.
- **17. Pedidos por cliente:** total de pedidos, monto, ticket promedio, entregados, cancelados, tasa de cumplimiento y fechas.
- **18. Movimientos valorados:** entradas, salidas, valores, valor neto, total de movimientos y estado del balance.

## 6. Instalación y ejecución

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Abrir Swagger UI: `http://localhost:8000/docs`

Para verificar el registro de rutas sin bases de datos:

```bash
.venv\Scripts\python.exe -c "from app.main import app; print(len(app.openapi()['paths']))"
```

Para ejecutar los pipelines se necesita MongoDB accesible. Los indicadores transversales requieren además SQL Server y el driver ODBC configurado.

## 7. Variables de entorno

Copiar `.env.example` a `.env` y ajustar los valores:

```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/db_agrochemicals
DATABASE_NAME=db_agrochemicals
API_PREFIX=/api/v1

SQLSERVER_ENABLED=true
SQLSERVER_HOST=localhost
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=avsa_db
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=changeme
SQLSERVER_DRIVER=ODBC Driver 18 for SQL Server
SQLSERVER_TIMEOUT=5
SQLSERVER_ORDERS_TABLE=customer_orders_s4
SQLSERVER_MOVEMENTS_TABLE=product_stock_movements
```

No versionar el archivo `.env` con credenciales reales.

## 8. Pruebas

- `test_endpoints.py` recorre los 18 métodos del servicio.
- Requiere MongoDB activo y, para los indicadores 12, 15, 17 y 18, SQL Server activo.
- La colección Postman `Backend-Analitico-API.postman_collection.json` contiene los 18 requests.
- `EJEMPLOS-RESPUESTAS.json` contiene ejemplos ilustrativos de los contratos; no son resultados de una ejecución real.

```bash
python test_endpoints.py
```

## 9. Docker y Kubernetes

El repositorio incluye `Dockerfile` (Python 3.12 + Uvicorn + ODBC Driver 18).
Los manifiestos Kubernetes estan centralizados en el repositorio transaccional:

`ASE251S4_T08-be/manifest-alexandraquispe/`

- Deployment y Service independientes con nombre `avsa-analytics`.
- Imagen: `alexandraquispe/avsa-analytics:1.0`.
- NodePort del servicio: `30008`.
- Guia de despliegue: `manifest-alexandraquispe/README-COMANDOS.md` en el repo BE.

La imagen fue construida localmente durante la auditoria. El smoke test del contenedor
con MongoDB efimero respondio `200` en `/docs` y `/openapi.json`; la publicacion en
Docker Hub y el despliegue en AWS dependen del login y del cluster real.

## 10. Limitaciones conocidas

- La verificación de ejecución con datos reales está pendiente por ausencia de MongoDB y SQL Server en el entorno local.
- Si una colección está vacía, algunos pipelines devuelven datos de ejemplo para mantener la respuesta demostrable. Esto debe revisarse antes de usar los indicadores como fuente de verdad en producción.
- La documentación de la arquitectura objetivo menciona Flask + Pandas; este backend usa FastAPI sin Pandas.
