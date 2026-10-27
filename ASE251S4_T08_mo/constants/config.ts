/**
 * Configuración de red y catálogos de la app.
 *
 * La URL del backend se toma de EXPO_PUBLIC_API_URL. Los valores por defecto
 * corresponden al entorno de desarrollo local:
 *  - Emulador Android : 10.0.2.2 es el alias del host dentro del emulador.
 *  - iOS Simulator    : localhost.
 *  - Dispositivo real : IP LAN del equipo que corre el backend (ver README).
 *  - Web (browser)    : string vacío — las rutas son relativas y el proxy de
 *                       vite.config.ts las redirige al backend sin CORS.
 */
import { Platform } from 'react-native';

/**
 * En web (Expo corriendo en browser via Metro), se usa localhost:8081 directamente.
 * El CorsConfig del backend acepta cualquier origen en desarrollo, así que no hay
 * bloqueo CORS. El vite.config.ts con proxy no aplica aquí porque Expo usa Metro, no Vite.
 *
 * En móvil/emulador, se usa la IP configurada en EXPO_PUBLIC_API_URL.
 */
export const API_BASE_URL =
  Platform.OS === 'web'
    ? (process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:8081')
    : (process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://10.0.2.2:8081');

export const API_TIMEOUT = 15000;

export const STORAGE_KEYS = {
  SESSION: 'avsa_session',
} as const;

/**
 * Rutas exactas del backend. No hay context-path, así que arrancan en la raíz.
 * Nota: `/api/productos` es la única sin prefijo `/v1` y usa verbos en
 * español; el resto usa `/v1/api/*`. No unificar.
 */
export const ENDPOINTS = {
  AGROCHEMICALS: '/v1/api/agrochemicals',
  CUSTOMERS: '/v1/api/customer',
  PRODUCTS: '/api/productos',
  APPLICATIONS: '/v1/api/agrochemical-applications', // ruta correcta del S4 Spring WebFlux
  ORDERS: '/v1/api/customer-orders',
  STOCK_MOVEMENTS: '/v1/api/stock-movements',
  AGGREGATIONS: '/v1/api/aggregations',
  HEALTH: '/actuator/health',
} as const;

export const AGRO_CATEGORIES = [
  { value: 'INSECTICIDE', label: 'Insecticida' },
  { value: 'FUNGICIDE', label: 'Fungicida' },
  { value: 'HERBICIDE', label: 'Herbicida' },
  { value: 'FERTILIZER', label: 'Fertilizante' },
  { value: 'BIOSTIMULANT', label: 'Bioestimulante' },
  { value: 'OTHER', label: 'Otro' },
] as const;

/**
 * `ProductoServiceImpl.validar()` sólo exige que la unidad no esté vacía: es
 * texto libre. Se usan los valores del seed para que al editar un producto
 * existente el select muestre su unidad real.
 */
export const UNIT_MEASURE_OPTIONS = [
  { value: 'Litros', label: 'Litros' },
  { value: 'Kilogramos', label: 'Kilogramos' },
  { value: 'Unidades', label: 'Unidades' },
  { value: 'Sacos', label: 'Sacos' },
  { value: 'Cajas', label: 'Cajas' },
  { value: 'Quintales', label: 'Quintales' },
  { value: 'Clamshell', label: 'Clamshell' },
] as const;

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  IN_PROCESS: 'En proceso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_PROCESS: 'En proceso',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

/**
 * Transiciones de estado expuestas en la UI. El backend acepta cualquier valor
 * del enum vía PUT /{id}/status/{status}, pero desde el móvil sólo tiene
 * sentido ofrecer el avance natural del ciclo.
 */
export const ORDER_NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROCESS', 'CANCELLED'],
  IN_PROCESS: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** Estados desde los que el backend todavía permite editar un pedido. */
export const ORDER_EDITABLE_STATUSES: string[] = ['PENDING', 'CONFIRMED', 'IN_PROCESS'];

/** Estados desde los que el backend todavía permite editar una aplicación. */
export const APPLICATION_EDITABLE_STATUSES: string[] = ['SCHEDULED', 'IN_PROCESS'];

/** Motivos sugeridos para movimientos de stock (el backend no los valida). */
export const MOVEMENT_REASONS = [
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'SALE', label: 'Venta' },
  { value: 'RETURN', label: 'Devolución' },
  { value: 'ADJUSTMENT', label: 'Ajuste de inventario' },
  { value: 'PRODUCTION', label: 'Producción' },
] as const;

export const WIND_CONDITIONS = [
  { value: 'LIGHT', label: 'Leve' },
  { value: 'MODERATE', label: 'Moderado' },
  { value: 'STRONG', label: 'Fuerte' },
  { value: 'CALM', label: 'Calma' },
] as const;