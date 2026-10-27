# README-COMANDOS.md - Alexandra Quispe (19) | OAS / TCC

## Namespace
- lexandraquispe-19

## AWS Resources (TCC)
- Prefijo: vsa-alexandra-
- RDS SQL Server: vsa-alexandra-sqlserver-rds
- EC2 MongoDB: vsa-alexandra-mongodb-ec2
- EC2 Backend: vsa-alexandra-backend-ec2
- S3 Bucket: vsa-alexandra-frontend-bucket
- VPC: vsa-alexandra-vpc

## Labels / Apps
- Frontend: pp: avsa-frontend-19 -> Service vsa-frontend-svc
- Backend Spring Boot: pp: avsa-backend-19 -> Service vsa-backend-svc
- Backend Analitico (FastAPI/Python): pp: avsa-analitico-19 -> Service vsa-analitico-svc

## Node Isolation (EC2 Nodes)
Aplicar labels a nodos:
`ash
kubectl label node <node-frontend> avsa-role=frontend node-role=frontend
kubectl label node <node-backend>  avsa-role=backend node-role=backend-springboot
kubectl label node <node-analitico> avsa-role=backend-analitico node-role=backend-analitico
`

## Despliegue
### eva-despliegue/ (OAS)
`ash
cd eva-despliegue
chmod +x deploy.sh
./deploy.sh
`

### k8s/ (TCC)
`ash
cd k8s
chmod +x deploy.sh deploy-be-fe.sh
./deploy.sh
# o
./deploy-be-fe.sh
`

## Verificacion
`ash
kubectl get ns alexandraquispe-19
kubectl get pods -n alexandraquispe-19 -o wide
kubectl get svc -n alexandraquispe-19
kubectl get all -n alexandraquispe-19
`

## Logs
`ash
kubectl logs -f deployment/avsa-backend-19 -n alexandraquispe-19
kubectl logs -f deployment/avsa-frontend-19 -n alexandraquispe-19
kubectl logs -f deployment/avsa-analitico-19 -n alexandraquispe-19
`

## Endpoints (NodePort / Postman/OpenAPI)
- Backend Spring Boot: http://<NODE_IP>:30019 / Swagger: http://<NODE_IP>:30019/swagger-ui.html / Actuator: http://<NODE_IP>:30019/actuator/health
- Frontend: http://<NODE_IP>:30080
- Analitico: http://<NODE_IP>:30008 / OpenAPI: http://<NODE_IP>:30008/openapi.json / Docs: http://<NODE_IP>:30008/docs

## Conexiones
- SQL Server RDS: vsa-alexandra-sqlserver-rds:1433 (transaccionales)
- MongoDB EC2/Atlas: vsa-alexandra-mongodb-ec2:27017 (maestros/logs/analitica)
