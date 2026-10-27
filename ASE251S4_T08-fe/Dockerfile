# Dockerfile Global para Frontend React + TypeScript + Vite
# Este Dockerfile es compartido por todo el equipo

# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --silent

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Etapa 2: Producción con Nginx
FROM nginx:1.25-alpine

# Copiar configuración de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Al iniciar, inyecta la variable de entorno API_URL en config.js y levanta Nginx
CMD ["/bin/sh", "-c", "if [ -n \"$API_URL\" ]; then echo \"window.API_URL = '$API_URL';\" > /usr/share/nginx/html/config.js; fi && nginx -g 'daemon off;'"]

