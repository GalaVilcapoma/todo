import api, { toApiError } from './api.service';
import { ENDPOINTS } from '../constants/config';
import type { Product, ProductInput } from '../types';

const BASE = ENDPOINTS.PRODUCTS;

export function isProductActive(product: Pick<Product, 'active'>): boolean {
  return product.active === true;
}

/** Stock por debajo del mínimo configurado. */
export function isLowStock(product: Pick<Product, 'currentStock' | 'minimumStock'>): boolean {
  const stock = product.currentStock ?? 0;
  const minimum = product.minimumStock ?? 0;
  return minimum > 0 && stock <= minimum;
}

export const productService = {
  /** Devuelve activos e inactivos; el filtro se aplica en el cliente. */
  async getAll(): Promise<Product[]> {
    try {
      const { data } = await api.get<Product[]>(BASE);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** GET /estado/{true|false} — el path var es un Boolean, no "activo". */
  async getByStatus(status: boolean): Promise<Product[]> {
    try {
      const { data } = await api.get<Product[]>(`${BASE}/estado/${status}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getById(id: string): Promise<Product> {
    try {
      const { data } = await api.get<Product>(`${BASE}/${id}`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * ProductoServiceImpl.validar() rechaza con 400 si falta code, name,
   * category, unitMeasure, unitPrice u origin. Los seis son obligatorios en el
   * formulario.
   */
  async create(input: ProductInput): Promise<Product> {
    try {
      const { data } = await api.post<Product>(BASE, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * `editar()` copia todos los campos del body y sustituye currentStock y
   * minimumStock por 0 cuando llegan nulos. ProductInput siempre los incluye,
   * así que editar no borra datos de stock ni de mínimo.
   */
  async update(id: string, input: ProductInput): Promise<Product> {
    try {
      const { data } = await api.put<Product>(`${BASE}/${id}`, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Soft delete: PATCH /{id}/eliminar */
  async deactivate(id: string): Promise<Product> {
    try {
      const { data } = await api.patch<Product>(`${BASE}/${id}/eliminar`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Soft restore: PATCH /{id}/restaurar */
  async restore(id: string): Promise<Product> {
    try {
      const { data } = await api.patch<Product>(`${BASE}/${id}/restaurar`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export default productService;