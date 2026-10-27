import api from '../../../shared/api/axiosConfig';
import type { Producto, ProductoPayload } from '../types';

const ENDPOINT = '/api/productos';

export const productoApi = {
  getAll: async (): Promise<Producto[]> => {
    const response = await api.get<Producto[]>(ENDPOINT);
    return response.data;
  },

  getByEstado: async (estado: string): Promise<Producto[]> => {
    const response = await api.get<Producto[]>(`${ENDPOINT}/estado/${estado}`);
    return response.data;
  },

  getById: async (id: string): Promise<Producto> => {
    const response = await api.get<Producto>(`${ENDPOINT}/${id}`);
    return response.data;
  },

  create: async (data: ProductoPayload): Promise<Producto> => {
    const response = await api.post<Producto>(ENDPOINT, data);
    return response.data;
  },

  update: async (id: string, data: ProductoPayload): Promise<Producto> => {
    const response = await api.put<Producto>(`${ENDPOINT}/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<unknown> => {
    const response = await api.patch(`${ENDPOINT}/${id}/eliminar`);
    return response.data;
  },

  restore: async (id: string): Promise<unknown> => {
    const response = await api.patch(`${ENDPOINT}/${id}/restaurar`);
    return response.data;
  },
};

export default productoApi;
