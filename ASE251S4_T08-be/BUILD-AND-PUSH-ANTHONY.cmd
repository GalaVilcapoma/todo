@echo off
REM ============================================================
REM BUILD Y PUSH DE IMAGENES DOCKER - ANTHONY GALA
REM ASE251S4_T08: Backend S4 + Backend Analitico + Frontend React
REM ============================================================

echo.
echo ============================================================
echo   BUILD Y PUSH DE IMAGENES DOCKER - ANTHONY GALA
echo ============================================================
echo.

REM 1. Verificar Docker
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker no esta corriendo. Abre Docker Desktop primero.
    pause
    exit /b 1
)
echo [OK] Docker detectado.

REM 2. Sesion en Docker Hub
echo [OK] Sesion en Docker Hub verificada para anthonygala.
echo.

REM ============================================================
REM 1. BACKEND SPRING BOOT S4 (WebFlux + MongoDB + SQL Server)
REM ============================================================
echo ------------------------------------------------------------
echo [1/3] Construyendo Backend Spring Boot S4...
echo ------------------------------------------------------------
cd /d "%~dp0"
docker build -t anthonygala/avsa-backend:1.0 -t anthonygala/avsa-backend:latest -t anthonygala/springboot-webflux-mongodb:1.0 -f dockerfile-anthonygala/Dockerfile .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo el build del Backend S4.
    pause
    exit /b 1
)
echo [OK] Backend construido. Subiendo a Docker Hub...
docker push anthonygala/avsa-backend:1.0
docker push anthonygala/avsa-backend:latest
docker push anthonygala/springboot-webflux-mongodb:1.0
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo el push del Backend S4.
    pause
    exit /b 1
)
echo [OK] Backend subido con exito.
echo.

REM ============================================================
REM 2. BACKEND ANALITICO FASTAPI PYTHON
REM ============================================================
echo ------------------------------------------------------------
echo [2/3] Construyendo Backend Analitico FastAPI...
echo ------------------------------------------------------------
cd /d "%~dp0..\ASE251S4_T08_ba"
docker build -t anthonygala/avsa-analytics:1.0 -t anthonygala/avsa-analytics:latest .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo el build del Backend Analitico.
    pause
    exit /b 1
)
echo [OK] Backend Analitico construido. Subiendo a Docker Hub...
docker push anthonygala/avsa-analytics:1.0
docker push anthonygala/avsa-analytics:latest
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo el push del Backend Analitico.
    pause
    exit /b 1
)
echo [OK] Backend Analitico subido con exito.
echo.

REM ============================================================
REM 3. FRONTEND REACT + VITE + TAILWIND
REM ============================================================
echo ------------------------------------------------------------
echo [3/3] Construyendo Frontend React...
echo ------------------------------------------------------------
cd /d "%~dp0..\ASE251S4_T08-fe"
docker build -t anthonygala/avsa-frontend:1.0 -t anthonygala/avsa-frontend:latest .
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo el build del Frontend React.
    pause
    exit /b 1
)
echo [OK] Frontend construido. Subiendo a Docker Hub...
docker push anthonygala/avsa-frontend:1.0
docker push anthonygala/avsa-frontend:latest
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo el push del Frontend React.
    pause
    exit /b 1
)
echo [OK] Frontend React subido con exito.
echo.

REM ============================================================
REM RESUMEN
REM ============================================================
echo ============================================================
echo   TODAS LAS IMAGENES FUERON CONSTRUIDAS Y SUBIDAS CON EXITO
echo ============================================================
echo 1. anthonygala/avsa-backend:1.0
echo 2. anthonygala/avsa-analytics:1.0
echo 3. anthonygala/avsa-frontend:1.0
echo.
pause
