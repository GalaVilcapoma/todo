# Comandos Kubernetes — Kafka + Zookeeper

## Arquitectura
```
Backend S4-BE (Spring WebFlux) → PRODUCE → Kafka (topic: avsa.transactions, avsa.events)
Backend BA (FastAPI)           → CONSUME ← Kafka (topic: avsa.analytics)
```

---

## 1. EDITAR ANTES DE APLICAR

En `PierreConca-kafka-configmap.yml`, reemplaza:
```
KAFKA_ADVERTISED_LISTENERS: "PLAINTEXT://...svc.cluster.local:9092,EXTERNAL://<IP_PUBLICA_EC2>:30092"
```
→ `<IP_PUBLICA_EC2>` con la IP pública real de tu instancia EC2.

---

## 2. APLICAR EN ORDEN (Zookeeper primero, luego Kafka)

```bash
kubectl apply -f PierreConca-kafka-namespace.yml
kubectl apply -f PierreConca-kafka-configmap.yml
kubectl apply -f PierreConca-zookeeper-deployment.yml
kubectl apply -f PierreConca-zookeeper-service.yml

# Esperar que Zookeeper esté Running antes de continuar
kubectl get pods -n pierreconca-kafka-namespace -w

kubectl apply -f PierreConca-kafka-deployment.yml
kubectl apply -f PierreConca-kafka-service.yml
```

---

## 3. VERIFICAR QUE KAFKA ESTÁ LISTO

```bash
# Ver todos los pods del namespace kafka
kubectl get pods -n pierreconca-kafka-namespace

# Ver logs de Kafka en tiempo real
kubectl logs -f -l app=pierreconca-kafka -n pierreconca-kafka-namespace

# Ver logs de Zookeeper
kubectl logs -f -l app=pierreconca-zookeeper -n pierreconca-kafka-namespace
```

Kafka está listo cuando en los logs ves:
```
[KafkaServer id=1] started
```

---

## 4. CREAR LOS TOPICS MANUALMENTE (opcional, auto-create está ON)

```bash
# Entrar al pod de Kafka
kubectl exec -it deployment/pierreconca-kafka-deployment -n pierreconca-kafka-namespace -- bash

# Dentro del pod, crear topics:
kafka-topics --create --topic avsa.transactions \
  --bootstrap-server localhost:9092 \
  --partitions 1 --replication-factor 1

kafka-topics --create --topic avsa.events \
  --bootstrap-server localhost:9092 \
  --partitions 1 --replication-factor 1

kafka-topics --create --topic avsa.analytics \
  --bootstrap-server localhost:9092 \
  --partitions 1 --replication-factor 1

# Listar topics
kafka-topics --list --bootstrap-server localhost:9092
```

---

## 5. URL DE KAFKA PARA LOS BACKENDS

En los Secrets de los backends, usa esta URL interna del cluster:
```
pierreconca-kafka-service.pierreconca-kafka-namespace.svc.cluster.local:9092
```

Desde fuera del cluster (testing con Postman / kafkacat):
```
<IP_PUBLICA_EC2>:30092
```

---

## 6. ELIMINAR TODO

```bash
kubectl delete namespace pierreconca-kafka-namespace
```
