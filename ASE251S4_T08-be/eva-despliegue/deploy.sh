#!/bin/bash
set -e
echo "Desplegando Backend AVSA para EVA/OAS - namespace alexandraquispe-19"
kubectl apply -f 01-secret.yml
kubectl apply -f 02-configmap.yml
kubectl apply -f 03-backend-deployment.yml
kubectl apply -f 04-backend-service.yml
kubectl get pods -n alexandraquispe-19
kubectl get svc -n alexandraquispe-19
