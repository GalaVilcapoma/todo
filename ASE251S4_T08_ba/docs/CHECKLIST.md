# CHECKLIST DE ENTREGA - ASE251S4_T08_ba

## Requisitos implementados

### Indicadores
- [x] 18 indicadores analíticos definidos en el router.
- [x] 18 métodos de servicio.
- [x] 18 métodos de repositorio.
- [x] Pipelines MongoDB para productos, clientes y agroquímicos.
- [x] Consultas SQL Server para rotación, clientes potenciales y pedidos.
- [x] Arquitectura en capas: routers -> services -> repositories -> database.
- [x] Manejo de errores con HTTPException.

### Documentación Swagger
- [x] Los 18 endpoints documentados con resumen y descripción.
- [x] Modelos Pydantic en `app/schemas/analytics_schema.py`.
- [x] Swagger UI disponible en `/docs`.
- [x] OpenAPI verificable en `/openapi.json`.

### Colección Postman
- [x] Archivo `Backend-Analitico-API.postman_collection.json`.
- [x] 18 requests agrupados por productos, agroquímicos, clientes y pedidos.
- [x] Variable `{{BASE_URL}}` configurada.

### Pruebas
- [x] `test_endpoints.py` recorre los 18 métodos del servicio.
- [x] Compilación de módulos con `py_compile`.
- [x] Importación de `app.main` y generación del esquema OpenAPI.
- [x] Arranque de Uvicorn y respuesta HTTP 200 en `/openapi.json` con `--lifespan off`.
- [ ] Ejecución de los 18 pipelines con MongoDB real.
- [ ] Ejecución de los indicadores 12, 15, 17 y 18 con SQL Server real.

### Documentación del proyecto
- [x] README actualizado a 18 indicadores.
- [x] Instrucciones de instalación y ejecución.
- [x] Variables de entorno documentadas.
- [x] Limitaciones y desviaciones documentadas.

## Indicadores por módulo

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

## Cómo verificar

```bash
# 1. Instalar dependencias
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 2. Verificar rutas sin bases de datos
.venv\Scripts\python.exe -c "from app.main import app; print(len(app.openapi()['paths']))"

# 3. Iniciar servidor
uvicorn app.main:app --reload --port 8000

# 4. Probar con bases de datos activas
python test_endpoints.py
```

## Estado honesto

El código está implementado y el registro de las 18 rutas está verificado. La ejecución de los pipelines con datos reales no se ha completado en este entorno porque MongoDB y SQL Server no están activos. No se debe afirmar que los 18 indicadores devuelven datos correctos hasta ejecutar `test_endpoints.py` con ambas bases disponibles.
