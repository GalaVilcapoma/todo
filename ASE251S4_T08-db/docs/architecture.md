# Arquitectura del repositorio ASE251S4_T08-db

## Persistencia poliglota

El proyecto AVSA Cañete utiliza dos motores de base de datos, cada uno
especializado según el tipo de información que administra:

- **SQL Server 2022**: datos transaccionales y relacionales donde la
  integridad referencial y las transacciones ACID son críticas — pedidos
  de clientes, ventas, entregas de inventario, aplicaciones de campo,
  auditoría y trazabilidad SENASA.

- **MongoDB 7**: datos de catálogo y maestros con esquema flexible, donde
  los documentos requieren lectura frecuente y estructura variable —
  clientes, productos agrícolas, agroquímicos, notificaciones y métricas
  de dashboard.

Las tecnologías se separan en carpetas físicas (`sqlserver/`, `mongodb/`),
pero se unifican bajo un único repositorio Git con estrategia GitFlow
institucional (rama `develop` para el trabajo activo del equipo).

---

## Etapa 1: El cimiento arquitectónico

```
ASE251S4_T08-db/
├── .env.example
├── .gitignore
├── README.md
├── docs/
│   ├── architecture.md
│   └── data-ownership.md
├── sqlserver/
│   ├── Dockerfile
│   ├── run.sh
│   ├── bootstrap/
│   ├── changes/
│   ├── checks/
│   └── metadata/
└── mongodb/
    ├── Dockerfile
    ├── run.sh
    ├── bootstrap/
    ├── changes/
    ├── checks/
    └── metadata/
```

Cada motor tiene su propia carpeta raíz con exactamente la misma
estructura interna. Esto hace que el repositorio sea predecible:
cualquier integrante del equipo sabe dónde está cada pieza sin
importar el motor que esté revisando.

---

## Etapa 2: El orden profesional — dependencias bloqueantes

Los scripts dentro de cada motor se numeran para respetar el orden
de dependencias. Un script no puede ejecutarse antes de que existan
los objetos que referencia.

### SQL Server

```
bootstrap/V001__baseline.sql
  └── Crea: BD, schemas, tablas, constraints, índices, vistas, procedures, seed
changes/V002__add_audit_indexes.sql
  └── Requiere: tablas audit_logs y alerts (creadas en V001)
checks/contract.sql
  └── Verifica: tablas, vistas y seed mínimo presentes
```

### MongoDB

```
bootstrap/V001__baseline.js
  └── Crea: colecciones con validadores, índices, seed, schema_changes
changes/V002__add_aggregation_views.js
  └── Requiere: colecciones productos y agrochemicals (creadas en V001)
checks/contract.js
  └── Verifica: colecciones, índices únicos y seed mínimo presentes
```

---

## Etapa 3: La forja de contenedores

En lugar de entregar scripts sueltos, cada motor se empaqueta como
una **imagen Docker independiente y versionada**:

| Paso | Qué ocurre |
|------|-----------|
| **Materia prima** | `Dockerfile` + carpetas `bootstrap/`, `changes/`, `checks/`, `metadata/` |
| **Build** | `docker build` fusiona los scripts con la imagen base del motor |
| **Imagen** | Artefacto sólido, versionado e inmutable (ej. `ase251s4-db-sqlserver:1.0`) |
| **Contenedor** | `docker run` levanta una instancia operativa idéntica en cualquier entorno |

Comandos de build:

```bash
docker build -t ase251s4-db-sqlserver:1.0 ./sqlserver
docker build -t ase251s4-db-mongodb:1.0   ./mongodb
```

---

## Control de versiones del esquema

Cada script aplicado queda registrado en una tabla/colección de control:

- **SQL Server**: `avsa_db.dbo.schema_change`
- **MongoDB**: `db_avsa.schema_changes`

Cada registro guarda: número de secuencia, nombre del script, checksum
SHA-256, commit de Git y versión de la imagen. Si alguien modifica un
script que ya fue ejecutado, el sistema detecta el cambio de checksum y
falla antes de continuar.

---

## Criterios de éxito (prueba funcional)

Una plataforma se considera correctamente implementada cuando cumple
todos los criterios para ambos motores:

| Criterio de éxito | SQL Server | MongoDB |
|---|:---:|:---:|
| Imagen construida exitosamente | ✔ | ✔ |
| Contenedor instanciado y creado | ✔ | ✔ |
| Motor de base de datos activo | ✔ | ✔ |
| Scripts ejecutados lógicamente | ✔ | ✔ |
| Datos iniciales consultables | ✔ | ✔ |

---

## Referencia cruzada entre motores

La referencia entre SQL Server y MongoDB es **lógica, no física**:
las tablas transaccionales guardan un `customer_id` o `producto_id`
como `NVARCHAR(50)` apuntando al `_id` de MongoDB, pero no existe
una FK real entre motores. Esta validación de integridad se resuelve
en el backend Spring WebFlux.

Si el precio de un producto cambia en el catálogo vivo (MongoDB),
los registros históricos en SQL Server (`precio_unitario` ya guardado
en `customer_order_details`) no se alteran: cada transacción conserva
el precio del momento en que ocurrió.
