#!/bin/bash

# Script de verificación para el despliegue de Kubernetes
# Estudiante: Anthony Gala
# Proyecto: ASE251S4_T08-be

echo "========================================="
echo "🔍 VERIFICACIÓN DE DESPLIEGUE KUBERNETES - ANTHONY GALA"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
NAMESPACE="anthonygala-08"
DEPLOYMENT="anthonygala-08-deployment"
SERVICE="anthonygala-08-service"

# Función para verificar
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

echo "📦 1. Verificando estructura de archivos..."
echo "-------------------------------------------"

if [ -d "dockerfile-anthonygala" ]; then
    echo -e "${GREEN}✅ Carpeta dockerfile-anthonygala existe${NC}"
else
    echo -e "${RED}❌ Carpeta dockerfile-anthonygala NO existe${NC}"
fi

if [ -f "dockerfile-anthonygala/Dockerfile" ]; then
    echo -e "${GREEN}✅ Dockerfile existe${NC}"
else
    echo -e "${RED}❌ Dockerfile NO existe${NC}"
fi

MANIFEST_DIR="manifest-anthonygala"

if [ -d "$MANIFEST_DIR" ]; then
    echo -e "${GREEN}✅ Carpeta $MANIFEST_DIR existe${NC}"
else
    echo -e "${RED}❌ Carpeta manifest-anthonygala NO existe${NC}"
fi

MANIFESTS=(
    "anthonygala-08-namespace.yml"
    "anthonygala-08-secret.yml"
    "anthonygala-08-configmap.yml"
    "anthonygala-08-deployment.yml"
    "anthonygala-08-service.yml"
)

for manifest in "${MANIFESTS[@]}"; do
    if [ -f "$MANIFEST_DIR/$manifest" ]; then
        echo -e "${GREEN}✅ $manifest existe${NC}"
    else
        echo -e "${RED}❌ $manifest NO existe${NC}"
    fi
done

echo ""
echo "☸️  2. Verificando recursos en Kubernetes..."
echo "-------------------------------------------"

# Verificar si kubectl está disponible
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}⚠️ kubectl no está instalado o no está en el PATH${NC}"
    echo "Recuerda ejecutar esto en Docker Desktop / Minikube / Killercoda con Kubernetes activo."
    exit 0
fi
echo -e "${GREEN}✅ kubectl disponible${NC}"

# Verificar namespace
kubectl get namespace $NAMESPACE &> /dev/null
check "Namespace $NAMESPACE"

# Verificar secret
kubectl get secret anthonygala-08-secret -n $NAMESPACE &> /dev/null
check "Secret anthonygala-08-secret"

# Verificar configmap
kubectl get configmap anthonygala-08-configmap -n $NAMESPACE &> /dev/null
check "ConfigMap anthonygala-08-configmap"

# Verificar deployment
kubectl get deployment $DEPLOYMENT -n $NAMESPACE &> /dev/null
check "Deployment $DEPLOYMENT"

# Verificar service
kubectl get service $SERVICE -n $NAMESPACE &> /dev/null
check "Service $SERVICE"

echo ""
echo "🚀 3. Verificando estado de los pods..."
echo "-------------------------------------------"

PODS=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}' 2>/dev/null)

if [ -z "$PODS" ]; then
    echo -e "${RED}❌ No hay pods en el namespace $NAMESPACE${NC}"
else
    for pod in $PODS; do
        STATUS=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.phase}')
        READY=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.containerStatuses[0].ready}')
        
        if [ "$STATUS" == "Running" ] && [ "$READY" == "true" ]; then
            echo -e "${GREEN}✅ Pod $pod: $STATUS (Ready)${NC}"
        else
            echo -e "${RED}❌ Pod $pod: $STATUS (Ready: $READY)${NC}"
        fi
    done
fi

echo ""
echo "========================================="
echo "✅ VERIFICACIÓN COMPLETADA"
echo "========================================="
