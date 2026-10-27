# ASE251S4_T08-fe - Frontend AVSA

Aplicación React + Vite para la gestión de agroquímicos, aplicaciones de campo, productos y clientes del proyecto AVSA.

## Stack

- React 19 + React Router 7.
- TypeScript con verificación estricta.
- Vite 8.
- Tailwind CSS 4.
- Axios para el consumo de APIs.
- Lucide React para iconografía.
- Oxlint para análisis estático.

## Arquitectura Feature-Based

```text
src/
  app/
    App.tsx
    providers/AuthProvider.tsx
  features/
    agrochemicals/
      api/ components/ hooks/ pages/ types.ts
    applications/
      api/ pages/ types.ts
    clients/
      api/ components/ hooks/ pages/ types.ts
    products/
      api/ pages/ types.ts
    home/
      pages/
  shared/
    api/ components/ hooks/ types/ utils/
```

Cada funcionalidad agrupa su API, tipos, hooks, componentes y páginas. Los elementos reutilizables viven en `shared`.

## Módulos

| Módulo | Ruta | Descripción |
|---|---|---|
| Inicio | `/` | Panel de acceso a los módulos. |
| Agroquímicos | `/agrochemicals` | CRUD con validación SENASA, carencia y categoría. |
| Aplicaciones | `/applications` | Registro de aplicaciones de campo. |
| Productos | `/productos` | Inventario con stock, precio y unidad de medida. |
| Clientes | `/clients` | CRUD de clientes con DNI/RUC y contacto. |

## Instalación

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`.

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run typecheck  # Verificación TypeScript
npm run lint       # Oxlint
npm run build      # Typecheck + build de producción
npm run preview    # Vista previa del build
```

## Configuración de la API

El frontend resuelve la URL del backend en este orden:

1. `window.API_URL`, inyectado en runtime por `config.js`.
2. `VITE_API_URL`, inyectado en build time.
3. `http://localhost:8081`.

En desarrollo se puede crear un archivo `.env`:

```env
VITE_API_URL=http://localhost:8081
```

En Docker/Kubernetes, `docker-entrypoint.sh` genera `/config.js` usando la variable de entorno `API_URL`:

```bash
docker run -e API_URL=http://<IP_BACKEND>:30005 -p 80:80 alexandraquispe/avsa-frontend:1.0
```

## Docker y Kubernetes

- Docker: `dockerfile-PierreConca/Dockerfile`.
- Imagen: `alexandraquispe/avsa-frontend:1.0`.
- Manifiestos centralizados en `ASE251S4_T08-be/manifest-alexandraquispe/`.
- El contenedor sirve el build con Nginx y genera `config.js` al arrancar.
- El Service expone el frontend por NodePort `30080`.

## Estado de verificación

| Verificación | Resultado |
|---|---|
| `npm run typecheck` | Correcto |
| `npm run build` | Correcto |
| `npm run lint` | Sin errores; quedan advertencias de React Hooks |
| Imagen Docker `1.0` | Construida correctamente |
| Smoke test del contenedor | `/`, `/config.js` y ruta SPA responden `200`; `config.js` usa `API_URL` |
| Ejecución con backend activo | Pendiente: requiere backend y base de datos |

No se han ejecutado pruebas end-to-end contra el backend en este entorno.
