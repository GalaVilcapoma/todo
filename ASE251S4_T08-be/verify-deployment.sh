#!/bin/bash

# Script de verificación para el despliegue de Kubernetes
# Estudiante: Alexandra Quispe
# Proyecto: ASE251S4_T08-be

echo "========================================="
echo "🔍 VERIFICACIÓN DE DESPLIEGUE KUBERNETES"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
NAMESPACE="alexandraquispe-08"
DEPLOYMENT="alexandraquispe-08-deployment"
SERVICE="alexandraquispe-08-service"

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

if [ -d "dockerfile-alexandraquispe" ]; then
    echo -e "${GREEN}✅ Carpeta dockerfile-alexandraquispe existe${NC}"
else
    echo -e "${RED}❌ Carpeta dockerfile-alexandraquispe NO existe${NC}"
fi

if [ -f "dockerfile-alexandraquispe/Dockerfile" ]; then
    echo -e "${GREEN}✅ Dockerfile existe${NC}"
else
    echo -e "${RED}❌ Dockerfile NO existe${NC}"
fi

if [ -d "manifest-alexandraquispe" ]; then
    echo -e "${GREEN}✅ Carpeta manifest-alexandraquispe existe${NC}"
else
    echo -e "${RED}❌ Carpeta manifest-alexandraquispe NO existe${NC}"
fi

MANIFESTS=(
    "alexandraquispe-08-namespace.yml"
    "alexandraquispe-08-secret.yml"
    "alexandraquispe-08-configmap.yml"
    "alexandraquispe-08-deployment.yml"
    "alexandraquispe-08-service.yml"
)

for manifest in "${MANIFESTS[@]}"; do
    if [ -f "manifest-alexandraquispe/$manifest" ]; then
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
    echo -e "${RED}❌ kubectl no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✅ kubectl disponible${NC}"

# Verificar namespace
kubectl get namespace $NAMESPACE &> /dev/null
check "Namespace $NAMESPACE"

# Verificar secret
kubectl get secret alexandraquispe-08-secret -n $NAMESPACE &> /dev/null
check "Secret alexandraquispe-08-secret"

# Verificar configmap
kubectl get configmap alexandraquispe-08-configmap -n $NAMESPACE &> /dev/null
check "ConfigMap alexandraquispe-08-configmap"

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
    echo -e "${RED}❌ No hay pods en el namespace${NC}"
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
echo "🌐 4. Verificando service..."
echo "-------------------------------------------"

EXTERNAL_IP=$(kubectl get service $SERVICE -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

if [ -z "$EXTERNAL_IP" ]; then
    echo -e "${YELLOW}⚠️  LoadBalancer sin EXTERNAL-IP (usa port-forward)${NC}"
    echo "   Comando: kubectl port-forward service/$SERVICE 8081:80 -n $NAMESPACE"
else
    echo -e "${GREEN}✅ LoadBalancer activo: $EXTERNAL_IP${NC}"
fi

echo ""
echo "📊 5. Resumen de recursos..."
echo "-------------------------------------------"
kubectl get all -n $NAMESPACE

echo ""
echo "🔍 6. Verificando logs (últimas 10 líneas)..."
echo "-------------------------------------------"

FIRST_POD=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ ! -z "$FIRST_POD" ]; then
    echo "Logs del pod: $FIRST_POD"
    kubectl logs $FIRST_POD -n $NAMESPACE --tail=10
else
    echo -e "${RED}❌ No hay pods para mostrar logs${NC}"
fi

echo ""
echo "========================================="
echo "✅ VERIFICACIÓN COMPLETADA"
echo "========================================="
echo ""
echo "💡 Próximos pasos:"
echo "   1. Si todo está OK, probar la aplicación:"
echo "      kubectl port-forward service/$SERVICE 8081:80 -n $NAMESPACE"
echo "      Luego abrir: http://localhost:8081/swagger-ui.html"
echo ""
echo "   2. Ver logs en tiempo real:"
echo "      kubectl logs -f $FIRST_POD -n $NAMESPACE"
echo ""
echo "   3. Ver eventos del namespace:"
echo "      kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
echo ""
