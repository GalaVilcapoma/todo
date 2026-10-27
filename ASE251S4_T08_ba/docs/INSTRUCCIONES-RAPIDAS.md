# INSTRUCCIONES RÁPIDAS - ASE251S4_T08_ba

## Estado actual

- 18 endpoints implementados.
- 18 rutas verificadas en el esquema OpenAPI.
- Aplicación importable con FastAPI y Pydantic.
- Ejecución de los pipelines pendiente de MongoDB y SQL Server.

## Requisitos

- Python 3.14 o superior.
- MongoDB accesible.
- SQL Server accesible para los indicadores 12, 15, 17 y 18.
- Driver ODBC 18 para SQL Server si se usan los indicadores transversales.

## Instalación

```bash
cd ASE251S4_T08_ba
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Configuración

Copiar `.env.example` a `.env` y ajustar:

```env
MONGODB_URI=mongodb://localhost:27017/db_agrochemicals
DATABASE_NAME=db_agrochemicals

SQLSERVER_ENABLED=true
SQLSERVER_HOST=localhost
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=avsa_db
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=changeme
SQLSERVER_DRIVER=ODBC Driver 18 for SQL Server
```

## Verificar sin bases de datos

```bash
.venv\Scripts\python.exe -c "from app.main import app; print(len(app.openapi()['paths']))"
```

Resultado esperado: `18`.

## Iniciar el servidor

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI: `http://localhost:8000/openapi.json`

Si MongoDB no está disponible, el arranque normal falla en el evento de inicio porque se ejecuta un `ping` a la base. Para revisar solo la documentación se puede usar:

```bash
uvicorn app.main:app --port 8000 --lifespan off
```

## Probar los 18 indicadores

```bash
python test_endpoints.py
```

El script conecta a MongoDB y recorre los 18 métodos del servicio. Los indicadores 12, 15, 17 y 18 necesitan SQL Server; si no está disponible, el repositorio registra la advertencia y devuelve el resultado parcial o de ejemplo que corresponda.

## Postman

1. Importar `Backend-Analitico-API.postman_collection.json`.
2. Verificar que `{{BASE_URL}}` sea `http://localhost:8000`.
3. Ejecutar los 18 requests.

## Problemas conocidos

- Python 3.15 alpha puede ser incompatible con FastAPI/AnyIO. Usar Python 3.14 estable.
- El driver ODBC debe estar instalado en el sistema; `pip install pyodbc` no instala el driver.
- Algunos pipelines devuelven datos de ejemplo cuando la colección está vacía. No usar esos valores como evidencia de datos reales.
- No existe Dockerfile ni manifiesto Kubernetes para este backend.
