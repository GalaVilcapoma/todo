# Manual Rápido Clic por Clic — AVSA en AWS (Desde Cero)

> **Despliegue:** Orquestador **Kubernetes (K3s)** sobre EC2  
> **Proyecto:** AVSA – Sistema Agroindustrial (Equipo T08)  
> **Imágenes Docker:** `anthonygala/avsa-frontend:latest` · `anthonygala/avsa-backend:latest` · `anthonygala/avsa-analytics:latest`  
> Consola de AWS en **inglés**. Orden: **Grupos de seguridad → RDS → EC2 → IP Elástica → BDs → Demo en Vivo**.  
> Tener abierto [`user-data-universal.sh`](user-data-universal.sh) para copiar (Ctrl+A, Ctrl+C).

---

## 📋 0. Hoja de Datos

### 0.1. Datos que cambian en cada cuenta (anótalos)
| # | Variable | ¿En qué paso se genera? | Tu Valor Real |
|---|---|---|---|
| **1** | **ID de Security Group (`sg-...`)** | Paso 2 (`evi-ec2-sg`) | `sg-_____________________` |
| **2** | **Endpoint de Amazon RDS** | Paso 4 | `________________________` |
| **3** | **IP Pública de `ec2-mongodb`** | Paso 6 | `________________________` |
| **4** | **IP Elástica de `k8s-master`** | Paso 5.2 | `________________________` |

### 0.2. Valores fijos (NO modificar)
| Parámetro | Valor Fijo | Nota |
|---|---|---|
| **SQL Server Usuario / Clave** | `admin` / `Avsa1234` | RDS no permite `sa` |
| **SQL Server Puerto y BD** | `1433` \| `avsa_db` | La crea sola el script |
| **MongoDB Usuario / Clave** | `admin` / `Mongo12345` | Con `?authSource=admin` |
| **MongoDB Puerto y BD** | `27017` \| `db_avsa` | Colecciones `customers`, `products`, `agrochemicals` |
| **Namespace Kubernetes** | `avsa-namespace` | |
| **NodePort Frontend** | `30080` | React + Nginx |
| **NodePort Backend** | `30081` | Spring Boot WebFlux (`/swagger-ui.html`) |
| **NodePort Analítico** | `30000` | Python FastAPI (`/docs`) |

---

## 1. Learner Lab ⏱ min 0

- [ ] **Start Lab** → esperar círculo verde → clic **AWS**
- [ ] Arriba a la derecha, región: **United States (N. Virginia) `us-east-1`**

---

## 2. Grupo de seguridad `evi-ec2-sg` ⏱ min 1

**EC2 → Security Groups → Create security group**

- [ ] Security group name: `evi-ec2-sg` · Description: `evi-ec2-sg` · VPC: default

**Inbound rules:**
- [ ] **Add rule** → **Custom TCP** → Port range: `30000-30081` (un solo campo) → **Anywhere-IPv4**
- [ ] **Add rule** → **SSH** → `22` → **Anywhere-IPv4**
- [ ] **Add rule** → **Custom TCP** → `27017` → **Anywhere-IPv4** (para MongoDB Compass)
- [ ] **Create security group**
- [ ] 👉 **COPIAR EL ID** `sg-...` que sale arriba.

**Regla interna:**
- [ ] Seleccionar `evi-ec2-sg` → **Inbound rules** → **Edit inbound rules** → **Add rule**
- [ ] Type: **All traffic** · Source type: **Custom** · Source: pegar el `sg-...` → **elegirlo de la lista desplegable**
- [ ] **Save rules**

Debe quedar:

| Type | Port range | Source |
| :-- | :-- | :-- |
| SSH | 22 | 0.0.0.0/0 |
| Custom TCP | 30000 - 30081 | 0.0.0.0/0 |
| Custom TCP | 27017 | 0.0.0.0/0 |
| All traffic | All | sg-... (`evi-ec2-sg`) |

---

## 3. Grupo de seguridad `evi-rds-sg` ⏱ min 3

**EC2 → Security Groups → Create security group**

- [ ] Name: `evi-rds-sg` · Description: `evi-rds-sg` · VPC: default
- [ ] **Add rule** → **MSSQL** (1433) → **Custom** → el `sg-...` de `evi-ec2-sg` (de la lista)
- [ ] **Add rule** → **MSSQL** (1433) → **Anywhere-IPv4** (para SSMS desde tu PC)
- [ ] **Create security group**

---

## 4. RDS SQL Server ⏱ min 4 (tarda 10–15 min, no esperar)

**RDS → Databases → Create database**

- [ ] **Standard create** · **Microsoft SQL Server** · **Amazon RDS** · **SQL Server Express Edition**
- [ ] Templates: **Free tier** (si no sale, **Dev/Test**)

**Settings:**
- [ ] DB instance identifier: `avsa-rds-sqlserver`
- [ ] Master username: `admin`
- [ ] Credentials management: **Self managed** ⚠️ (NO Secrets Manager)
- [ ] Master password / Confirm: `Avsa1234`

**Instance configuration:** **Burstable classes** → `db.t3.micro` (si no sale, `db.t3.small`)

**Storage:** **gp3** · `20` GiB · **Additional storage configuration** → ☐ desmarcar **storage autoscaling**

**Connectivity:**
- [ ] **Don't connect to an EC2 compute resource** · VPC: default
- [ ] Public access: **Yes**
- [ ] VPC security group: **Choose existing** → `evi-rds-sg` → quitar `default` (X)

**Monitoring:** ☐ desmarcar **Performance/Database Insights** y ☐ **Enhanced Monitoring**

**Additional configuration:** ☐ desmarcar **Enable automated backups**

- [ ] **Create database** (si sale ventana de add-ons → **Close**) → seguir al paso 5 sin esperar.

---

## 5. EC2 `k8s-master` e IP Elástica ⏱ min 7

### 5.1. Lanzar `k8s-master`
**EC2 → Instances → Launch instances**

- [ ] Name: `k8s-master`
- [ ] **Ubuntu Server 24.04 LTS (HVM), SSD** · **64-bit (x86)**
- [ ] Instance type: `t3.small`
- [ ] Key pair: `vockey`
- [ ] Network settings → **Edit** → Auto-assign public IP: **Enable** → **Select existing security group** → `evi-ec2-sg`
- [ ] Storage: `20` GiB · gp3
- [ ] **Advanced details** → IAM instance profile: **`LabInstanceProfile`** ⚠️
- [ ] **User data**: pegar **todo** [`user-data-universal.sh`](user-data-universal.sh)
- [ ] **Launch instance** → **View all instances**

### 5.2. IP Elástica (hazlo YA, antes de 10 min)
> 💡 El script la detecta sola y se la pasa al frontend como URL del backend (`http://<IP_ELASTICA>:30081`). Si la asocias tarde, ver Solucionario.

1. **Elastic IPs** → **Allocate Elastic IP address** → **Allocate**
2. Seleccionarla → **Actions → Associate Elastic IP address** → Instance: **`k8s-master`** → **Associate**
3. 👉 Anota la IP.

---

## 6. Las otras 4 EC2 ⏱ min 9–12

Marcar ☑ `k8s-master` → **Actions → Image and templates → Launch more like this**, cambiar **Name**, tipo y disco, confirmar **`LabInstanceProfile`** y **User data** → **Launch instance**. Repetir 4 veces:

| ✔ | Name (exacto) | Instance type | Storage | Qué contiene |
| :-: | :-- | :-- | :-- | :-- |
| ☐ | `ec2-mongodb` | `t3.small` | 8 GiB | MongoDB 8.0 nativo (`db_avsa`) |
| ☐ | `k8s-node-frontend` | `t3.small` | 20 GiB | Frontend React |
| ☐ | `k8s-node-backend` | **`t3.medium`** | 20 GiB | Backend Spring Boot WebFlux |
| ☐ | `k8s-node-analytics` | `t3.small` | 20 GiB | Backend Analítico FastAPI |

---

## 7. Revisar ⏱ min 13

- [ ] **EC2 → Instances**: 5 instancias **Running** con sus nombres exactos.
- [ ] Si a alguna le falta el rol: **Actions → Security → Modify IAM role** → `LabInstanceProfile` → **Update IAM role**.

---

## 8. Esperar el Avance Automático ⏱ min 13 → 22

- [ ] Marcar ☑ `k8s-master` → **Actions → Monitor and troubleshoot → Get system log** → buscar `[AVSA]` (reabrir cada 1–2 min)
  1. `K3s server instalado`
  2. `Esperando que RDS SQL Server termine de crearse...` (≈10 min, normal)
  3. `MongoDB: ... | RDS: ...`
  4. `SQL SERVER POBLADO`
  5. `Frontend usará API_URL=http://<IP_ELASTICA>:30081` ← debe ser tu IP elástica
  6. `Manifiestos aplicados...`
  7. `DESPLIEGUE TERMINADO` + URLs → `DESPLIEGUE COMPLETO` ✅

---

## 9. Abrir la Aplicación ⏱ min 22

*(Usar `http://`, no `https://`. Los NodePort funcionan en la IP de cualquier nodo.)*

| ✔ | Componente | URL |
| :-: | :-- | :-- |
| ☐ | **Frontend Web** | `http://<IP k8s-node-frontend>:30080` |
| ☐ | **Backend — Swagger UI** | `http://<IP_ELASTICA>:30081/swagger-ui.html` |
| ☐ | **Backend — OpenAPI JSON** | `http://<IP_ELASTICA>:30081/v3/api-docs` (importar en Postman) |
| ☐ | **Backend — Health** | `http://<IP_ELASTICA>:30081/actuator/health` |
| ☐ | **Analítico — Swagger** | `http://<IP k8s-node-analytics>:30000/docs` |

---

## 10. Conectarse a las Bases de Datos desde tu PC ⏱ min 23

### 10.1. SSMS / Azure Data Studio
- **Server name:** `<ENDPOINT_RDS>,1433` *(con coma)* · **SQL Server Authentication**
- **Login:** `admin` · **Password:** `Avsa1234` · ☑️ **Trust server certificate**
- Ver `avsa_db` → Tables: `customer_orders_s4`, `customer_order_details_s4`, `agrochemical_applications`, `agrochemical_application_details`, `product_stock_movements`
- *(Ya está poblada. Para recargar: ejecutar [`ASE251S4_T08-be/01-crear-estructura-completa.sql`](../ASE251S4_T08-be/01-crear-estructura-completa.sql))*

### 10.2. MongoDB Compass
```text
mongodb://admin:Mongo12345@<IP_PUBLICA_EC2_MONGO>:27017/db_avsa?authSource=admin
```
Verás `db_avsa` con `customers`, `products`, `agrochemicals`.

*(Opcional) Recargar desde la terminal de `ec2-mongodb`:*
```bash
curl -sSL https://raw.githubusercontent.com/GalaVilcapoma/todo/main/ASE251S4_T08-be/seed-mongodb-s4.js -o seed.js && mongosh "mongodb://admin:Mongo12345@localhost:27017/db_avsa?authSource=admin" seed.js
```

---

## 11. Guion de Demostración en Vivo ⏱ min 24

`k8s-master` → **Connect** → **EC2 Instance Connect** → **Connect**

```bash
# 1. URLs y estado general
cat ~/URLS.txt
```

```bash
# 2. Clúster y roles dedicados (frontend / backend / analytics)
kubectl get nodes -L role
```

```bash
# 3. Cada pod en su propio nodo
kubectl get pods -n avsa-namespace -o wide
```

```bash
# 4. Backend conectado a MongoDB y SQL Server (RDS)
curl -s localhost:30081/actuator/health; echo
```
*(Debe mostrar `"status":"UP"` con `mongo` y `r2dbc` en UP).*

```bash
# 5. Analítico leyendo MongoDB (pipeline de agregación)
curl -s localhost:30000/api/v1/analytics/productos/resumen-categoria | head -c 600; echo
```

```bash
# 6. Self-Healing: Kubernetes recrea el pod solo
kubectl delete pod -l app=avsa-frontend -n avsa-namespace
kubectl get pods -n avsa-namespace -w
```
*(Ctrl + C para salir).*

```bash
# 7. Escalabilidad horizontal
kubectl scale deployment avsa-backend --replicas=3 -n avsa-namespace
kubectl get pods -n avsa-namespace
```

---

## 📋 12. Payloads JSON para Swagger (`http://<IP_ELASTICA>:30081/swagger-ui.html`)

### 12.1. Producto (MongoDB `products`) — `POST /api/productos`
```json
{
  "code": "PROD-901",
  "name": "Palta Hass Exportación",
  "description": "Palta Hass calibre 18 para exportación",
  "category": "Frutas",
  "unitMeasure": "Kg",
  "unitPrice": 9.50,
  "currentStock": 500,
  "minimumStock": 50,
  "origin": "Cañete - Imperial"
}
```
Consultar: `GET /api/productos`

### 12.2. Pedido de cliente (SQL Server `customer_orders_s4`) — `POST /v1/api/customer-orders`
> Primero `GET /v1/api/customer` y `GET /api/productos` para copiar IDs reales de MongoDB.
```json
{
  "customerId": "<ID_CLIENTE_MONGO>",
  "estimatedDeliveryDate": "2026-11-15",
  "remarks": "Pedido de demostración",
  "details": [
    { "productId": "<ID_PRODUCTO_MONGO>", "quantity": 5, "remark": "primera línea" }
  ]
}
```

### 12.3. Aplicación de agroquímico (SQL Server) — `POST /v1/api/agrochemical-applications`
> Primero `GET /v1/api/agrochemicals` para copiar un ID real.
```json
{
  "fieldName": "Campo Norte - Lote A",
  "areaHectares": 15.5,
  "applicationDate": "2026-10-27",
  "responsible": "Juan Pérez García",
  "temperatureCelsius": 25.5,
  "humidityPercentage": 65.0,
  "windConditions": "Viento leve de 5-10 km/h",
  "remarks": "Aplicación preventiva contra plagas",
  "details": [
    { "agrochemicalId": "<ID_AGROQUIMICO_MONGO>", "appliedDose": 2.5, "unitMeasure": "Litros/Ha", "treatedAreaHectares": 15.5 }
  ]
}
```

---

## 13. Al Terminar (Cierre de Seguridad)

- [ ] `evi-ec2-sg` → **Edit inbound rules** → **Delete** SSH 22 y 27017 → **Save rules**
- [ ] `evi-rds-sg` → **Delete** la regla MSSQL **0.0.0.0/0** → **Save rules**
- [ ] **RDS → Modify** → Public access: **Not publicly accessible** → **Apply immediately**

---

## 🔍 Comando Único: Revisar que Todo Esté Conectado

En `k8s-master` (EC2 Instance Connect), pegar en una sola línea:

```bash
R=$(aws rds describe-db-instances --query "DBInstances[?DBInstanceIdentifier=='avsa-rds-sqlserver']|[0].Endpoint.Address" --output text); echo "== RDS: $R"; nc -zv -w5 "$R" 1433 && sudo /opt/mssql-tools18/bin/sqlcmd -C -S "$R,1433" -U admin -P 'Avsa1234' -d avsa_db -Q "SET NOCOUNT ON; SELECT COUNT(*) AS tablas FROM sys.tables; SELECT DISTINCT client_net_address AS ips_conectadas FROM sys.dm_exec_connections"; echo "== PODS"; kubectl get pods -n avsa-namespace -o wide; echo "== HEALTH"; curl -s localhost:30081/actuator/health; echo; echo "== AVANCE"; sudo grep AVSA /var/log/avsa.log | tail -3
```

| Salida | Significado |
| :-- | :-- |
| `== RDS: None` | RDS aún se crea: esperar 2 min |
| `succeeded!` | El master llega a RDS por 1433 ✅ |
| `tablas` > 0 | Login correcto y `avsa_db` cargada ✅ |
| `ips_conectadas` con `172.31.x.x` | Backends conectados a RDS ✅ |
| Pods `1/1 Running` | Todo levantado ✅ |
| `"status":"UP"` | Backend conectado a Mongo + SQL ✅ |
| Última línea `DESPLIEGUE COMPLETO` | Terminado al 100% ✅ |

---

## 🛠️ Solucionario

| Síntoma | Solución |
| :-- | :-- |
| `SIN PERMISOS AWS` | **Actions → Security → Modify IAM role** → `LabInstanceProfile`. |
| `no corresponde a ningún rol` | Typo en el nombre: **Terminate** y relanzar con `k8s-master`, `ec2-mongodb`, `k8s-node-frontend`, `k8s-node-backend`, `k8s-node-analytics`. |
| `Esperando ...:1433` | RDS sin `evi-rds-sg`: **Modify** → Security group `evi-rds-sg` → **Apply immediately**. |
| `Esperando ...:27017` o `:6443` | Falta la regla **All traffic** con origen `sg-...` de `evi-ec2-sg`. |
| `Login failed for user 'admin'` | RDS con Secrets Manager: **Modify** → Self managed → clave `Avsa1234` → **Apply immediately**. |
| Frontend abre pero **no carga datos** | El `API_URL` no es la IP elástica (la asociaste tarde o reiniciaste el lab). En el master: `kubectl -n avsa-namespace set env deploy/avsa-frontend API_URL=http://<IP_ELASTICA>:30081` y recargar con **Ctrl+F5**. |
| `ERR_CONNECTION_TIMED_OUT` | Usar puertos **30080 / 30081 / 30000**, IP pública **actual**, y `evi-ec2-sg` con **30000-30081** abierto. |
| Pod backend `CrashLoopBackOff` | `kubectl -n avsa-namespace logs deploy/avsa-backend --tail=50` (casi siempre clave de RDS o RDS aún no lista). |
| SSMS: *timeout* | RDS no está **Available**, Public access ≠ **Yes**, o falta MSSQL **Anywhere-IPv4**. |
| SSMS: *certificate chain* | ☑️ **Trust server certificate**. |
| Compass: *timed out* / *Auth failed* | Falta 27017 Anywhere-IPv4 · la URI debe terminar en `?authSource=admin`. |
