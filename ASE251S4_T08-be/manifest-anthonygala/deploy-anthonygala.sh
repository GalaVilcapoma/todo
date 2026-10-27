#!/bin/bash
# ============================================================
# SCRIPT DE DESPLIEGUE EN KUBERNETES (K3S) - ANTHONY GALA
# ============================================================
set -e

if [ "$#" -lt 2 ]; then
    echo "Uso: $0 <ENDPOINT_RDS> <IP_PUBLICA_EC2>"
    echo "Ejemplo: $0 avsa-sqlserver.xxxx.us-east-1.rds.amazonaws.com 54.160.20.10"
    exit 1
fi

RDS_ENDPOINT=$1
PUBLIC_IP=$2

echo "============================================================"
echo "  DESPLEGANDO ARQUITECTURA DISTRIBUIDA EN KUBERNETES"
echo "  Namespace: anthonygala-08"
echo "  RDS Endpoint: $RDS_ENDPOINT"
echo "  Public IP Frontend -> Backend: $PUBLIC_IP:30081"
echo "============================================================"

# 1. Crear Namespace
sudo kubectl create namespace anthonygala-08 --dry-run=client -o yaml | sudo kubectl apply -f -

# 2. Crear Secret
sudo kubectl create secret generic anthonygala-08-secret \
  --namespace=anthonygala-08 \
  --from-literal=MONGODB_URI="mongodb+srv://pierreconca_db_user:concaflores31@cluster0.kt6pnki.mongodb.net/db_avsa?retryWrites=true&w=majority&appName=Cluster0" \
  --from-literal=MONGODB_DATABASE="db_avsa" \
  --from-literal=R2DBC_URL="r2dbc:mssql://$RDS_ENDPOINT:1433/avsa_db?trustServerCertificate=true" \
  --from-literal=R2DBC_USERNAME="sa" \
  --from-literal=R2DBC_PASSWORD="Avsa1234" \
  --from-literal=SQLSERVER_HOST="$RDS_ENDPOINT" \
  --from-literal=SQLSERVER_PORT="1433" \
  --from-literal=SQLSERVER_DATABASE="avsa_db" \
  --from-literal=SQLSERVER_USER="sa" \
  --from-literal=SQLSERVER_PASSWORD="Avsa1234" \
  --dry-run=client -o yaml | sudo kubectl apply -f -

# 3. Crear ConfigMap
sudo kubectl create configmap anthonygala-08-configmap \
  --namespace=anthonygala-08 \
  --from-literal=SERVER_PORT="8081" \
  --from-literal=SPRING_APPLICATION_NAME="spring-webflux-nosql" \
  --from-literal=SPRINGDOC_API_DOCS_ENABLED="true" \
  --from-literal=SPRINGDOC_API_DOCS_PATH="/v3/api-docs" \
  --from-literal=SPRINGDOC_SWAGGER_UI_ENABLED="true" \
  --from-literal=SPRINGDOC_SWAGGER_UI_PATH="/swagger-ui.html" \
  --from-literal=PORT="8000" \
  --from-literal=DATABASE_NAME="db_avsa" \
  --from-literal=SQLSERVER_ENABLED="true" \
  --dry-run=client -o yaml | sudo kubectl apply -f -

# 4. Desplegar Backend S4 Spring Boot
sudo kubectl apply -f anthonygala-08-backend-deployment.yml

# 5. Desplegar Backend Analitico FastAPI
sudo kubectl apply -f anthonygala-08-analytics-deployment.yml

# 6. Desplegar Frontend React (actualizando IP_PUBLICA_NODO dinamicamente)
sed "s/IP_PUBLICA_NODO/$PUBLIC_IP/g" anthonygala-08-frontend-deployment.yml | sudo kubectl apply -f -

echo "============================================================"
echo "  DESPLIEGUE APLICADO. VERIFICANDO PODS Y SERVICIOS..."
echo "============================================================"
sudo kubectl get pods -n anthonygala-08 -o wide
sudo kubectl get svc -n anthonygala-08
