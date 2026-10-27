import api from '../../../shared/api/axiosConfig';
import type { Agrochemical, AgrochemicalPayload } from '../types';

const ENDPOINT = '/v1/api/agrochemicals';

export const agrochemicalApi = {
  getAll: async (): Promise<Agrochemical[]> => {
    const response = await api.get<Agrochemical[]>(ENDPOINT);
    return response.data;
  },

  getActive: async (): Promise<Agrochemical[]> => {
    const response = await api.get<Agrochemical[]>(`${ENDPOINT}/active`);
    return response.data;
  },

  getInactive: async (): Promise<Agrochemical[]> => {
    const response = await api.get<Agrochemical[]>(`${ENDPOINT}/inactive`);
    return response.data;
  },

  getById: async (id: string): Promise<Agrochemical> => {
    const response = await api.get<Agrochemical>(`${ENDPOINT}/${id}`);
    return response.data;
  },

  create: async (data: AgrochemicalPayload): Promise<Agrochemical> => {
    const response = await api.post<Agrochemical>(ENDPOINT, data);
    return response.data;
  },

  update: async (id: string, data: AgrochemicalPayload): Promise<Agrochemical> => {
    const response = await api.put<Agrochemical>(`${ENDPOINT}/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<unknown> => {
    const response = await api.patch(`${ENDPOINT}/${id}/delete`);
    return response.data;
  },

  restore: async (id: string): Promise<unknown> => {
    const response = await api.patch(`${ENDPOINT}/${id}/restore`);
    return response.data;
  },
};

export default agrochemicalApi;
