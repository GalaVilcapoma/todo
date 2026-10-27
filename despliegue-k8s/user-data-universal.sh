#!/bin/bash
# ==============================================================================
# AVSA (Equipo T08) - USER DATA UNIVERSAL (EL MISMO SCRIPT EN LAS 5 EC2)
# NO SE EDITA NADA. Cada EC2 decide qué instalar según su etiqueta "Name":
#   ec2-mongodb | k8s-master | k8s-node-frontend | k8s-node-backend | k8s-node-analytics
# Las IPs (master, MongoDB) y el endpoint de RDS se descubren solos con la API de AWS.
# Requisito: perfil de IAM "LabInstanceProfile" en las 5 EC2.
# Progreso: EC2 > Acciones > Supervisar y solucionar problemas > Obtener registro del sistema
# ==============================================================================
exec > >(tee -a /var/log/avsa.log) 2>&1

# ---------- Constantes del equipo (no tocar) ----------
K3S_TOKEN="avsa-token-2026"
NS="avsa-namespace"
MONGO_USER="admin"; MONGO_PASS="Mongo12345"; MONGO_DB="db_avsa"
SQL_USER="admin"; SQL_PASS='Avsa1234'; SQL_DB="avsa_db"
IMG_FRONT="anthonygala/avsa-frontend:latest"
IMG_BACK="anthonygala/avsa-backend:latest"
IMG_ANA="anthonygala/avsa-analytics:latest"
# Fijado a un commit: aunque alguien suba cambios a main, los datos cargados no cambian
RAW="https://raw.githubusercontent.com/GalaVilcapoma/todo/864f80b8327f6af10a75883334fa2c3ce26bc2ef/ASE251S4_T08-be"

log() { echo "[$(date +%H:%M:%S)] [AVSA] $*"; }
imds() {
  local t; t=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 300')
  curl -s -H "X-aws-ec2-metadata-token: $t" "http://169.254.169.254/latest/meta-data/$1"
}
wait_port() { until nc -z -w 3 "$1" "$2"; do log "Esperando $1:$2 ..."; sleep 15; done; }
# Primer valor de una EC2 en ejecución cuyo Name coincide con el patrón ($1) -> campo ($2)
ec2_field() {
  aws ec2 describe-instances --filters "Name=tag:Name,Values=$1" Name=instance-state-name,Values=running \
    --query "Reservations[].Instances[].$2" --output text 2>/dev/null | awk '{print $1}'
}
wait_ec2_field() {
  local v
  until v=$(ec2_field "$1" "$2") && [ -n "$v" ] && [ "$v" != None ]; do log "Buscando EC2 '$1'..." >&2; sleep 15; done
  echo "$v"
}
# Seguridad: al terminar, los pods ya no pueden leer el metadata (user data ni credenciales del rol)
harden_imds() {
  aws ec2 modify-instance-metadata-options --instance-id "$INSTANCE_ID" \
    --http-tokens required --http-put-response-hop-limit 1 >/dev/null 2>&1 && log "IMDS protegido"
}

# ---------- Base común ----------
export DEBIAN_FRONTEND=noninteractive
# En el primer arranque Ubuntu a veces tiene apt ocupado: esperar en vez de fallar
echo 'DPkg::Lock::Timeout "600";' > /etc/apt/apt.conf.d/99avsa-lock
apt-get update -y && apt-get install -y curl jq unzip netcat-openbsd gnupg
if ! command -v aws >/dev/null; then
  curl -sSL https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscli.zip
  unzip -q /tmp/awscli.zip -d /tmp && /tmp/aws/install
fi
AWS_DEFAULT_REGION="$(imds placement/region)"; export AWS_DEFAULT_REGION
INSTANCE_ID="$(imds instance-id)"

# Si olvidaste el rol IAM, no se rompe: espera hasta que lo asignes (sin reiniciar)
until aws sts get-caller-identity >/dev/null 2>&1; do
  log "SIN PERMISOS AWS: asigna LabInstanceProfile (Acciones > Seguridad > Modificar rol de IAM). Reintentando..."
  sleep 20
done

NAME=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" Name=key,Values=Name --query 'Tags[0].Value' --output text)
NODE=$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9-\n' '-')
case "$NODE" in
  *mongo*)                  ROLE=mongodb ;;
  *master*)                 ROLE=master ;;
  *frontend*)               ROLE=frontend ;;
  *analytic*|*analitic*)    ROLE=analytics ;;
  *backend*)                ROLE=backend ;;
  *) log "ERROR: el nombre '$NAME' no corresponde a ningún rol"; exit 1 ;;
esac
log "EC2 '$NAME' -> rol: $ROLE"

# ==============================================================================
# ROL: MONGODB 8.0 (EC2 externa, puerto 27017)
# ==============================================================================
if [ "$ROLE" = mongodb ]; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --batch --yes --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -y && apt-get install -y mongodb-org
  # Parche glibc rseq para kernels nuevos (no cambiar a 0)
  mkdir -p /etc/systemd/system/mongod.service.d
  printf '[Service]\nEnvironment="GLIBC_TUNABLES=glibc.pthread.rseq=1"\n' > /etc/systemd/system/mongod.service.d/rseq.conf
  apt-mark hold linux-aws linux-image-aws linux-headers-aws
  systemctl disable --now unattended-upgrades || true
  systemctl daemon-reload && systemctl enable --now mongod
  until mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 3; done

  mongosh --quiet --eval "db.getSiblingDB('admin').createUser({user:'$MONGO_USER',pwd:'$MONGO_PASS',roles:['root']})"
  printf '\nsecurity:\n  authorization: enabled\n' >> /etc/mongod.conf
  systemctl restart mongod
  URI="mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/$MONGO_DB?authSource=admin"
  until mongosh "$URI" --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 3; done

  log "Poblando MongoDB $MONGO_DB (customers, products, agrochemicals)..."
  curl -fsSL "$RAW/seed-mongodb-s4.js" -o /root/seed-mongodb.js && mongosh "$URI" /root/seed-mongodb.js

  # Recién ahora se abre a la VPC: si el master ve el 27017, los datos ya están cargados
  sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
  systemctl restart mongod
  log "MONGODB LISTO Y POBLADO"
  harden_imds
  exit 0
fi

# ==============================================================================
# ROL: WORKERS (frontend / backend / analytics) -> se unen y se etiquetan solos
# ==============================================================================
if [ "$ROLE" != master ]; then
  MASTER_IP=$(wait_ec2_field '*master*' PrivateIpAddress)
  log "Master encontrado en $MASTER_IP"
  wait_port "$MASTER_IP" 6443
  curl -sfL https://get.k3s.io | K3S_URL="https://$MASTER_IP:6443" K3S_TOKEN="$K3S_TOKEN" \
    sh -s - agent --node-name "$NODE" --node-label "role=$ROLE"
  log "WORKER '$NODE' UNIDO AL CLÚSTER CON role=$ROLE"
  # Descarga su imagen mientras el master espera a RDS: el pod arranca al instante después
  case "$ROLE" in frontend) IMG=$IMG_FRONT ;; backend) IMG=$IMG_BACK ;; *) IMG=$IMG_ANA ;; esac
  for i in 1 2 3 4 5; do k3s crictl pull "$IMG" && break; sleep 10; done
  log "Imagen $IMG descargada"
  harden_imds
  exit 0
fi

# ==============================================================================
# ROL: MASTER (control plane K3s + carga SQL Server + despliegue de la app)
# ==============================================================================
curl -sfL https://get.k3s.io | K3S_TOKEN="$K3S_TOKEN" sh -s - server \
  --write-kubeconfig-mode 644 --node-name "$NODE" --disable traefik
mkdir -p /home/ubuntu/.kube && cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
echo 'export KUBECONFIG=/home/ubuntu/.kube/config' >> /home/ubuntu/.bashrc
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
log "K3s server instalado"

# Cliente sqlcmd: se instala ya, mientras RDS todavía se está creando
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --batch --yes --dearmor -o /usr/share/keyrings/microsoft-prod.gpg
curl -fsSL https://packages.microsoft.com/config/ubuntu/24.04/prod.list -o /etc/apt/sources.list.d/mssql-release.list
apt-get update -y && ACCEPT_EULA=Y apt-get install -y mssql-tools18 unixodbc

# 1) Descubrir MongoDB y RDS (sin escribir IPs a mano)
MONGO_IP=$(wait_ec2_field 'ec2-mongo*' PrivateIpAddress)
until RDS_HOST=$(aws rds describe-db-instances \
        --query "DBInstances[?starts_with(Engine,'sqlserver') && Endpoint.Address] | [0].Endpoint.Address" --output text 2>/dev/null) \
      && [ -n "$RDS_HOST" ] && [ "$RDS_HOST" != None ]; do
  log "Esperando que RDS SQL Server termine de crearse (10-15 min)..."; sleep 30
done
log "MongoDB: $MONGO_IP | RDS: $RDS_HOST"
wait_port "$MONGO_IP" 27017
wait_port "$RDS_HOST" 1433

# 2) Crear y poblar avsa_db en RDS (script del proyecto: crea la BD, tablas y datos de prueba)
sqlcmd() { /opt/mssql-tools18/bin/sqlcmd -C -f 65001 -S "$RDS_HOST,1433" -U "$SQL_USER" -P "$SQL_PASS" "$@"; }
curl -fsSL "$RAW/01-crear-estructura-completa.sql" -o /root/init_sqlserver.sql
for i in $(seq 60); do
  sqlcmd -b -i /root/init_sqlserver.sql && { log "SQL SERVER POBLADO"; break; }
  log "Reintento $i/60 de la carga SQL (si dice Login failed: RDS > Modify > contraseña Avsa1234)"; sleep 20
done

# 3) URL pública del backend para el frontend (IP elástica del master si ya la asociaste)
PUB_API=$(aws ec2 describe-addresses --filters "Name=instance-id,Values=$INSTANCE_ID" --query 'Addresses[0].PublicIp' --output text 2>/dev/null)
[ -z "$PUB_API" ] || [ "$PUB_API" = None ] && PUB_API=$(imds public-ipv4)
API_URL="http://$PUB_API:30081"
log "Frontend usará API_URL=$API_URL"

# 4) Desplegar la aplicación en sus nodos dedicados
kubectl apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: $NS
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: avsa-config
  namespace: $NS
data:
  SERVER_PORT: "8081"
  SPRING_APPLICATION_NAME: "spring-webflux-nosql"
  SPRINGDOC_API_DOCS_ENABLED: "true"
  SPRINGDOC_API_DOCS_PATH: "/v3/api-docs"
  SPRINGDOC_SWAGGER_UI_ENABLED: "true"
  SPRINGDOC_SWAGGER_UI_PATH: "/swagger-ui.html"
  PORT: "8000"
  DATABASE_NAME: "$MONGO_DB"
  MONGODB_DATABASE: "$MONGO_DB"
  SQLSERVER_ENABLED: "true"
  SQLSERVER_HOST: "$RDS_HOST"
  SQLSERVER_PORT: "1433"
  SQLSERVER_DATABASE: "$SQL_DB"
---
apiVersion: v1
kind: Secret
metadata:
  name: avsa-secret
  namespace: $NS
type: Opaque
stringData:
  MONGODB_URI: "mongodb://$MONGO_USER:$MONGO_PASS@$MONGO_IP:27017/$MONGO_DB?authSource=admin"
  R2DBC_URL: "r2dbc:mssql://$RDS_HOST:1433/$SQL_DB?trustServerCertificate=true"
  R2DBC_USERNAME: "$SQL_USER"
  R2DBC_PASSWORD: "$SQL_PASS"
  SQLSERVER_USER: "$SQL_USER"
  SQLSERVER_PASSWORD: "$SQL_PASS"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: avsa-backend
  namespace: $NS
spec:
  replicas: 1
  selector:
    matchLabels: {app: avsa-backend}
  template:
    metadata:
      labels: {app: avsa-backend}
    spec:
      nodeSelector: {role: backend}
      enableServiceLinks: false
      containers:
      - name: avsa-backend
        image: $IMG_BACK
        imagePullPolicy: IfNotPresent
        ports: [{containerPort: 8081}]
        envFrom: [{configMapRef: {name: avsa-config}}, {secretRef: {name: avsa-secret}}]
        resources:
          requests: {memory: "512Mi", cpu: "250m"}
          limits: {memory: "1536Mi"}
        readinessProbe:
          tcpSocket: {port: 8081}
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: avsa-backend
  namespace: $NS
spec:
  type: NodePort
  selector: {app: avsa-backend}
  ports: [{port: 8081, targetPort: 8081, nodePort: 30081}]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: avsa-analytics
  namespace: $NS
spec:
  replicas: 1
  selector:
    matchLabels: {app: avsa-analytics}
  template:
    metadata:
      labels: {app: avsa-analytics}
    spec:
      nodeSelector: {role: analytics}
      enableServiceLinks: false
      containers:
      - name: avsa-analytics
        image: $IMG_ANA
        imagePullPolicy: IfNotPresent
        ports: [{containerPort: 8000}]
        envFrom: [{configMapRef: {name: avsa-config}}, {secretRef: {name: avsa-secret}}]
        resources:
          requests: {memory: "256Mi", cpu: "200m"}
          limits: {memory: "1024Mi"}
        readinessProbe:
          httpGet: {path: /docs, port: 8000}
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: avsa-analytics
  namespace: $NS
spec:
  type: NodePort
  selector: {app: avsa-analytics}
  ports: [{port: 8000, targetPort: 8000, nodePort: 30000}]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: avsa-frontend
  namespace: $NS
spec:
  replicas: 1
  selector:
    matchLabels: {app: avsa-frontend}
  template:
    metadata:
      labels: {app: avsa-frontend}
    spec:
      nodeSelector: {role: frontend}
      enableServiceLinks: false
      containers:
      - name: avsa-frontend
        image: $IMG_FRONT
        imagePullPolicy: IfNotPresent
        ports: [{containerPort: 80}]
        env:
        - name: API_URL
          value: "$API_URL"
        resources:
          requests: {memory: "64Mi", cpu: "50m"}
          limits: {memory: "256Mi"}
        readinessProbe:
          httpGet: {path: /, port: 80}
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: avsa-frontend
  namespace: $NS
spec:
  type: NodePort
  selector: {app: avsa-frontend}
  ports: [{port: 80, targetPort: 80, nodePort: 30080}]
EOF
log "Manifiestos aplicados. Esperando a que los 3 workers se unan y los pods arranquen..."
for d in avsa-frontend avsa-backend avsa-analytics; do
  kubectl -n "$NS" rollout status "deploy/$d" --timeout=20m
done

# 5) Verificación automática del flujo de datos y resumen con las URLs
sleep 20
code() { curl -s -o /dev/null -m 10 -w '%{http_code}' "$1"; }
PUB_FE=$(ec2_field '*frontend*' PublicIpAddress)
PUB_BE=$(ec2_field '*node-backend' PublicIpAddress)
PUB_AN=$(ec2_field '*nalytic*' PublicIpAddress)
cat > /home/ubuntu/URLS.txt <<EOF
==================== AVSA - DESPLIEGUE TERMINADO ====================
Frontend web ............ http://$PUB_FE:30080
Backend Swagger ......... http://$PUB_BE:30081/swagger-ui.html
Backend (vía master) .... $API_URL/swagger-ui.html   <- el frontend usa esta
Analítico (Swagger) ..... http://$PUB_AN:30000/docs

MongoDB (EC2 externa) ... $MONGO_IP:27017  (admin / $MONGO_PASS)  BD: $MONGO_DB
SQL Server (RDS) ........ $RDS_HOST,1433  (admin / $SQL_PASS)  BD: $SQL_DB

Chequeo interno (HTTP):  frontend=$(code http://localhost:30080/)  backend-health=$(code http://localhost:30081/actuator/health)  analytics-docs=$(code http://localhost:30000/docs)

$(kubectl get nodes -L role)

$(kubectl -n $NS get pods -o wide)
==============================================================================
EOF
chown ubuntu:ubuntu /home/ubuntu/URLS.txt
cat /home/ubuntu/URLS.txt
log "DESPLIEGUE COMPLETO"
harden_imds
