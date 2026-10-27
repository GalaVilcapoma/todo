# ============================================================
# BUILD Y PUSH DE IMAGENES DOCKER - ANTHONY GALA (PowerShell)
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  BUILD Y PUSH DE IMAGENES DOCKER - ANTHONY GALA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Backend Spring Boot S4
Write-Host "`n[1/3] Construyendo y subiendo Backend Spring Boot S4..." -ForegroundColor Yellow
Set-Location "D:\tareadori\ASE251S4_T08-be"
docker build -t anthonygala/avsa-backend:1.0 -t anthonygala/avsa-backend:latest -t anthonygala/springboot-webflux-mongodb:1.0 -f dockerfile-anthonygala/Dockerfile .
docker push anthonygala/avsa-backend:1.0
docker push anthonygala/avsa-backend:latest
docker push anthonygala/springboot-webflux-mongodb:1.0
Write-Host "[OK] Backend S4 subido exitosamente." -ForegroundColor Green

# 2. Backend Analitico FastAPI
Write-Host "`n[2/3] Construyendo y subiendo Backend Analitico FastAPI..." -ForegroundColor Yellow
Set-Location "D:\tareadori\ASE251S4_T08_ba"
docker build -t anthonygala/avsa-analytics:1.0 -t anthonygala/avsa-analytics:latest .
docker push anthonygala/avsa-analytics:1.0
docker push anthonygala/avsa-analytics:latest
Write-Host "[OK] Backend Analitico subido exitosamente." -ForegroundColor Green

# 3. Frontend React
Write-Host "`n[3/3] Construyendo y subiendo Frontend React..." -ForegroundColor Yellow
Set-Location "D:\tareadori\ASE251S4_T08-fe"
docker build -t anthonygala/avsa-frontend:1.0 -t anthonygala/avsa-frontend:latest .
docker push anthonygala/avsa-frontend:1.0
docker push anthonygala/avsa-frontend:latest
Write-Host "[OK] Frontend React subido exitosamente." -ForegroundColor Green

Set-Location "D:\tareadori\ASE251S4_T08-be"
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  ¡TODAS LAS IMAGENES FUERON SUBIDAS CON EXITO A DOCKER HUB!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "1. anthonygala/avsa-backend:1.0"
Write-Host "2. anthonygala/avsa-analytics:1.0"
Write-Host "3. anthonygala/avsa-frontend:1.0"
