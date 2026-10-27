# Script de prueba de conexión para ASE251S4_T08-db
# Ejecutar: .\test-connection.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test de Conexión - AVSA Cañete T08  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar resultado
function Show-Result {
    param(
        [string]$Test,
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "[✓] $Test" -ForegroundColor Green
        if ($Message) { Write-Host "    $Message" -ForegroundColor Gray }
    } else {
        Write-Host "[✗] $Test" -ForegroundColor Red
        if ($Message) { Write-Host "    $Message" -ForegroundColor Yellow }
    }
}

# Test 1: Docker está instalado
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Show-Result "Docker instalado" $true "$dockerVersion"
} catch {
    Show-Result "Docker instalado" $false "Docker no está instalado o no está en PATH"
    exit 1
}

Write-Host ""

# Test 2: Docker Compose está disponible
Write-Host "2. Verificando Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker compose version 2>&1
    Show-Result "Docker Compose disponible" $true "$composeVersion"
} catch {
    Show-Result "Docker Compose disponible" $false "Docker Compose no está disponible"
    exit 1
}

Write-Host ""

# Test 3: Archivo .env existe
Write-Host "3. Verificando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Show-Result "Archivo .env existe" $true "Configuración encontrada"
} else {
    Show-Result "Archivo .env existe" $false "Ejecuta: Copy-Item .env.example .env"
    Write-Host ""
    Write-Host "Creando .env desde .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Show-Result "Archivo .env creado" $true "Revisa las credenciales en .env"
}

Write-Host ""

# Test 4: Configuración de Docker Compose es válida
Write-Host "4. Validando configuración..." -ForegroundColor Yellow
try {
    $configTest = docker compose config 2>&1
    if ($LASTEXITCODE -eq 0) {
        Show-Result "Configuración válida" $true "compose.yaml está correcto"
    } else {
        Show-Result "Configuración válida" $false "Hay errores en compose.yaml o .env"
        Write-Host $configTest -ForegroundColor Red
        exit 1
    }
} catch {
    Show-Result "Configuración válida" $false "Error al validar configuración"
    exit 1
}

Write-Host ""

# Test 5: Servicios están corriendo
Write-Host "5. Verificando servicios..." -ForegroundColor Yellow
try {
    $services = docker compose ps --format json 2>&1 | ConvertFrom-Json
    
    if ($services) {
        $sqlserver = $services | Where-Object { $_.Service -eq "sqlserver" }
        $mongodb = $services | Where-Object { $_.Service -eq "mongodb" }
        
        if ($sqlserver -and $sqlserver.State -eq "running") {
            Show-Result "SQL Server corriendo" $true "Estado: $($sqlserver.Health)"
        } else {
            Show-Result "SQL Server corriendo" $false "Ejecuta: docker compose up -d sqlserver"
        }
        
        if ($mongodb -and $mongodb.State -eq "running") {
            Show-Result "MongoDB corriendo" $true "Estado: $($mongodb.Health)"
        } else {
            Show-Result "MongoDB corriendo" $false "Ejecuta: docker compose up -d mongodb"
        }
    } else {
        Show-Result "Servicios corriendo" $false "Ningún servicio está corriendo. Ejecuta: docker compose up -d"
    }
} catch {
    Show-Result "Servicios corriendo" $false "No se pueden consultar servicios"
}

Write-Host ""

# Test 6: Conexión a SQL Server
Write-Host "6. Probando conexión a SQL Server..." -ForegroundColor Yellow
try {
    $sqlTest = docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -Q "SELECT 'OK' AS status" 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $sqlTest -match "OK") {
        Show-Result "Conexión a SQL Server" $true "avsa_db accesible"
        
        # Verificar changesets
        $changesetCount = docker compose exec -T sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Avsa@Admin12345" -C -d avsa_db -Q "SELECT COUNT(*) FROM DATABASECHANGELOG" -h -1 2>&1
        if ($changesetCount -match "\d+") {
            $count = $changesetCount -replace "[^0-9]", ""
            Show-Result "Changesets de Liquibase" $true "$count changesets aplicados"
        }
    } else {
        Show-Result "Conexión a SQL Server" $false "No se puede conectar a SQL Server"
    }
} catch {
    Show-Result "Conexión a SQL Server" $false "Error al probar conexión"
}

Write-Host ""

# Test 7: Conexión a MongoDB
Write-Host "7. Probando conexión a MongoDB..." -ForegroundColor Yellow
try {
    $mongoTest = docker compose exec -T mongodb mongosh --quiet --eval "print('OK')" 2>&1
    
    if ($mongoTest -match "OK") {
        Show-Result "Conexión a MongoDB" $true "db_avsa accesible"
        
        # Verificar changesets
        $mongoChangesets = docker compose exec -T mongodb mongosh db_avsa --quiet --eval "db.DATABASECHANGELOG.countDocuments()" 2>&1
        if ($mongoChangesets -match "\d+") {
            Show-Result "Changesets de Liquibase" $true "$mongoChangesets changesets aplicados"
        }
        
        # Verificar replica set
        $replicaSet = docker compose exec -T mongodb mongosh --quiet --eval "rs.status().set" 2>&1
        if ($replicaSet -match "rs0") {
            Show-Result "Replica Set configurado" $true "rs0 activo (ACID habilitado)"
        }
    } else {
        Show-Result "Conexión a MongoDB" $false "No se puede conectar a MongoDB"
    }
} catch {
    Show-Result "Conexión a MongoDB" $false "Error al probar conexión"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resumen del Test                      " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar puertos
Write-Host "Puertos en uso:" -ForegroundColor Yellow
Write-Host "  SQL Server: localhost:1433" -ForegroundColor Gray
Write-Host "  MongoDB:    localhost:27017" -ForegroundColor Gray
Write-Host ""

# Comandos útiles
Write-Host "Comandos útiles:" -ForegroundColor Yellow
Write-Host "  docker compose ps                      # Ver servicios" -ForegroundColor Gray
Write-Host "  docker compose logs -f sqlserver       # Ver logs SQL" -ForegroundColor Gray
Write-Host "  docker compose logs -f mongodb         # Ver logs Mongo" -ForegroundColor Gray
Write-Host "  docker compose down                    # Detener todo" -ForegroundColor Gray
Write-Host "  docker compose up -d --build           # Reiniciar todo" -ForegroundColor Gray
Write-Host ""

Write-Host "Para más ayuda, consulta: docs/checklist-instalacion.md" -ForegroundColor Cyan
Write-Host ""
