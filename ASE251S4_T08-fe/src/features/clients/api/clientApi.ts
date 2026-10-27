import api from '../../../shared/api/axiosConfig';
import type { Client, ClientPayload } from '../types';

const ENDPOINT = '/v1/api/customer';

export const clientApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get<Client[]>(ENDPOINT);
    return response.data;
  },

  getByState: async (state: string): Promise<Client[]> => {
    const response = await api.get<Client[]>(`${ENDPOINT}/state/${state}`);
    return response.data;
  },

  getById: async (id: string): Promise<Client> => {
    const response = await api.get<Client>(`${ENDPOINT}/${id}`);
    return response.data;
  },

  create: async (data: ClientPayload): Promise<Client> => {
    const response = await api.post<Client>(ENDPOINT, data);
    return response.data;
  },

  update: async (id: string, data: ClientPayload): Promise<Client> => {
    const response = await api.put<Client>(`${ENDPOINT}/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<unknown> => {
    const response = await api.patch(`${ENDPOINT}/delete/${id}`);
    return response.data;
  },

  restore: async (id: string): Promise<unknown> => {
    const response = await api.patch(`${ENDPOINT}/restore/${id}`);
    return response.data;
  },
};

export default clientApi;
