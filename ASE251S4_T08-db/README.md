# ASE251S4_T08-db

Repositorio de infraestructura de base de datos del proyecto **AVSA Cañete**.
Implementa persistencia poliglota como código: **SQL Server 2022** para datos
transaccionales y **MongoDB 7** para catálogos con esquema flexible.

El versionado del esquema se hace con **Liquibase Community 4.33**, aplicado
por un runner Docker sobre ambos motores. Las imágenes de motor
(`sqlserver/` y `mongodb/`, con su `run.sh`) se mantienen como alternativa
legacy reproducible.

> **Nota:** Este proyecto utiliza Liquibase para el versionamiento de bases de datos.
> A diferencia de otros proyectos que incluyen un servicio "Checker" de Java para validación,
> este repositorio se enfoca exclusivamente en la infraestructura de bases de datos.
> La validación del estado de las migraciones se realiza consultando las tablas
> `DATABASECHANGELOG` que Liquibase mantiene automáticamente en cada motor.

---

## 🎯 ¿Primera vez? ¡Empieza aquí!

### 📖 Guía completa
👉 **[docs/GUIA-COMPLETA.md](docs/GUIA-COMPLETA.md)** — TODO en un solo documento

### Instalación rápida (3 comandos)
```powershell
Copy-Item .env.example .env
docker compose up -d --build
.\test-connection.ps1
```

### Conexiones rápidas
- **SSMS:** `localhost,1433` (user: `sa`, pass: `Avsa@Admin12345`)
- **MongoDB Compass:** `mongodb://localhost:27017/?directConnection=true`

---

## 🚀 Quick Start (para otra laptop)

¿Vas a probar esto en otra computadora? 

1. **Instala Docker Desktop** (versión 20.10+)
2. **Clona/copia el repositorio**
3. **Ejecuta:**
   ```powershell
   Copy-Item .env.example .env
   docker compose up -d --build
   .\test-connection.ps1
   ```

**Documentación completa:** [docs/GUIA-COMPLETA.md](docs/GUIA-COMPLETA.md)

---

## Estructura del repositorio

```
ASE251S4_T08-db/
├── compose.yaml               Levanta motores + Liquibase (flujo principal)
├── .env.example               Variables de entorno requeridas
├── .dockerignore
├── .gitignore
├── README.md
├── docker/
│   └── liquibase/
│       ├── Dockerfile         Imagen del runner (Maven + liquibase/liquibase:4.33.0)
│       └── pom.xml            Dependencias (extensión liquibase-mongodb + drivers)
├── db/                        Changelogs de Liquibase (montados en /workspace/db)
│   ├── sqlserver/
│   │   ├── changelog.xml
│   │   └── changes/
│   │       ├── V001__baseline.sql
│   │       └── V002__add_audit_indexes.sql
│   └── mongodb/
│       ├── changelog.xml
│       └── changes/
│           ├── V001__baseline.xml
│           ├── V002__add_aggregation_views.xml
│           └── V003__embedding_and_referencing.xml
├── docs/
│   ├── architecture.md            Arquitectura general
│   ├── data-ownership.md          Matriz de propiedad de datos
│   ├── guia-paso-a-paso.md        Guía del enfoque legacy (run.sh)
│   ├── liquibase-implementation.md
│   └── mongodb-acid-transactions.md
├── sqlserver/                 Imagen legacy (auto-migración con run.sh)
│   ├── Dockerfile
│   ├── run.sh
│   ├── bootstrap/V001__baseline.sql
│   ├── changes/V002__add_audit_indexes.sql
│   ├── checks/contract.sql
│   └── metadata/record-change.sql
└── mongodb/                   Imagen legacy (auto-migración con run.sh)
    ├── Dockerfile
    ├── run.sh
    ├── replica/init-replica.sh    Inicializa el replica set rs0 (ACID)
    ├── examples/transactions_acid.js
    ├── examples/run-transactions.sh
    ├── bootstrap/V001__baseline.js
    ├── changes/V002__add_aggregation_views.js
    ├── changes/V003__embedding_and_referencing.js
    ├── checks/contract.js
    └── metadata/record-change.js
```

---

## Versionado con Liquibase

Cada motor tiene un `changelog.xml` maestro que incluye sus changesets en
orden. Liquibase registra lo aplicado en `DATABASECHANGELOG` y bloquea la
ejecución concurrente con `DATABASECHANGELOGLOCK`, reemplazando las tablas de
control caseras (`dbo.schema_change` / `schema_changes`).

| Motor | Changelog | Formato |
|---|---|---|
| SQL Server 2022 | `db/sqlserver/changelog.xml` | formatted SQL |
| MongoDB 7 | `db/mongodb/changelog.xml` | XML (extensión `liquibase-mongodb`) |

Historias cubiertas:

- **V001** — baseline completo (tablas/colecciones, constraints, validadores,
  índices, vistas, datos semilla).
- **V002** — índices de auditoría/alertas (SQL Server) y vistas de agregación
  (MongoDB).
- **V003** — patrón **EMBEDDING vs REFERENCING** en MongoDB.

Detalles en [docs/liquibase-implementation.md](docs/liquibase-implementation.md).

---

## Cómo levantar el entorno

### 1. Configurar variables de entorno

Primero copia la plantilla y ajusta las credenciales:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# Linux/Mac
cp .env.example .env
```

El archivo `.env` debe contener:

```dotenv
IMAGE_NAMESPACE=avsa-t08
RELEASE_VERSION=local
MSSQL_SA_PASSWORD=Avsa@Admin12345
MSSQL_PID=Express
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=avsa_db
MONGODB_PORT=27017
MONGODB_DATABASE=db_avsa
MONGODB_REPLICA_SET=rs0
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=Avsa@Admin12345
```

### 2. Validar la configuración

Desde la raíz del repositorio, valida que Docker Compose puede leer la configuración:

```powershell
# Comprobar Docker
docker --version
docker compose version

# Validar configuración
docker compose config
```

### 3. Construir las imágenes

```powershell
docker compose build
```

### 4. Levantar los servicios

Opción completa (recomendada):

```powershell
docker compose up -d --build
```

Esto arranca, en orden: `sqlserver` y `mongodb` (con healthcheck),
`sqlserver-init` (crea `avsa_db`), `mongodb-init` (replica set `rs0`),
`liquibase-sqlserver` y `liquibase-mongodb` (aplican los changelogs).

Opción paso a paso:

```powershell
# 1. Levantar solo los motores de base de datos
docker compose up -d sqlserver mongodb

# 2. Consultar el estado
docker compose ps

# 3. Esperar hasta que sqlserver y mongodb aparezcan como "healthy"
docker compose logs -f sqlserver mongodb

# Salir de los logs con Ctrl + C (esto no detiene los contenedores)

# 4. Inicializar SQL Server
docker compose up sqlserver-init

# 5. Inicializar MongoDB (replica set)
docker compose up mongodb-init

# 6. Aplicar migraciones con Liquibase
docker compose up liquibase-sqlserver
docker compose up liquibase-mongodb
```

### 5. Verificar el estado

Consultar logs de las migraciones:

```powershell
docker compose logs liquibase-sqlserver
docker compose logs liquibase-mongodb
```

Ver todos los servicios:

```powershell
docker compose ps
```

### Comandos de Liquibase

El runner acepta cualquier comando de Liquibase como argumento:

```powershell
# Ver estado de los changesets
docker compose run --rm liquibase-sqlserver status --verbose

# Ver historial aplicado
docker compose run --rm liquibase-mongodb history

# Rollback (solo SQL Server, 1 changeset)
docker compose run --rm liquibase-sqlserver rollback-count --count=1

# Aplicar migraciones manualmente
docker compose run --rm liquibase-sqlserver update
docker compose run --rm liquibase-mongodb update
```

---

## Transacciones ACID en MongoDB

MongoDB ofrece transacciones multi-documento **siempre que corra como replica
set**; por eso `compose.yaml` lo levanta con `--replSet rs0`. El ejemplo
`mongodb/examples/transactions_acid.js` demuestra un `commit` consistente
(pedido + stock + auditoría) y un `rollback` por stock insuficiente.

```powershell
docker compose up -d
./mongodb/examples/run-transactions.sh
```

Detalles en [docs/mongodb-acid-transactions.md](docs/mongodb-acid-transactions.md).

---

## Gestión del entorno

### Detener el laboratorio (sin borrar datos)

```powershell
docker compose down
```

Los volúmenes de datos se conservan. Para volver a levantar:

```powershell
docker compose up -d
```

### Reinicio completo (elimina volúmenes y datos)

```powershell
docker compose down -v
```

Después del reinicio completo debes repetir la construcción y los pasos de inicialización:

```powershell
docker compose up -d --build
```

### Ver logs en tiempo real

```powershell
# Todos los servicios
docker compose logs -f

# Un servicio específico
docker compose logs -f sqlserver
docker compose logs -f mongodb
docker compose logs -f liquibase-sqlserver
docker compose logs -f liquibase-mongodb
```

Salir de los logs con `Ctrl + C` (esto no detiene los contenedores).

### Reiniciar un servicio específico

```powershell
docker compose restart sqlserver
docker compose restart mongodb
```

### Ver el estado de los servicios

```powershell
docker compose ps
```

### Ejecutar comandos dentro de los contenedores

SQL Server:

```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C
```

MongoDB:

```powershell
docker compose exec mongodb mongosh
```

---

## Verificación completa del sistema

### 1. Verificar que los contenedores están corriendo

```powershell
docker compose ps
```

Deberías ver `sqlserver` y `mongodb` en estado "Up" y "healthy".

### 2. Verificar la base de datos de SQL Server

```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -Q "SELECT name FROM sys.databases WHERE name = 'avsa_db'"
```

Debería mostrar `avsa_db`.

### 3. Verificar las tablas de SQL Server

```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -d avsa_db -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
```

### 4. Verificar el changeset de Liquibase en SQL Server

```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -d avsa_db -Q "SELECT COUNT(*) AS total_changesets FROM DATABASECHANGELOG"
```

### 5. Verificar la base de datos de MongoDB

```powershell
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('listDatabases').databases.filter(d => d.name === 'db_avsa').map(d => d.name)"
```

### 6. Verificar las colecciones de MongoDB

```powershell
docker compose exec mongodb mongosh db_avsa --quiet --eval "db.getCollectionNames()"
```

### 7. Verificar el changeset de Liquibase en MongoDB

```powershell
docker compose exec mongodb mongosh db_avsa --quiet --eval "db.DATABASECHANGELOG.countDocuments()"
```

### 8. Verificar el replica set de MongoDB (requerido para ACID)

```powershell
docker compose exec mongodb mongosh --quiet --eval "rs.status().set"
```

Debería mostrar `rs0`.

---

## Enfoque legacy (auto-migración con `run.sh`)

Las carpetas `sqlserver/` y `mongodb/` siguen empaquetando cada motor como una
imagen Docker que, al arrancar, aplica sus scripts (`bootstrap/` → `changes/`)
y registra cada cambio en su tabla/colección de control. Se conserva como
referencia del mecanismo anterior:

```bash
docker build -t ase251s4-db-sqlserver:1.0 ./sqlserver
docker build -t ase251s4-db-mongodb:1.0  ./mongodb
```

Guía completa en [docs/guia-paso-a-paso.md](docs/guia-paso-a-paso.md).

---

## Conexión a las bases de datos

### SQL Server Management Studio (SSMS)

Abrir SSMS y crear una conexión con:

| Campo | Valor |
|---|---|
| Server type | Database Engine |
| Server name | `localhost,1433` |
| Authentication | SQL Server Authentication |
| Login | `sa` |
| Password | `Avsa@Admin12345` |
| Trust server certificate | Activado |

Después de conectar, seleccionar la base:

```text
Databases > avsa_db
```

Consulta para comprobar las tablas:

```sql
USE avsa_db;
GO

SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';
GO
```

Consulta para comprobar el historial de versionamiento con Liquibase:

```sql
USE avsa_db;
GO

SELECT ID, AUTHOR, FILENAME, DATEEXECUTED, ORDEREXECUTED, EXECTYPE, MD5SUM
FROM DATABASECHANGELOG
ORDER BY ORDEREXECUTED;
GO
```

### MongoDB Compass

Abrir MongoDB Compass y utilizar la cadena de conexión:

```text
mongodb://localhost:27017/?directConnection=true
```

O llenar los campos manualmente:

| Campo | Valor |
|---|---|
| Host | `localhost` |
| Port | `27017` |
| Authentication | None (entorno de desarrollo) |

Seleccionar la base `db_avsa`.

Para verificar las colecciones, abrir la consola de MongoDB y ejecutar:

```javascript
use db_avsa
show collections
```

Para consultar el historial de versiones con Liquibase:

```javascript
db.DATABASECHANGELOG.find().sort({ ORDEREXECUTED: 1 }).pretty()
```

### Conexión por consola con `mongosh`

Abrir una consola de MongoDB dentro del contenedor:

```powershell
docker compose exec mongodb mongosh
```

Dentro de `mongosh`:

```javascript
use db_avsa
show collections
db.DATABASECHANGELOG.find().sort({ ORDEREXECUTED: 1 }).pretty()
```

Salir:

```javascript
exit
```

### Datos de conexión (resumen)

| Motor      | Host        | Puerto | Base de datos | Usuario | Password |
|------------|-------------|--------|---------------|---------|----------|
| SQL Server | `localhost` | `1433` | `avsa_db`     | `sa`    | `Avsa@Admin12345` |
| MongoDB    | `localhost` | `27017`| `db_avsa`     | N/A (sin auth en desarrollo) | N/A |

> Los puertos publicados en el host se controlan con `SQLSERVER_PORT` y
> `MONGODB_PORT` en `.env`; cámbialos si ya están ocupados. El tráfico
> interno entre contenedores sigue usando `sqlserver:1433` y `mongodb:27017`.

---

## Documentación técnica

- **[GUIA-COMPLETA.md](docs/GUIA-COMPLETA.md)** — ⭐ **LEE ESTO PRIMERO** - Todo en un solo documento
- [Implementación de Liquibase](docs/liquibase-implementation.md) — Detalles técnicos de Liquibase
- [Transacciones ACID en MongoDB](docs/mongodb-acid-transactions.md) — Uso de transacciones
- [Arquitectura del repositorio](docs/architecture.md) — Estructura y componentes
- [Matriz de propiedad de datos](docs/data-ownership.md) — Responsabilidades de datos
- [Guía paso a paso (legacy)](docs/guia-paso-a-paso.md) — Enfoque con run.sh
