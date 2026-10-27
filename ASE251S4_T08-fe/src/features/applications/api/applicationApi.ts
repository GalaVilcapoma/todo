import api from '../../../shared/api/axiosConfig';
import type { Application, ApplicationPayload } from '../types';

const ENDPOINT = '/v1/api/agrochemical-applications';

export const applicationApi = {
  getAll: async (): Promise<Application[]> => {
    const response = await api.get<Application[]>(ENDPOINT);
    return response.data;
  },

  getById: async (id: string): Promise<Application> => {
    const response = await api.get<Application>(`${ENDPOINT}/${id}`);
    return response.data;
  },

  create: async (data: ApplicationPayload): Promise<Application> => {
    const response = await api.post<Application>(ENDPOINT, data);
    return response.data;
  },

  update: async (id: string, data: ApplicationPayload): Promise<Application> => {
    const response = await api.put<Application>(`${ENDPOINT}/${id}`, data);
    return response.data;
  },
};

export default applicationApi;
