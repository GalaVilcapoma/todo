import api from './api.service';
import { ENDPOINTS } from '../constants/config';

/** Ping de salud del backend. Sirve para el indicador del dashboard. */
export async function checkHealth(): Promise<boolean> {
  try {
    const { data, status } = await api.get<{ status?: string }>(ENDPOINTS.HEALTH, {
      timeout: 6000,
      // Actuator puede responder con content-type vnd.spring-boot.actuator.v3+json;
      // forzar Accept: application/json para que axios lo parsee automáticamente.
      headers: { Accept: 'application/json' },
    });
    // Aceptar cualquier 2xx como señal de que el backend está vivo.
    // Si además devuelve status UP, mejor; pero un 200 sin body ya es suficiente.
    if (status >= 200 && status < 300) return true;
    return data?.status === 'UP';
  } catch {
    // Cualquier fallo (incluido un cuerpo inesperado) significa "no disponible".
    return false;
  }
}

export const healthService = { checkHealth };

export default healthService;
