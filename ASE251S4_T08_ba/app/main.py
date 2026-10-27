from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config.settings import settings
from app.database.connection import close_mongo_connection, connect_to_mongo
from app.routers.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Evento de inicio
    await connect_to_mongo()
    yield
    # Evento de apagado
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## 🚀 Servicios analíticos mediante endpoints API orientados a la toma de decisiones empresariales

    Documentación oficial de los servicios analíticos desarrollados mediante pipelines de agregación MongoDB para el proyecto **ASE251S4_T08_ba** (Valle Grande).

    ---

    ### 📊 18 Servicios Analíticos Disponibles:
    **Productos e inventario:** resumen por categoría, alerta de reabastecimiento,
    rotación de inventario, productos de mayor valor de stock, productos por origen y
    movimientos de stock valorados.

    **Agroquímicos:** ranking de fabricantes, distribución por categoría, vencimiento
    SENASA, ingredientes activos, carencia por categoría y dosificación por tipo.

    **Clientes y pedidos:** KPIs, clientes por país, por tipo y por ciudad, top clientes
    potenciales y pedidos por cliente.

    Los indicadores transversales combinan **MongoDB** (maestros) con **SQL Server**
    (transaccionales: pedidos y movimientos de almacén).
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Router Analítico
app.include_router(analytics_router, prefix=settings.API_PREFIX)


@app.get("/", include_in_schema=False)
async def root():
    """Redirige automáticamente a la documentación Swagger UI."""
    return RedirectResponse(url="/docs")