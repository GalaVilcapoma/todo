# 🚀 GUÍA PRE-LABORATORIO: QUÉ HACER ANTES DEL DÍA DEL DESPLIEGUE

**Objetivo:** Llegar al laboratorio con el 90% del trabajo hecho, solo faltando conectar las IPs/endpoints reales de AWS.

---

## ✅ PARTE 1: LO QUE SÍ PUEDES (Y DEBES) HACER AHORA

### 🐳 1. SUBIR TUS IMÁGENES DOCKER A DOCKER HUB (CRÍTICO)

**SÍ, DEBES SUBIR LAS IMÁGENES AHORA.** Sin esto, Kubernetes no podrá descargarlas.

#### Paso 1.1: Verificar que tienes Docker Hub account
```bash
# Hacer login en Docker Hub (si no lo has hecho)
docker login
# Ingresar: usuario y password de Docker Hub
```

#### Paso 1.2: Construir y subir Backend Spring Boot
```bash
cd "c:\Users\qcale\Music\Fourth-semester project\ASE251S4_T08-be"

# Construir la imagen
docker build -t alexandraquispe/avsa-backend:1.0 .

# Verificar que se creó
docker images | grep avsa-backend

# Subir a Docker Hub
docker push alexandraquispe/avsa-backend:1.0

# Verificar que se subió correctamente
# Ir a: https://hub.docker.com/r/alexandraquispe/avsa-backend/tags
```

#### Paso 1.3: Construir y subir Backend Python Analítico
```bash
cd "c:\Users\qcale\Music\Fourth-semester project\ASE251S4_T08_ba"

# Construir la imagen
docker build -t alexandraquispe/avsa-analytics:1.0 .

# Subir a Docker Hub
docker push alexandraquispe/avsa-analytics:1.0

# Verificar en: https://hub.docker.com/r/alexandraquispe/avsa-analytics/tags
```

#### Paso 1.4: Frontend (si tienes el código)
```bash
# Si tienes el repo del frontend:
cd "c:\Users\qcale\Music\Fourth-semester project\ASE251S4_T08-fe"

# Construir
docker build -t alexandraquispe/avsa-frontend:1.0 .

# Subir
docker push alexandraquispe/avsa-frontend:1.0
```

**✅ BENEFICIO:** El día del laboratorio, Kubernetes descargará las imágenes automáticamente desde Docker Hub.

---

### 📝 2. CREAR VERSIONES "TEMPLATE" DE TUS SECRETS

Crea archivos separados que SÍ contengan los valores reales, pero NO los versiones en Git.

#### Paso 2.1: Crear carpeta para templates locales
```bash
cd "c:\Users\qcale\Music\Fourth-semester project\ASE251S4_T08-be\k8s"
mkdir templates-local
```

#### Paso 2.2: Crear `templates-local/01-secret-REAL.yml`

**Este archivo NO se versiona en Git** (agrégalo al .gitignore)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: avsa-backend-secret
  namespace: alexandraquispe-19
  labels:
    app: avsa-backend-19
type: Opaque
stringData:
  # 🔴 REEMPLAZAR ESTAS IPS EL DÍA DEL LABORATORIO
  # Dejar así por ahora, las cambiarás cuando tengas las IPs reales de AWS
  MONGODB_URI: "mongodb://admin:TuPasswordMongo123@IP_PRIVADA_MONGODB_AQUI:27017/db_avsa"
  R2DBC_PASSWORD: "TuPasswordSQLServer123"
```

#### Paso 2.3: Crear `templates-local/02-configmap-REAL.yml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: avsa-backend-configmap
  namespace: alexandraquispe-19
  labels:
    app: avsa-backend-19
data:
  SERVER_PORT: "8081"
  SPRING_APPLICATION_NAME: "spring-webflux-nosql"
  # 🔴 REEMPLAZAR ESTE ENDPOINT EL DÍA DEL LABORATORIO
  R2DBC_URL: "r2dbc:mssql://ENDPOINT_RDS_AQUI.us-east-1.rds.amazonaws.com:1433/avsa_db?trustServerCertificate=true"
  R2DBC_USERNAME: "admin"
```

#### Paso 2.4: Crear `templates-local/07-analitico-secret-REAL.yml`
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: avsa-analitico-secret
  namespace: alexandraquispe-19
  labels:
    app: avsa-analitico-19
type: Opaque
stringData:
  # 🔴 REEMPLAZAR ESTA IP EL DÍA DEL LABORATORIO (misma IP que arriba)
  MONGODB_URI: "mongodb://admin:TuPasswordMongo123@IP_PRIVADA_MONGODB_AQUI:27017/db_agrochemicals"
  SQLSERVER_PASSWORD: "TuPasswordSQLServer123"
```

#### Paso 2.5: Crear `templates-local/08-analitico-configmap-REAL.yml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: avsa-analitico-configmap
  namespace: alexandraquispe-19
  labels:
    app: avsa-analitico-19
data:
  PORT: "8000"
  API_PREFIX: "/api/v1"
  DATABASE_NAME: "db_agrochemicals"
  APP_NAME: "Backend Analitico AVSA"
  APP_VERSION: "1.0.0"
  SQLSERVER_ENABLED: "true"
  # 🔴 REEMPLAZAR ESTE ENDPOINT EL DÍA DEL LABORATORIO (mismo que arriba)
  SQLSERVER_HOST: "ENDPOINT_RDS_AQUI.us-east-1.rds.amazonaws.com"
  SQLSERVER_PORT: "1433"
  SQLSERVER_DATABASE: "avsa_db"
  SQLSERVER_USER: "admin"
  SQLSERVER_DRIVER: "ODBC Driver 18 for SQL Server"
  SQLSERVER_TIMEOUT: "5"
  SQLSERVER_ORDERS_TABLE: "customer_orders_s4"
  SQLSERVER_MOVEMENTS_TABLE: "product_stock_movements"
```

#### Paso 2.6: Actualizar `.gitignore`
```bash
# Agregar al .gitignore del proyecto:
echo "k8s/templates-local/*-REAL.yml" >> .gitignore
```

**✅ BENEFICIO:** Llevas los templates con las credenciales YA configuradas, solo cambias 2 valores el día del laboratorio.

---

### 🔧 3. CREAR SCRIPT DE DESPLIEGUE RÁPIDO

#### Crear `k8s/deploy-RAPIDO.sh`

```bash
#!/bin/bash
set -e

echo "======================================"
echo "🚀 DESPLIEGUE RÁPIDO - AVSA"
echo "======================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que kubectl funciona
if ! kubectl get nodes &> /dev/null; then
    echo -e "${RED}❌ Error: kubectl no está conectado al cluster${NC}"
    echo "Ejecuta: aws eks update-kubeconfig --name TU_CLUSTER --region us-east-1"
    exit 1
fi

echo -e "${GREEN}✅ kubectl conectado correctamente${NC}"
echo ""

# Verificar que existen los archivos REAL
if [ ! -f "templates-local/01-secret-REAL.yml" ]; then
    echo -e "${RED}❌ Error: No se encuentra templates-local/01-secret-REAL.yml${NC}"
    echo "Asegúrate de haber completado el Paso 2 de la guía pre-laboratorio"
    exit 1
fi

echo -e "${YELLOW}📋 ¿Ya reemplazaste las IPs/endpoints en templates-local/*-REAL.yml? (s/n)${NC}"
read -r respuesta
if [ "$respuesta" != "s" ]; then
    echo -e "${RED}⚠️  Primero reemplaza:${NC}"
    echo "  - IP_PRIVADA_MONGODB_AQUI"
    echo "  - ENDPOINT_RDS_AQUI"
    echo "Luego vuelve a ejecutar este script."
    exit 1
fi

echo ""
echo "======================================"
echo "📦 APLICANDO MANIFIESTOS..."
echo "======================================"

# Namespace
echo -e "${YELLOW}→ Creando namespace...${NC}"
kubectl apply -f 00-namespace.yml

# Secrets y ConfigMaps (versiones REALES)
echo -e "${YELLOW}→ Aplicando Secrets y ConfigMaps...${NC}"
kubectl apply -f templates-local/01-secret-REAL.yml
kubectl apply -f templates-local/02-configmap-REAL.yml
kubectl apply -f templates-local/07-analitico-secret-REAL.yml
kubectl apply -f templates-local/08-analitico-configmap-REAL.yml

# Deployments
echo -e "${YELLOW}→ Desplegando aplicaciones...${NC}"
kubectl apply -f 03-backend-deployment.yml
kubectl apply -f 05-frontend-deployment.yml
kubectl apply -f 09-analitico-deployment.yml

# Services
echo -e "${YELLOW}→ Creando servicios...${NC}"
kubectl apply -f 04-backend-service.yml
kubectl apply -f 06-frontend-service.yml
kubectl apply -f 10-analitico-service.yml

echo ""
echo -e "${GREEN}✅ Despliegue completado${NC}"
echo ""
echo "======================================"
echo "📊 ESTADO DEL DESPLIEGUE"
echo "======================================"

# Esperar 10 segundos para que los pods se creen
echo "Esperando 10 segundos para que los pods se inicialicen..."
sleep 10

# Mostrar pods
echo ""
echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n alexandraquispe-19 -o wide

# Mostrar servicios
echo ""
echo -e "${YELLOW}Servicios:${NC}"
kubectl get svc -n alexandraquispe-19

# Obtener IP pública del nodo
echo ""
echo "======================================"
echo "🌐 ENDPOINTS PÚBLICOS"
echo "======================================"
NODO_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}')
if [ -z "$NODO_IP" ]; then
    echo -e "${YELLOW}⚠️  No se pudo obtener IP pública automáticamente${NC}"
    echo "Obtén la IP con: kubectl get nodes -o wide"
else
    echo -e "${GREEN}Frontend:${NC} http://$NODO_IP:30080"
    echo -e "${GREEN}Backend Spring Boot:${NC} http://$NODO_IP:30019/swagger-ui.html"
    echo -e "${GREEN}Backend Analítico:${NC} http://$NODO_IP:30008/docs"
fi

echo ""
echo -e "${GREEN}✅ Despliegue finalizado correctamente${NC}"
```

#### Dar permisos de ejecución:
```bash
cd k8s
chmod +x deploy-RAPIDO.sh
```

---

### 📦 4. PREPARAR BACKUPS DE LAS BASES DE DATOS

Si tienes datos de prueba en MongoDB local:

```bash
# Exportar MongoDB local
mongodump --uri="mongodb://localhost:27017/db_avsa" --out=./backup/db_avsa
mongodump --uri="mongodb://localhost:27017/db_agrochemicals" --out=./backup/db_agrochemicals

# Comprimir para llevar al laboratorio
tar -czf mongodb-backups.tar.gz backup/
```

Para SQL Server:
```bash
# Generar scripts .sql con tus datos (si tienes SQL Server local)
# Ya tienes: 01-crear-estructura-completa.sql
# Verifica que también tengas datos de ejemplo
```

**✅ BENEFICIO:** Llegas al laboratorio con datos de prueba listos para cargar.

---

### 📋 5. CREAR CHECKLIST DEL DÍA DEL LABORATORIO

#### Crear `k8s/CHECKLIST-LABORATORIO.md`

```markdown
# ✅ CHECKLIST DÍA DEL LABORATORIO

## ANTES DE LLEGAR (hecho en casa)
- [x] Imágenes Docker subidas a Docker Hub
- [x] Templates con credenciales en `templates-local/`
- [x] Script `deploy-RAPIDO.sh` listo
- [x] Backups de MongoDB comprimidos
- [x] Scripts SQL preparados

## AL LLEGAR AL LABORATORIO

### 1. Obtener IPs/Endpoints de AWS (15 min)
- [ ] **MongoDB EC2 - IP privada:**
  ```bash
  # Conectarse a la instancia MongoDB:
  ssh -i clave.pem ubuntu@<IP_PUBLICA_MONGO>
  
  # Dentro de la instancia, obtener IP privada:
  hostname -I
  # Copiar la primera IP (10.x.x.x)
  ```
  **Anotar aquí:** `___________________`

- [ ] **SQL Server RDS - Endpoint:**
  ```bash
  # Desde AWS Console → RDS → Databases → Copiar endpoint
  # O desde AWS CLI:
  aws rds describe-db-instances --query 'DBInstances[0].Endpoint.Address' --output text
  ```
  **Anotar aquí:** `___________________`

- [ ] **IP pública de un nodo EC2 del cluster:**
  ```bash
  kubectl get nodes -o wide
  # Copiar la EXTERNAL-IP
  ```
  **Anotar aquí:** `___________________`

### 2. Reemplazar valores en templates (5 min)
- [ ] Editar `k8s/templates-local/01-secret-REAL.yml`:
  - Reemplazar `IP_PRIVADA_MONGODB_AQUI` con: ___________________
  
- [ ] Editar `k8s/templates-local/02-configmap-REAL.yml`:
  - Reemplazar `ENDPOINT_RDS_AQUI` con: ___________________
  
- [ ] Editar `k8s/templates-local/07-analitico-secret-REAL.yml`:
  - Reemplazar `IP_PRIVADA_MONGODB_AQUI` (misma de arriba)
  
- [ ] Editar `k8s/templates-local/08-analitico-configmap-REAL.yml`:
  - Reemplazar `ENDPOINT_RDS_AQUI` (mismo de arriba)

### 3. Etiquetar nodos (3 min)
```bash
# Listar nodos
kubectl get nodes

# Copiar nombres y etiquetar:
kubectl label nodes <NODO_1> node-role=frontend avsa-role=frontend
kubectl label nodes <NODO_2> node-role=backend-springboot avsa-role=backend
kubectl label nodes <NODO_3> node-role=backend-analitico avsa-role=backend-analitico
```

- [ ] Nodos etiquetados
- [ ] Verificado: `kubectl get nodes --show-labels | grep avsa-role`

### 4. Cargar datos en las bases (10 min)
- [ ] **MongoDB:**
  ```bash
  scp -i clave.pem mongodb-backups.tar.gz ubuntu@<IP_PUBLICA_MONGO>:/tmp/
  ssh -i clave.pem ubuntu@<IP_PUBLICA_MONGO>
  cd /tmp
  tar -xzf mongodb-backups.tar.gz
  mongorestore --host localhost --port 27017 -u admin -p TuPasswordMongo123 --authenticationDatabase admin backup/
  ```

- [ ] **SQL Server RDS:**
  ```bash
  sqlcmd -S <ENDPOINT_RDS> -U admin -P TuPasswordSQLServer123 -i 01-crear-estructura-completa.sql
  ```

### 5. Desplegar (2 min)
```bash
cd k8s
./deploy-RAPIDO.sh
```

- [ ] Script ejecutado sin errores
- [ ] Pods en estado `Running`: `kubectl get pods -n alexandraquispe-19`

### 6. Verificar (5 min)
- [ ] **Frontend:** `http://<IP_NODO>:30080` → Carga correctamente
- [ ] **Backend Spring:** `http://<IP_NODO>:30019/swagger-ui.html` → Swagger visible
- [ ] **Backend Analítico:** `http://<IP_NODO>:30008/docs` → FastAPI docs visible
- [ ] **Logs sin errores:**
  ```bash
  kubectl logs -f deployment/avsa-backend-19 -n alexandraquispe-19
  kubectl logs -f deployment/avsa-analitico-19 -n alexandraquispe-19
  ```

### 7. Prueba end-to-end
- [ ] Frontend puede cargar datos del backend Spring Boot
- [ ] Backend Spring Boot conecta a MongoDB
- [ ] Backend Spring Boot conecta a SQL Server RDS
- [ ] Backend Analítico responde correctamente en `/api/v1/analytics/productos/resumen-categoria`

## TIEMPO TOTAL ESTIMADO: 40 minutos
```

---

## ❌ PARTE 2: LO QUE NO PUEDES HACER AHORA (NECESITAS AWS)

### ⛔ Estas cosas SÍ debes hacerlas el día del laboratorio:

1. **Crear la instancia RDS de SQL Server**
   - Solo se puede hacer en la cuenta AWS del laboratorio
   
2. **Crear la instancia EC2 para MongoDB**
   - Solo se puede hacer en la cuenta AWS del laboratorio

3. **Obtener las IPs/endpoints reales**
   - No las tendrás hasta que crees los recursos en AWS

4. **Etiquetar los nodos del cluster Kubernetes**
   - No puedes hacerlo sin el cluster real

5. **Probar la conectividad entre pods y bases de datos**
   - Requiere el entorno AWS completo

---

## 📊 RESUMEN: DIVISIÓN DE TRABAJO

| Tarea | Cuándo | Tiempo | Dificultad |
|-------|--------|--------|------------|
| **Subir imágenes Docker Hub** | 🏠 AHORA | 20 min | ⭐ Fácil |
| **Crear templates con credenciales** | 🏠 AHORA | 15 min | ⭐ Fácil |
| **Preparar script de despliegue** | 🏠 AHORA | 10 min | ⭐ Fácil |
| **Preparar backups de datos** | 🏠 AHORA | 10 min | ⭐ Fácil |
| **Crear checklist** | 🏠 AHORA | 5 min | ⭐ Fácil |
| **Crear RDS + EC2 MongoDB** | 🏫 LABORATORIO | 15 min | ⭐⭐ Medio |
| **Reemplazar IPs en templates** | 🏫 LABORATORIO | 5 min | ⭐ Fácil |
| **Etiquetar nodos** | 🏫 LABORATORIO | 3 min | ⭐ Fácil |
| **Cargar datos** | 🏫 LABORATORIO | 10 min | ⭐⭐ Medio |
| **Ejecutar despliegue** | 🏫 LABORATORIO | 2 min | ⭐ Fácil |
| **Verificar y probar** | 🏫 LABORATORIO | 5 min | ⭐ Fácil |

### 🎯 Totales:
- **Trabajo en casa:** 60 minutos → 90% del trabajo
- **Trabajo en laboratorio:** 40 minutos → 10% del trabajo (solo ajustes)

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### 1. AHORA MISMO (en tu casa):
```bash
# Paso 1: Subir imágenes
docker login
cd ASE251S4_T08-be
docker build -t alexandraquispe/avsa-backend:1.0 .
docker push alexandraquispe/avsa-backend:1.0

cd ../ASE251S4_T08_ba
docker build -t alexandraquispe/avsa-analytics:1.0 .
docker push alexandraquispe/avsa-analytics:1.0

# Paso 2: Crear templates
cd ../ASE251S4_T08-be/k8s
mkdir templates-local
# Crear los 4 archivos *-REAL.yml (copiados de arriba)

# Paso 3: Crear script
# Copiar el contenido de deploy-RAPIDO.sh (arriba)
chmod +x deploy-RAPIDO.sh

# Paso 4: Verificar que todo está listo
ls -la templates-local/
docker images | grep alexandraquispe
```

### 2. EL DÍA DEL LABORATORIO:
```bash
# Solo necesitas:
# 1. Obtener 2 valores (IP MongoDB + Endpoint RDS)
# 2. Hacer find-replace en los templates
# 3. Ejecutar ./deploy-RAPIDO.sh
# 4. Verificar que funciona
```

---

## ✅ CONCLUSIÓN

**SÍ, puedes (y DEBES) llevar casi todo configurado:**

✅ Imágenes Docker subidas  
✅ Templates con credenciales preparadas  
✅ Scripts de despliegue listos  
✅ Backups de datos comprimidos  

**El día del laboratorio SOLO cambias:**
- 2 IPs/endpoints (buscar-reemplazar)
- Ejecutas 1 script

**Tiempo total en laboratorio: 40 minutos en lugar de 2-3 horas** 🎉
