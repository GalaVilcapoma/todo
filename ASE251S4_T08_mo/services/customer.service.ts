import api, { toApiError } from './api.service';
import { ENDPOINTS } from '../constants/config';
import type { Customer, CustomerInput, CustomerState } from '../types';

const BASE = ENDPOINTS.CUSTOMERS;

/**
 * El estado real del cliente es `state` ("A" / "I"). El campo `active` existe
 * en el modelo pero el backend nunca lo escribe, así que siempre llega null y
 * usarlo como fuente de verdad marca como inactivos a todos los clientes.
 */
export function isCustomerActive(customer: Pick<Customer, 'state' | 'active'>): boolean {
  return customer.state === 'A';
}

export const customerService = {
  async getAll(): Promise<Customer[]> {
    try {
      const { data } = await api.get<Customer[]>(BASE);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** GET /state/{A|I} */
  async getByState(state: CustomerState): Promise<Customer[]> {
    try {
      const { data } = await api.get<Customer[]>(`${BASE}/state/${state}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * CustomerRest.findById no usa switchIfEmpty: un id inexistente responde 200
   * con cuerpo vacío en lugar de 404. Se rechaza explícitamente para no
   * devolver un undefined silencioso.
   */
  async getById(id: string): Promise<Customer> {
    try {
      const { data } = await api.get<Customer>(`${BASE}/${id}`);
      if (!data?.id) throw new Error('El cliente solicitado no existe.');
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Devuelve HTTP 200 (el controlador no declara @ResponseStatus). */
  async create(input: CustomerInput): Promise<Customer> {
    try {
      const { data } = await api.post<Customer>(BASE, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async update(id: string, input: CustomerInput): Promise<Customer> {
    try {
      const { data } = await api.put<Customer>(`${BASE}/${id}`, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Soft delete: PATCH /delete/{id} (orden inverso al de agroquímicos). */
  async deactivate(id: string): Promise<Customer> {
    try {
      const { data } = await api.patch<Customer>(`${BASE}/delete/${id}`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Soft restore: PATCH /restore/{id} */
  async restore(id: string): Promise<Customer> {
    try {
      const { data } = await api.patch<Customer>(`${BASE}/restore/${id}`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export default customerService;