import { create, isAxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';

/**
 * Error de negocio con el mensaje que se muestra al usuario.
 *
 * El backend no usa @ControllerAdvice: los errores llegan como el cuerpo
 * estándar de Spring WebFlux (`{"status":..,"error":..,"message":..}`), como
 * un `{"error": "..."}` en los PATCH de agroquímicos que capturan su propia
 * excepción, o como texto plano. `extractServerMessage` recorre esas variantes.
 */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const GENERIC_ERROR = 'Ocurrió un error inesperado. Intenta de nuevo.';

function extractServerMessage(data: unknown): string | null {
  if (typeof data === 'string') {
    const text = data.trim();
    // WebFlux devuelve HTML para algunos errores; no es útil mostrarlo.
    return text && !text.startsWith('<') ? text : null;
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of ['message', 'error', 'detail'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value.trim() !== '') return value.trim();
    }
  }
  return null;
}

/**
 * Traduce cualquier fallo de axios a un ApiError con mensaje presentable.
 * Se exporta para que las capas superiores no dependan de axios.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const { response, code, message } = error;

    if (code === 'ECONNABORTED') {
      return new ApiError('La solicitud tardó demasiado. Revisa tu conexión.', response?.status);
    }
    if (!response) {
      // Sin respuesta: servidor apagado, IP incorrecta o sin red.
      return new ApiError(
        `No se pudo conectar con el servidor (${API_BASE_URL}). Verifica que el backend esté encendido y que la URL en .env sea correcta.`,
      );
    }

    const serverMessage = extractServerMessage(response.data);
    if (serverMessage) return new ApiError(serverMessage, response.status);

    const byStatus: Record<number, string> = {
      400: 'Los datos enviados son inválidos. Revisa el formulario.',
      401: 'No autorizado.',
      403: 'No tienes permisos para esta acción.',
      404: 'El recurso no existe o fue eliminado.',
      409: 'La operación entra en conflicto con el estado actual.',
      500: 'Error interno del servidor.',
      502: 'El servidor no responde correctamente.',
      503: 'El servidor no está disponible en este momento.',
    };
    return new ApiError(byStatus[response.status] ?? message ?? GENERIC_ERROR, response.status);
  }

  if (error instanceof Error && error.message) return new ApiError(error.message);
  return new ApiError(GENERIC_ERROR);
}

const api = create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

/**
 * El backend (ASE251S4_T08-be) no tiene spring-security: no hay
 * SecurityConfig, ni filtro de Bearer, ni endpoint de login. Todos los
 * controladores son públicos, por lo que enviar un Authorization ficticio sólo
 * añadiría ruido a las peticiones.
 */

export default api;