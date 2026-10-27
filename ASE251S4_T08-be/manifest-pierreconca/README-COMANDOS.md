# Comandos Kubernetes — PierreConca-05

## 1. INICIAR MINIKUBE

```bash
minikube start
```

---

## 2. APLICAR LOS 5 YMLs (en orden)

```bash
kubectl apply -f PierreConca-05-namespace.yml
kubectl apply -f PierreConca-05-configmap.yml
kubectl apply -f PierreConca-05-secret.yml
kubectl apply -f PierreConca-05-service.yml
kubectl apply -f PierreConca-05-deployment.yml
```

---

## 3. VERIFICAR QUE TODO FUNCIONA

```bash
# Ver namespace creado
kubectl get namespaces | grep pierreconca

# Ver pods (deben estar Running)
kubectl get pods -n pierreconca-05-namespace

# Ver servicio y puerto
kubectl get services -n pierreconca-05-namespace

# Ver logs de la app
kubectl logs -l app=pierreconca-05-deployment -n pierreconca-05-namespace
```

---

## 4. ABRIR LA APP EN EL NAVEGADOR

```bash
# Obtener la URL
minikube service pierreconca-05-service -n pierreconca-05-namespace --url

# Abrir directamente en el navegador
minikube service pierreconca-05-service -n pierreconca-05-namespace
```

Luego en el navegador:
```

http://127.0.0.1:<PUERTO>/v1/api/agrochemicals
http://127.0.0.1:<PUERTO>/api/productos
http://127.0.0.1:<PUERTO>/v1/api/customer
```

---

## 5. ACTUALIZAR DESPUÉS DE CAMBIOS

```bash
# Re-aplicar un yml modificado
kubectl apply -f PierreConca-05-secret.yml

# Reiniciar los pods (para que tomen los cambios del secret/configmap)
kubectl rollout restart deployment pierreconca-05-deployment -n pierreconca-05-namespace

# Ver estado del rollout
kubectl rollout status deployment pierreconca-05-deployment -n pierreconca-05-namespace
```

---

## 6. ELIMINAR TODO

```bash
kubectl delete -f PierreConca-05-deployment.yml
kubectl delete -f PierreConca-05-service.yml
kubectl delete -f PierreConca-05-secret.yml
kubectl delete -f PierreConca-05-configmap.yml
kubectl delete -f PierreConca-05-namespace.yml
```

O eliminar todo de una sola vez:
```bash
kubectl delete namespace pierreconca-05-namespace
```
# LISTAR RECURSOS
kubectl get all,secrets,configmaps
# LISTAR NAMESPACE
kubectl get ns
# POR EN USO
kubectl config set-context --current --namespace=NAMESPACE

Condori Jara Juan Gabriel (juan.condori.jara@vallegrande.edu.pe) 11:23
# kubectl apply -f juan-condori-00-secret.yml
# kubectl delete -f juan-condori-00-secret.yml
kubectl apply -f juan-condori-00-deployment.yml
# LISTAR RECURSOS
kubectl get all,secrets,configmaps
---

## 7. COMANDOS ÚTILES EXTRA

```bash
# Describir un pod (ver errores detallados)
kubectl describe pod -l app=pierreconca-05-deployment -n pierreconca-05-namespace

# Ver logs en tiempo real
kubectl logs -f -l app=pierreconca-05-deployment -n pierreconca-05-namespace

# Ver todos los recursos del namespace
kubectl get all -n pierreconca-05-namespace

# Ver el configmap
kubectl describe configmap pierreconca-05-configmap -n pierreconca-05-namespace

# Ver el secret (nombres de claves, no valores)
kubectl describe secret pierreconca-05-secret -n pierreconca-05-namespace

# Detener minikube
minikube stop

# Ver estado de minikube
minikube status
```
