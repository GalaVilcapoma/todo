#!/bin/bash
set -e

IMAGE="alexandraquispe/avsa-backend:1.0"
CONTAINER="avsa-backend"

echo "Desplegando AVSA Backend en EC2..."
echo "================================================"

if [ -z "$MONGODB_URI" ]; then
    echo "ERROR: define MONGODB_URI antes de ejecutar el script."
    exit 1
fi

if [ -z "$R2DBC_URL" ] || [ -z "$R2DBC_USERNAME" ] || [ -z "$R2DBC_PASSWORD" ]; then
    echo "ERROR: define R2DBC_URL, R2DBC_USERNAME y R2DBC_PASSWORD antes de ejecutar el script."
    exit 1
fi

if [ "$(docker ps -aq -f name=^/${CONTAINER}$)" ]; then
    echo "Deteniendo contenedor anterior..."
    docker stop "$CONTAINER" >/dev/null 2>&1 || true
    docker rm "$CONTAINER" >/dev/null 2>&1 || true
fi

echo "Descargando imagen $IMAGE..."
docker pull "$IMAGE"

echo "Iniciando $CONTAINER..."
docker run -d \
  --name "$CONTAINER" \
  -p 8081:8081 \
  -e MONGODB_URI="$MONGODB_URI" \
  -e R2DBC_URL="$R2DBC_URL" \
  -e R2DBC_USERNAME="$R2DBC_USERNAME" \
  -e R2DBC_PASSWORD="$R2DBC_PASSWORD" \
  --restart always \
  "$IMAGE"

sleep 5

echo ""
echo "Estado del contenedor:"
docker ps -a --filter "name=^/${CONTAINER}$"

echo ""
echo "Ultimos logs:"
docker logs "$CONTAINER" --tail 20

IP_PUBLICA=$(curl -s ifconfig.me || true)

echo ""
echo "================================================"
echo "AVSA Backend desplegado."
echo "================================================"
echo ""
echo "URLs de acceso:"
echo "   Health:      http://$IP_PUBLICA:8081/actuator/health"
echo "   Swagger UI:  http://$IP_PUBLICA:8081/swagger-ui.html"
echo "   OpenAPI:     http://$IP_PUBLICA:8081/v3/api-docs"
echo ""
echo "Ver logs: docker logs $CONTAINER -f"
echo "Reiniciar: docker restart $CONTAINER"
echo "Detener:   docker stop $CONTAINER"
