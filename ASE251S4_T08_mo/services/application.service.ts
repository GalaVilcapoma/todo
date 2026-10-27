import api, { toApiError } from './api.service';
import { ENDPOINTS, APPLICATION_EDITABLE_STATUSES } from '../constants/config';
import type { Application, ApplicationInput } from '../types';

const BASE = ENDPOINTS.APPLICATIONS;

/**
 * El backend devuelve headers R2DBC con id numérico (Long), a diferencia del
 * resto de módulos maestro que usan ObjectId de MongoDB.
 */
export function isApplicationEditable(application: Pick<Application, 'status'>): boolean {
  return application.status !== null && APPLICATION_EDITABLE_STATUSES.includes(application.status);
}

export const applicationService = {
  /**
   * AgrochemicalApplicationService.listAll() termina en
   * onErrorResume(e -> Flux.empty()), así que un fallo del servidor se
   * manifiesta como una lista vacía y no como un error HTTP.
   */
  async getAll(): Promise<Application[]> {
    try {
      const { data } = await api.get<Application[]>(BASE);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** findById no usa switchIfEmpty: un id inexistente da 200 con cuerpo vacío. */
  async getById(id: number): Promise<Application> {
    try {
      const { data } = await api.get<Application>(`${BASE}/${id}`);
      if (data?.id == null) throw new Error('La aplicación solicitada no existe.');
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * El servicio rechaza el guardado si `details` llega vacío, si algún
   * agroquímico está inactivo o no existe, si `appliedDose` no está en
   * (0, maxDose] o si `treatedAreaHectares` no es positivo.
   */
  async create(input: ApplicationInput): Promise<Application> {
    try {
      const { data } = await api.post<Application>(BASE, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** El PUT reemplaza por completo el detalle; no se puede editar COMPLETED ni CANCELLED. */
  async update(id: number, input: ApplicationInput): Promise<Application> {
    try {
      const { data } = await api.put<Application>(`${BASE}/${id}`, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export default applicationService;