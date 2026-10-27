import api, { ApiError, toApiError } from './api.service';
import { ENDPOINTS } from '../constants/config';
import type { Agrochemical, AgrochemicalInput } from '../types';

const BASE = ENDPOINTS.AGROCHEMICALS;

/**
 * AgrochemicalRest.delete/restore envuelven su handler en onErrorResume, así
 * que un fallo devuelve HTTP 200 con cuerpo {"error": "..."}. Sin esta
 * comprobación el borrado aparecería como exitoso aunque no ocurriera.
 */
async function assertNoEmbeddedError(data: unknown): Promise<void> {
  if (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) {
    const message = (data as Record<string, unknown>).error;
    throw new ApiError(typeof message === 'string' ? message : 'La operación falló.');
  }
}

export const agrochemicalService = {
  /** Devuelve activos e inactivos; el filtro se aplica en el cliente. */
  async getAll(): Promise<Agrochemical[]> {
    try {
      const { data } = await api.get<Agrochemical[]>(BASE);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getActive(): Promise<Agrochemical[]> {
    try {
      const { data } = await api.get<Agrochemical[]>(`${BASE}/active`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getById(id: string): Promise<Agrochemical> {
    try {
      const { data } = await api.get<Agrochemical>(`${BASE}/${id}`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async create(input: AgrochemicalInput): Promise<Agrochemical> {
    try {
      const { data } = await api.post<Agrochemical>(BASE, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async update(id: string, input: AgrochemicalInput): Promise<Agrochemical> {
    try {
      const { data } = await api.put<Agrochemical>(`${BASE}/${id}`, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Soft delete: PATCH /{id}/delete */
  async deactivate(id: string): Promise<void> {
    try {
      const { data } = await api.patch(`${BASE}/${id}/delete`);
      await assertNoEmbeddedError(data);
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Soft restore: PATCH /{id}/restore */
  async restore(id: string): Promise<void> {
    try {
      const { data } = await api.patch(`${BASE}/${id}/restore`);
      await assertNoEmbeddedError(data);
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export default agrochemicalService;