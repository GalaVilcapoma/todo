# 🚀 GUÍA DE EJECUCIÓN PRESENCIAL — EXAMEN INTERMEDIO
## Curso: Orquestadores y Automatización de Software (3.5 pts)
**Estudiante:** Anthony Gala  
**Namespace:** `anthonygala-08`  
**Arquitectura:** Kubernetes sobre AWS (EC2/EKS) con Aislamiento de Nodos Dedicados

---

## 📋 Resumen de la Rúbrica de Evaluación

| Criterio | Puntaje | Acción Clave en Vivo |
| :--- | :---: | :--- |
| **1. Aislamiento de Nodos EC2 Dedicados** | **1.0 pt** | Etiquetar nodos (`kubectl label`) y verificar que cada pod vaya a su nodo exclusivo con `nodeSelector`. |
| **2. Conectividad Interna del Clúster** | **1.0 pt** | Explicar y verificar la comunicación interna mediante servicios DNS de K8s (`anthonygala-08-backend-service`, etc.). |
| **3. Persistencia Políglota y Reglas de Red** | **1.0 pt** | Configurar Secrets/ConfigMaps conectando a SQL Server (Amazon RDS : 1433) y MongoDB (EC2 / Atlas : 27017). |
| **4. Validación y Pruebas con Swagger (OpenAPI)** | **0.5 pt** | Probar en el navegador el Frontend (30080), Swagger UI del Backend 1 (30081) y Swagger del Analítico (30000) con "Try it out". |

---

## ⚙️ Checklist Previo (Lo que ya debes tener listo de TCC)

Antes de sentarte a dar la evaluación, asegúrate de tener:
- [ ] **SQL Server en Amazon RDS**: Instancia activa, puerto `1433` abierto en el Security Group de AWS.
- [ ] **MongoDB**: Instancia EC2 activa en puerto `27017` o clúster MongoDB Atlas con Network Access `0.0.0.0/0`.
- [ ] **Imágenes en Docker Hub** listas:
  - `anthonygala/avsa-backend:1.0`
  - `anthonygala/avsa-analytics:1.0`
  - `anthonygala/avsa-frontend:1.0`
- [ ] **Clúster Kubernetes en AWS** con mínimo 3 nodos EC2 conectados.

---

## 🎯 PASO A PASO EN VIVO (Hacer de 0 en el examen)

### 📌 Paso 1: Configurar el Aislamiento de Nodos EC2 Dedicados (1.0 pt)

1. Listar los nodos de tu clúster:
   ```bash
   kubectl get nodes -o wide
   ```
   *(Anota los 3 nombres de tus nodos EC2 que aparecen en la columna `NAME`).*

2. Etiquetar cada nodo con su rol dedicado:
   ```bash
   kubectl label nodes <NOMBRE_NODO_1> role=frontend --overwrite
   kubectl label nodes <NOMBRE_NODO_2> role=backend --overwrite
   kubectl label nodes <NOMBRE_NODO_3> role=analytics --overwrite
   ```

3. Demostrar el etiquetado al docente:
   ```bash
   kubectl get nodes --show-labels | grep -E "role=frontend|role=backend|role=analytics"
   ```

> 💬 **Defensa técnica:**  
> *"Profesor, aplicamos aislamiento de infraestructura etiquetando cada instancia EC2 como nodo worker dedicado. Los manifiestos de Kubernetes usan `nodeSelector: role: <componente>` para que el planificador de K8s garantice la distribución independiente y exclusiva de cada carga de trabajo."*

---

### 📌 Paso 2: Crear Namespace, Secrets y Conectividad Externa (1.0 pt)

1. Crear el namespace de trabajo:
   ```bash
   kubectl create namespace anthonygala-08 --dry-run=client -o yaml | kubectl apply -f -
   ```

2. Crear el Secret con las credenciales de SQL Server RDS y MongoDB:
   ```bash
   kubectl create secret generic anthonygala-08-secret \
     --namespace=anthonygala-08 \
     --from-literal=MONGODB_URI="mongodb+srv://pierreconca_db_user:concaflores31@cluster0.kt6pnki.mongodb.net/db_avsa?retryWrites=true&w=majority&appName=Cluster0" \
     --from-literal=MONGODB_DATABASE="db_avsa" \
     --from-literal=R2DBC_URL="r2dbc:mssql://<ENDPOINT_RDS>:1433/avsa_db?trustServerCertificate=true" \
     --from-literal=R2DBC_USERNAME="sa" \
     --from-literal=R2DBC_PASSWORD="<TU_PASSWORD_RDS>" \
     --from-literal=SQLSERVER_HOST="<ENDPOINT_RDS>" \
     --from-literal=SQLSERVER_PORT="1433" \
     --from-literal=SQLSERVER_DATABASE="avsa_db" \
     --from-literal=SQLSERVER_USER="sa" \
     --from-literal=SQLSERVER_PASSWORD="<TU_PASSWORD_RDS>" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

3. Crear el ConfigMap con las configuraciones del sistema:
   ```bash
   kubectl create configmap anthonygala-08-configmap \
     --namespace=anthonygala-08 \
     --from-literal=SERVER_PORT="8081" \
     --from-literal=SPRING_APPLICATION_NAME="spring-webflux-nosql" \
     --from-literal=SPRINGDOC_API_DOCS_ENABLED="true" \
     --from-literal=SPRINGDOC_SWAGGER_UI_ENABLED="true" \
     --from-literal=PORT="8000" \
     --from-literal=DATABASE_NAME="db_avsa" \
     --from-literal=SQLSERVER_ENABLED="true" \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

> 💬 **Defensa técnica:**  
> *"La conectividad hacia las bases de datos externas desacopla las credenciales mediante Secrets de Kubernetes. El clúster se comunica hacia Amazon RDS (puerto 1433) para la consistencia transaccional y hacia MongoDB (puerto 27017 / Atlas) para el almacenamiento políglota de documentos y analítica, resolviendo los DNS externos mediante las reglas de red configuradas."*

---

### 📌 Paso 3: Desplegar Microservicios y Demostrar Conectividad Interna (1.0 pt)

Ubicado en la carpeta `manifest-anthonygala/`:

1. Desplegar Backend 1 (Spring Boot):
   ```bash
   kubectl apply -f anthonygala-08-backend-deployment.yml
   ```

2. Desplegar Backend 2 Analítico (Python):
   ```bash
   kubectl apply -f anthonygala-08-analytics-deployment.yml
   ```

3. Desplegar Frontend (React), inyectando la IP pública del nodo EC2 del Backend:
   ```bash
   sed "s/IP_PUBLICA_NODO/<IP_PUBLICA_EC2_BACKEND>/g" anthonygala-08-frontend-deployment.yml | kubectl apply -f -
   ```

4. **Verificar el despliegue y distribución en nodos (Punto clave para el profesor):**
   ```bash
   kubectl get pods -n anthonygala-08 -o wide
   ```
   *Muestra al docente la columna **NODE**: cada Pod (`avsa-frontend`, `avsa-backend`, `avsa-analytics`) debe estar corriendo en un nodo EC2 diferente.*

5. Verificar los servicios activos:
   ```bash
   kubectl get svc -n anthonygala-08
   ```

> 💬 **Defensa técnica:**  
> *"La conectividad interna entre microservicios se orquesta mediante nombres de servicio DNS internos de Kubernetes (`anthonygala-08-backend-service:8081` y `anthonygala-08-analytics-service:8000`). Esto permite que los pods se descubran dinámicamente sin acoplarse a IPs privadas fijas."*

---

### 📌 Paso 4: Pruebas Funcionales y Validación con Swagger / OpenAPI (0.5 pt)

> 💡 *La rúbrica indica expresamente: "mediante Postman u Open API (Swagger)". Usar Swagger UI directamente en el navegador es más rápido, visual y no requiere importar colecciones.*

Abre tu navegador y demuestra la interacción en vivo:

1. **Backend 1 (Spring Boot WebFlux) — Swagger UI:**
   - **URL:** `http://<IP_EC2_BACKEND>:30081/swagger-ui.html`
   - **Prueba en vivo:**
     - Busca el endpoint `GET /v1/api/agrochemicals` o `GET /v1/api/products`.
     - Haz clic en **"Try it out"** y luego en **"Execute"**.
     - Muestra el código de respuesta **`200 OK`** con los datos cargados desde MongoDB/SQL Server.
   - **Health Check (Opcional):**
     - `http://<IP_EC2_BACKEND>:30081/actuator/health` (debe responder `{"status":"UP"}`).

2. **Backend 2 Analítico (Python) — Swagger / Docs:**
   - **URL:** `http://<IP_EC2_ANALYTICS>:30000/docs`
   - **Prueba en vivo:**
     - Busca el indicador `GET /api/v1/analytics/productos/resumen-categoria`.
     - Haz clic en **"Try it out"** y luego en **"Execute"**.
     - Muestra el resultado analítico con código **`200 OK`**.
   - **OpenAPI Schema (JSON):**
     - `http://<IP_EC2_ANALYTICS>:30000/openapi.json`

3. **Frontend Web (React + TS):**
   - **URL:** `http://<IP_EC2_FRONTEND>:30080`
   - Muestra la interfaz gráfica cargada en el navegador consumiendo los servicios expuestos.

---

## ⚡ ATAJO RÁPIDO: Automatización con Script

Si prefieres ejecutar todo con un solo comando en lugar de escribir paso a paso, ejecuta:

```bash
cd manifest-anthonygala
chmod +x deploy-anthonygala.sh
./deploy-anthonygala.sh <TU_ENDPOINT_RDS> <IP_PUBLICA_EC2>
```

Y luego verifica con:
```bash
kubectl get pods -n anthonygala-08 -o wide
kubectl get svc -n anthonygala-08
```
