# Guía Paso a Paso: Puesta en Marcha del Sistema AVSA

Este documento detalla todas las acciones y configuraciones realizadas para que el ecosistema completo (SQL Server, MongoDB, Backend Spring Boot y Frontend Móvil/Web Expo) funcione correctamente.

---

## 1. Arquitectura del Sistema

```mermaid
graph TD
    subgraph Frontend["Frontend Móvil / Web (Expo)"]
        UI["Pantallas (app/(tabs)/products.tsx)"]
        Services["Servicios (services/product.service.ts)"]
        Axios["Cliente HTTP (services/api.service.ts)"]
        UI --> Services --> Axios
    end

    subgraph Backend["Backend Spring Boot S4 (WebFlux) - Puerto 8081"]
        Controller["Rest Controllers (/api/productos, /v1/api/*)"]
        R2DBC["R2DBC Driver (Reactivo)"]
        MongoDriver["Spring Data MongoDB"]
        Controller --> R2DBC
        Controller --> MongoDriver
    end

    subgraph Databases["Bases de Datos"]
        SQLServer[("SQL Server Docker :1433 (avsa_db)")]
        MongoDB[("MongoDB Atlas (db_avsa / Compass)")]
        R2DBC --> SQLServer
        MongoDriver --> MongoDB
    end

    Axios -->|"HTTP (http://192.168.1.46:8081 o localhost:8081)"| Controller
```

---

## 2. Paso a Paso de lo Realizado

### Paso 1: Configuración y Levantamiento de SQL Server (Docker)
1. **Contenedor Docker:**
   Se inició el contenedor de SQL Server 2022 en el puerto estándar `1433`:
   ```bash
   docker run -e "ACCEPT_EULA=Y" \
     -e "MSSQL_SA_PASSWORD=Admin12345!!" \
     -e "MSSQL_PID=Express" \
     -p 1433:1433 \
     --name sql-server \
     -d mcr.microsoft.com/mssql/server:2022-latest
   ```

2. **Copia y ejecución del Script SQL completo:**
   - Se guardó el script completo en `D:\tareadori\ASE251S4_T08-be\sqlserver-s4-tablas-correctas.sql`.
   - Se copió al contenedor:
     ```bash
     docker cp "D:\tareadori\ASE251S4_T08-be\sqlserver-s4-tablas-correctas.sql" sql-server:/tmp/seed.sql
     ```
   - Se ejecutó el script con `sqlcmd`:
     ```bash
     docker exec sql-server /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Admin12345!!" -C -i /tmp/seed.sql
     ```
   - **Resultado:** Se crearon las tablas transaccionales (`customer_orders_s4`, `customer_order_details_s4`, `product_stock_movements`, `agrochemical_applications`, `app_users`, etc.) con sus datos semilla.

---

### Paso 2: Configuración del Backend Spring Boot (`ASE251S4_T08-be`)
1. **Variables de entorno (`.env`):**
   Se configuró el archivo `.env` del backend con las conexiones reactivas hacia SQL Server y MongoDB Atlas:
   ```properties
   MONGODB_URI=mongodb+srv://pierreconca_db_user:concaflores31@cluster0.kt6pnki.mongodb.net/db_avsa?retryWrites=true&w=majority&appName=Cluster0
   R2DBC_URL=r2dbc:mssql://localhost:1433/avsa_db?trustServerCertificate=true
   R2DBC_USERNAME=sa
   R2DBC_PASSWORD=Admin12345!!
   ```

2. **Ejecución del Backend en el puerto 8081:**
   Se levantó el servicio Spring Boot utilizando el JAR compilado:
   ```powershell
   cd D:\tareadori\ASE251S4_T08-be
   java -jar target\app-0.0.1-SNAPSHOT.jar
   ```

3. **Verificación de Endpoints y Salud:**
   - Salud general: `curl http://localhost:8081/actuator/health` -> `{"status":"UP", "mongo":{"status":"UP"}, "r2dbc":{"status":"UP"}}`
   - Productos en MongoDB: `http://localhost:8081/api/productos`
   - Swagger interactivo: `http://localhost:8081/swagger-ui.html`

---

### Paso 3: Configuración y Ejecución de la App Móvil / Web (`ASE251S4_T08_mo`)
1. **Configuración de IP en `.env`:**
   En `D:\tareadori\ASE251S4_T08_mo\.env`:
   ```properties
   EXPO_PUBLIC_API_URL=http://192.168.1.46:8081
   ```
   *(También compatible con `http://localhost:8081` para navegación Web)*.

2. **Resolución del conflicto de puertos:**
   - Como el backend ocupa el puerto `8081`, Expo se lanzó en el puerto alternativo `8083`:
     ```powershell
     cd D:\tareadori\ASE251S4_T08_mo
     npx expo start --port 8083
     ```
   - Esto permitió abrir la app tanto en navegador web (`http://localhost:8083`) como en dispositivos físicos escaneando el código QR.

---

## 3. Verificación de Criterios de Evaluación

| Criterio de la Rúbrica | Implementación en el Proyecto | Archivos Clave |
| :--- | :--- | :--- |
| **1. Conexión con la BD a través de un servicio (`service`) que consume una API (1 pt)** | La aplicación nunca accede directo a la base de datos; utiliza clientes Axios tipados que consumen las APIs REST del backend WebFlux. | `services/api.service.ts`<br>`services/product.service.ts`<br>`services/agrochemical.service.ts` |
| **2. Tabla maestra: Modificación y Eliminación de un registro (0.5 pt)** | Cada tarjeta en la lista incluye botón **Editar** (abre modal y envía `PUT`) y botón **Desactivar** (abre confirmación `ConfirmDialog` y ejecuta soft-delete vía `PATCH /eliminar`). | `app/(tabs)/products.tsx`<br>`components/common/confirm-dialog.tsx` |
| **3. Lista de más de 10 registros y registro mediante formulario (1 pt)** | La lista carga directamente los 23 productos activos existentes en MongoDB. El botón **`+ Nuevo`** abre el formulario modal con validaciones de campos para guardar registros con `POST`. | `app/(tabs)/products.tsx`<br>`services/product.service.ts` |

---

## 4. Comandos de Referencia Rápida para el Futuro

### Iniciar Base de Datos SQL Server:
```bash
docker start sql-server
```

### Iniciar Backend Spring Boot:
```powershell
cd D:\tareadori\ASE251S4_T08-be
java -jar target\app-0.0.1-SNAPSHOT.jar
```

### Iniciar Frontend Móvil / Web:
```powershell
cd D:\tareadori\ASE251S4_T08_mo
npx expo start --port 8083
```
