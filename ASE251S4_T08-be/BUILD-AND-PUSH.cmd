@echo off
REM ============================================
REM Script para construir y subir imagenes Docker
REM ============================================

echo.
echo ============================================
echo   BUILD Y PUSH DE IMAGENES DOCKER
echo ============================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker no esta instalado o no esta corriendo
    echo Por favor inicia Docker Desktop
    pause
    exit /b 1
)

echo [OK] Docker detectado
echo.

REM Verificar login en Docker Hub
echo Verificando login en Docker Hub...
docker info | findstr "Username" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo   NECESITAS HACER LOGIN EN DOCKER HUB
    echo ============================================
    echo.
    echo Por favor ingresa tus credenciales de Docker Hub:
    docker login
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Login fallido
        pause
        exit /b 1
    )
)

echo [OK] Login verificado
echo.

REM ============================================
REM IMAGEN 1: Backend Spring Boot
REM ============================================
echo.
echo ============================================
echo   IMAGEN 1/3: Backend Spring Boot
echo ============================================

cd /d "%~dp0"
echo Ubicacion actual: %CD%

echo.
echo [1/3] Construyendo imagen alexandraquispe/avsa-backend:1.0...
echo Esta operacion puede tomar 5-10 minutos (descarga de dependencias Maven)...
echo.

docker build -t alexandraquispe/avsa-backend:1.0 .
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fallo al construir imagen del backend
    echo Revisa los errores arriba y corrige el Dockerfile o pom.xml
    pause
    exit /b 1
)

echo.
echo [OK] Imagen construida exitosamente
echo.
echo [2/3] Subiendo imagen a Docker Hub...
echo Esta operacion puede tomar 3-8 minutos dependiendo de tu conexion...
echo.

docker push alexandraquispe/avsa-backend:1.0
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fallo al subir imagen
    echo Verifica tu conexion a internet y tu login en Docker Hub
    pause
    exit /b 1
)

echo.
echo [OK] Backend Spring Boot subido exitosamente
echo.

REM ============================================
REM IMAGEN 2: Backend Python Analitico
REM ============================================
echo.
echo ============================================
echo   IMAGEN 2/3: Backend Python Analitico
echo ============================================

cd /d "%~dp0..\ASE251S4_T08_ba"
if not exist "Dockerfile" (
    echo [ERROR] No se encuentra el Dockerfile del backend Python
    echo Ubicacion esperada: %CD%\Dockerfile
    pause
    exit /b 1
)

echo Ubicacion actual: %CD%
echo.
echo [1/3] Construyendo imagen alexandraquispe/avsa-analytics:1.0...
echo.

docker build -t alexandraquispe/avsa-analytics:1.0 .
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fallo al construir imagen del backend Python
    echo Revisa los errores arriba y corrige el Dockerfile o requirements.txt
    pause
    exit /b 1
)

echo.
echo [OK] Imagen construida exitosamente
echo.
echo [2/3] Subiendo imagen a Docker Hub...
echo.

docker push alexandraquispe/avsa-analytics:1.0
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fallo al subir imagen
    pause
    exit /b 1
)

echo.
echo [OK] Backend Python Analitico subido exitosamente
echo.

REM ============================================
REM IMAGEN 3: Frontend (si existe)
REM ============================================
echo.
echo ============================================
echo   IMAGEN 3/3: Frontend React
echo ============================================

cd /d "%~dp0..\ASE251S4_T08-fe"
if not exist "Dockerfile" (
    echo [AVISO] No se encuentra el Dockerfile del frontend
    echo Ubicacion buscada: %CD%\Dockerfile
    echo Si no tienes frontend, esto es normal
    echo.
    goto :RESUMEN
)

echo Ubicacion actual: %CD%
echo.
echo [1/3] Construyendo imagen alexandraquispe/avsa-frontend:1.0...
echo.

docker build -t alexandraquispe/avsa-frontend:1.0 .
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fallo al construir imagen del frontend
    pause
    exit /b 1
)

echo.
echo [OK] Imagen construida exitosamente
echo.
echo [2/3] Subiendo imagen a Docker Hub...
echo.

docker push alexandraquispe/avsa-frontend:1.0
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fallo al subir imagen
    pause
    exit /b 1
)

echo.
echo [OK] Frontend React subido exitosamente
echo.

:RESUMEN
REM ============================================
REM RESUMEN FINAL
REM ============================================
echo.
echo ============================================
echo   RESUMEN DE IMAGENES
echo ============================================
echo.

docker images | findstr "alexandraquispe"

echo.
echo ============================================
echo   VERIFICACION EN DOCKER HUB
echo ============================================
echo.
echo Verifica que las imagenes esten disponibles publicamente:
echo.
echo 1. Backend Spring Boot:
echo    https://hub.docker.com/r/alexandraquispe/avsa-backend/tags
echo.
echo 2. Backend Python Analitico:
echo    https://hub.docker.com/r/alexandraquispe/avsa-analytics/tags
echo.
echo 3. Frontend (si aplicable):
echo    https://hub.docker.com/r/alexandraquispe/avsa-frontend/tags
echo.
echo ============================================
echo   PRUEBA DE DESCARGA
echo ============================================
echo.
echo Puedes probar que cualquiera puede descargar las imagenes con:
echo.
echo   docker pull alexandraquispe/avsa-backend:1.0
echo   docker pull alexandraquispe/avsa-analytics:1.0
echo.
echo ============================================
echo   PROCESO COMPLETADO EXITOSAMENTE
echo ============================================
echo.
pause
