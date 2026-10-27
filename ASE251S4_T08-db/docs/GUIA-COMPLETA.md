# 🚀 GUÍA COMPLETA - ASE251S4_T08-db

**Proyecto:** AVSA Cañete - Equipo 08  
**Base de datos:** SQL Server 2022 + MongoDB 7 + Liquibase

---

## 📋 TABLA DE CONTENIDOS

1. [Requisitos de la máquina](#requisitos)
2. [Instalación rápida (3 pasos)](#instalacion)
3. [Verificación del sistema](#verificacion)
4. [Conexión a las bases de datos](#conexion)
5. [Comandos útiles](#comandos)
6. [Solución de problemas](#problemas)
7. [FAQ - Preguntas frecuentes](#faq)

---

<a name="requisitos"></a>
## ✅ 1. REQUISITOS DE LA MÁQUINA

### Hardware mínimo:
- **RAM:** 4 GB libres (6 GB recomendado)
- **Disco:** 5 GB libres
- **CPU:** 2 cores (4 recomendado)

### Software obligatorio:
- **Windows 10/11** (64-bit) o **macOS** o **Linux**
- **Docker Desktop** instalado y corriendo
  - Descargar: https://www.docker.com/products/docker-desktop
  - Versión mínima: Docker 20.10+ y Docker Compose 2.0+

### Software opcional:
- **SQL Server Management Studio (SSMS)** para ver SQL Server
- **MongoDB Compass** para ver MongoDB
- **Git** para clonar el repositorio

### Verificar Docker:
```powershell
docker --version
docker compose version
```

Deberías ver algo como:
```
Docker version 24.0.x
Docker Compose version v2.x.x
```

---

<a name="instalacion"></a>
## 🚀 2. INSTALACIÓN RÁPIDA (3 PASOS)

### Paso 1: Obtener el proyecto

**Opción A - Con Git:**
```powershell
git clone <URL_DEL_REPOSITORIO>
cd ASE251S4_T08-db
```

**Opción B - Sin Git:**
- Copiar toda la carpeta del proyecto
- Abrir PowerShell en la carpeta del proyecto

### Paso 2: Crear el archivo .env

```powershell
Copy-Item .env.example .env
```

Contenido del `.env`:
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

### Paso 3: Levantar todo

```powershell
docker compose up -d --build
```

**Tiempo estimado:** 10-15 minutos la primera vez, 2-3 minutos las siguientes.

---

<a name="verificacion"></a>
## ✅ 3. VERIFICACIÓN DEL SISTEMA

### Opción A: Script automático (RECOMENDADO)

```powershell
.\test-connection.ps1
```

**¿Ves todo con ✓ verde? ¡Listo!** 🎉

### Opción B: Verificación manual

#### 3.1. Ver estado de los servicios
```powershell
docker compose ps
```

Deberías ver:
- `sqlserver` → State: Up (healthy)
- `mongodb` → State: Up (healthy)

#### 3.2. Verificar SQL Server
```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -Q "SELECT name FROM sys.databases WHERE name = 'avsa_db'"
```

Debe mostrar: `avsa_db`

#### 3.3. Verificar MongoDB
```powershell
docker compose exec mongodb mongosh --quiet --eval "db.adminCommand('listDatabases').databases.filter(d => d.name === 'db_avsa').map(d => d.name)"
```

Debe mostrar: `db_avsa`

#### 3.4. Verificar changesets de Liquibase

**SQL Server:**
```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -d avsa_db -Q "SELECT COUNT(*) AS total FROM DATABASECHANGELOG"
```

**MongoDB:**
```powershell
docker compose exec mongodb mongosh db_avsa --quiet --eval "db.DATABASECHANGELOG.countDocuments()"
```

#### 3.5. Verificar replica set (ACID en MongoDB)
```powershell
docker compose exec mongodb mongosh --quiet --eval "rs.status().set"
```

Debe mostrar: `rs0`

---

<a name="conexion"></a>
## 🔌 4. CONEXIÓN A LAS BASES DE DATOS

### Datos de conexión

| Servicio   | Host        | Puerto | Base de datos | Usuario | Password          |
|------------|-------------|--------|---------------|---------|-------------------|
| SQL Server | `localhost` | `1433` | `avsa_db`     | `sa`    | `Avsa@Admin12345` |
| MongoDB    | `localhost` | `27017`| `db_avsa`     | (ninguno) | (sin password) |

### 4.1. SQL Server Management Studio (SSMS)

Abrir SSMS y configurar:

| Campo                    | Valor                     |
|--------------------------|---------------------------|
| Server type              | Database Engine           |
| Server name              | `localhost,1433` ⚠️ Usa coma, no dos puntos |
| Authentication           | SQL Server Authentication |
| Login                    | `sa`                      |
| Password                 | `Avsa@Admin12345`         |
| Trust server certificate | ✓ Activado (obligatorio)  |

**Después de conectar:**
- Seleccionar: `Databases > avsa_db`

**Consultas de prueba:**

```sql
-- Ver todas las tablas
USE avsa_db;
GO
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';
GO

-- Ver historial de Liquibase
SELECT ID, AUTHOR, FILENAME, DATEEXECUTED, ORDEREXECUTED
FROM DATABASECHANGELOG
ORDER BY ORDEREXECUTED;
GO
```

### 4.2. MongoDB Compass

**Cadena de conexión:**
```
mongodb://localhost:27017/?directConnection=true
```

**O configurar manualmente:**

| Campo          | Valor                    |
|----------------|--------------------------|
| Host           | `localhost`              |
| Port           | `27017`                  |
| Authentication | None (sin autenticación) |

**Después de conectar:**
- Seleccionar base: `db_avsa`

**Consultas de prueba (en Mongosh):**

```javascript
// Ver todas las colecciones
use db_avsa
show collections

// Ver historial de Liquibase
db.DATABASECHANGELOG.find().sort({ ORDEREXECUTED: 1 }).pretty()

// Verificar replica set
rs.status().set  // Debe mostrar: rs0
```

### 4.3. Conexión por línea de comandos

**SQL Server:**
```powershell
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -d avsa_db
```

**MongoDB:**
```powershell
docker compose exec mongodb mongosh db_avsa
```

---

<a name="comandos"></a>
## 🎯 5. COMANDOS ÚTILES

### Gestión básica

```powershell
# Ver estado de todos los servicios
docker compose ps

# Ver logs en tiempo real (todos)
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f sqlserver
docker compose logs -f mongodb
docker compose logs -f liquibase-sqlserver
docker compose logs -f liquibase-mongodb

# Salir de los logs: Ctrl + C (no detiene los contenedores)

# Reiniciar un servicio
docker compose restart sqlserver
docker compose restart mongodb

# Detener todo (conserva datos)
docker compose down

# Detener todo y borrar datos
docker compose down -v

# Levantar de nuevo
docker compose up -d
```

### Comandos de Liquibase

```powershell
# Ver estado de los changesets
docker compose run --rm liquibase-sqlserver status --verbose
docker compose run --rm liquibase-mongodb status --verbose

# Ver historial aplicado
docker compose run --rm liquibase-sqlserver history
docker compose run --rm liquibase-mongodb history

# Aplicar migraciones manualmente
docker compose run --rm liquibase-sqlserver update
docker compose run --rm liquibase-mongodb update

# Rollback (solo SQL Server, revertir 1 changeset)
docker compose run --rm liquibase-sqlserver rollback-count --count=1
```

### Comandos de verificación rápida

```powershell
# Contar changesets en SQL Server
docker compose exec sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -d avsa_db -Q "SELECT COUNT(*) AS total FROM DATABASECHANGELOG"

# Contar changesets en MongoDB
docker compose exec mongodb mongosh db_avsa --quiet --eval "db.DATABASECHANGELOG.countDocuments()"

# Verificar replica set
docker compose exec mongodb mongosh --quiet --eval "rs.status().set"
```

---

<a name="problemas"></a>
## 🆘 6. SOLUCIÓN DE PROBLEMAS

### Problema 1: "Cannot connect to the Docker daemon"

**Causa:** Docker Desktop no está corriendo.

**Solución:**
1. Abrir Docker Desktop
2. Esperar a que aparezca "Docker is running"
3. Ejecutar de nuevo el comando

### Problema 2: "port is already allocated"

**Causa:** Los puertos 1433 o 27017 están ocupados.

**Solución A - Cambiar puertos en .env:**
```dotenv
SQLSERVER_PORT=14330
MONGODB_PORT=27018
```

Luego:
```powershell
docker compose down
docker compose up -d
```

**Solución B - Ver qué usa los puertos:**
```powershell
netstat -ano | findstr :1433
netstat -ano | findstr :27017
```

### Problema 3: "service 'sqlserver' is unhealthy"

**Causa:** Poca memoria o SQL Server aún está iniciando.

**Soluciones:**

**1. Aumentar memoria en Docker Desktop:**
- Settings → Resources → Memory
- Cambiar a **4 GB mínimo** (6 GB recomendado)
- Apply & Restart

**2. Esperar más tiempo:**
```powershell
docker compose logs -f sqlserver
```
SQL Server puede tardar 30-60 segundos en el primer inicio.

**3. Verificar contraseña en .env:**
```dotenv
MSSQL_SA_PASSWORD=Avsa@Admin12345
```
Debe tener mayúsculas, minúsculas, números y símbolos.

### Problema 4: "No se encontró el archivo .env"

**Solución:**
```powershell
Copy-Item .env.example .env
```

Verificar que estás en el directorio correcto:
```powershell
pwd  # Debe mostrar: ...\ASE251S4_T08-db
```

### Problema 5: Liquibase no aplica changesets

**Causa:** Liquibase intenta conectar antes de que los motores estén listos.

**Solución paso a paso:**
```powershell
# 1. Detener todo
docker compose down

# 2. Levantar solo los motores
docker compose up -d sqlserver mongodb

# 3. Esperar 1 minuto
Start-Sleep -Seconds 60

# 4. Verificar que están healthy
docker compose ps

# 5. Inicializar bases
docker compose up sqlserver-init mongodb-init

# 6. Aplicar migraciones
docker compose up liquibase-sqlserver liquibase-mongodb
```

### Problema 6: SSMS no puede conectar

**Verificaciones:**

1. **¿SQL Server está corriendo?**
```powershell
docker compose ps sqlserver
# Debe decir: Up (healthy)
```

2. **¿Usaste el formato correcto?**
```
localhost,1433  ← Coma, NO dos puntos
```

3. **¿Marcaste "Trust server certificate"?**
En SSMS → Connection Properties → ✓ Trust server certificate

4. **¿Contraseña correcta?**
```
Usuario: sa
Password: Avsa@Admin12345
```

### Problema 7: MongoDB Compass no conecta

**Verificaciones:**

1. **¿MongoDB está corriendo?**
```powershell
docker compose ps mongodb
# Debe decir: Up (healthy)
```

2. **¿Cadena de conexión correcta?**
```
mongodb://localhost:27017/?directConnection=true
```

3. **¿Replica set inicializado?**
```powershell
docker compose logs mongodb-init
# Debe decir: "Replica set rs0 configured successfully"
```

### 🔧 Solución definitiva (reinicio completo)

Si nada funciona:

```powershell
# 1. Limpiar todo
docker compose down -v
docker system prune -a

# 2. Reconstruir sin cache
docker compose build --no-cache

# 3. Levantar todo
docker compose up -d

# 4. Esperar 2-3 minutos y verificar
docker compose ps
.\test-connection.ps1
```

---

<a name="faq"></a>
## ❓ 7. FAQ - PREGUNTAS FRECUENTES

### ¿Por qué usar Docker?

**Ventajas:**
- ✅ Funciona igual en cualquier laptop
- ✅ No necesitas instalar SQL Server ni MongoDB
- ✅ No afecta otras instalaciones en tu sistema
- ✅ Todos tienen el mismo entorno
- ✅ Fácil de limpiar: `docker compose down -v`

### ¿Cuánto espacio ocupa?

- **Primera vez:** ~3-4 GB (imágenes Docker)
- **Datos:** ~100-500 MB (bases de datos)
- **Total:** ~4-5 GB

### ¿Funciona en Mac/Linux?

Sí, cambia:
- `Copy-Item` → `cp`
- PowerShell → Terminal/Bash
- El `compose.yaml` es compatible

### ¿Qué es Liquibase?

Liquibase es versionamiento para bases de datos (como Git para tu esquema).

**Beneficios:**
- Historial de todos los cambios
- Rollback controlado
- Funciona con SQL Server y MongoDB
- Previene aplicar el mismo cambio dos veces

### ¿Por qué MongoDB necesita replica set?

MongoDB solo ofrece transacciones ACID (commit/rollback) en replica set.

### ¿Cómo ver las migraciones aplicadas?

**SQL Server:**
```sql
SELECT * FROM DATABASECHANGELOG ORDER BY ORDEREXECUTED;
```

**MongoDB:**
```javascript
db.DATABASECHANGELOG.find().sort({ ORDEREXECUTED: 1 }).pretty()
```

### ¿Puedo agregar nuevas migraciones?

**SQL Server:**
1. Crear `db/sqlserver/changes/V003__descripcion.sql`
2. Agregar changeset a `db/sqlserver/changelog.xml`
3. Ejecutar: `docker compose run --rm liquibase-sqlserver update`

**MongoDB:**
1. Crear `db/mongodb/changes/V004__descripcion.xml`
2. Agregar changeset a `db/mongodb/changelog.xml`
3. Ejecutar: `docker compose run --rm liquibase-mongodb update`

### ¿Las credenciales son seguras?

**NO.** Son solo para desarrollo local.

**NUNCA:**
- Subas `.env` a Git (está en `.gitignore`)
- Uses estas contraseñas en producción

### ¿Cómo compartir el proyecto?

**Con Git (RECOMENDADO):**
```powershell
git clone <URL>
cd ASE251S4_T08-db
Copy-Item .env.example .env
docker compose up -d --build
```

**Con USB:**
1. Copiar carpeta (NO copiar `.git` ni `.env`)
2. En otra laptop: crear `.env` y ejecutar `docker compose up -d --build`

---

## 📊 PARA LA DEMO/PRESENTACIÓN

### Antes de llegar:
1. Ejecutar `.\test-connection.ps1` en tu laptop
2. Tomar capturas de SSMS y MongoDB Compass
3. (Opcional) Grabar video de 2 minutos

### Durante la demo:
1. Mostrar `docker compose ps` (servicios corriendo)
2. Abrir SSMS → mostrar tablas y DATABASECHANGELOG
3. Abrir MongoDB Compass → mostrar colecciones
4. Mostrar el código de las migraciones

### Si algo falla:
```powershell
docker compose down
docker compose up -d
```

O mostrar capturas/video de respaldo.

---

## ✅ CHECKLIST ANTES DE LA DEMO

- [ ] Docker Desktop instalado
- [ ] Proyecto copiado/clonado
- [ ] `.env` creado desde `.env.example`
- [ ] `docker compose up -d` ejecutado
- [ ] `.\test-connection.ps1` pasó todas las pruebas
- [ ] SSMS conecta a `localhost,1433`
- [ ] MongoDB Compass conecta a `mongodb://localhost:27017`
- [ ] Capturas de pantalla de respaldo
- [ ] (Opcional) Video de respaldo

---

## ⏱️ TIEMPOS ESPERADOS

| Actividad              | Primera vez | Siguientes |
|------------------------|-------------|------------|
| Descargar imágenes     | 5-10 min    | -          |
| Build de Liquibase     | 2-3 min     | 30 seg     |
| Levantar servicios     | 2-3 min     | 1 min      |
| Aplicar migraciones    | 30 seg      | 10 seg     |
| **TOTAL**              | **10-15 min**| **2-3 min** |

---

## 🎉 ¡LISTO!

Con esta guía, el proyecto funcionará en **cualquier laptop con Docker instalado**.

**Comandos de emergencia:**
```powershell
# Reiniciar todo
docker compose down -v && docker compose up -d --build

# Ver qué pasa
docker compose logs -f

# Verificar estado
docker compose ps
.\test-connection.ps1
```

---

**¿Dudas?** Revisa las secciones de [Solución de problemas](#problemas) y [FAQ](#faq).

**¡Éxito en tu presentación!** 🚀
