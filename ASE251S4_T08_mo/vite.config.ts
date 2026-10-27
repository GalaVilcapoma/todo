/**
 * Proxy para desarrollo web.
 *
 * El browser bloquea requests directos a http://192.168.1.84:8081 cuando la
 * app corre en http://localhost:8082 (CORS). Este proxy intercepta todas las
 * llamadas al backend y las reenvía desde Node (que no tiene restricción CORS).
 *
 * Rutas del backend que se proxifican:
 *   /v1/api/*       → agroquímicos, clientes, aplicaciones, pedidos, stock, agregaciones
 *   /api/*          → productos (sin prefijo /v1)
 *   /actuator/*     → health check
 *
 * @type {import('vite').UserConfig}
 */
export default {
  server: {
    proxy: {
      '/v1/api': {
        target: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/actuator': {
        target: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
};
