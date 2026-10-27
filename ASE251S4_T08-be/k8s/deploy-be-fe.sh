#!/bin/bash
set -e
echo "Desplegando AVSA (Backend + Frontend + Analitico) en namespace alexandraquispe-19"
kubectl apply -f 00-namespace.yml
kubectl apply -f 01-secret.yml
kubectl apply -f 02-configmap.yml
kubectl apply -f 03-backend-deployment.yml
kubectl apply -f 04-backend-service.yml
kubectl apply -f 05-frontend-deployment.yml
kubectl apply -f 06-frontend-service.yml
kubectl apply -f 07-analitico-secret.yml
kubectl apply -f 08-analitico-configmap.yml
kubectl apply -f 09-analitico-deployment.yml
kubectl apply -f 10-analitico-service.yml
echo "Aplicado. Verificando..."
kubectl get all -n alexandraquispe-19
