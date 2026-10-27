import api, { toApiError } from './api.service';
import { ENDPOINTS } from '../constants/config';
import type { MovementType, StockMovement, StockMovementInput } from '../types';

const BASE = ENDPOINTS.STOCK_MOVEMENTS;

/**
 * Registrar un movimiento actualiza `products.currentStock` en MongoDB, así que
 * la lista de productos queda desactualizada en la app y conviene refrescarla.
 */
export const stockMovementService = {
  async getAll(): Promise<StockMovement[]> {
    try {
      const { data } = await api.get<StockMovement[]>(BASE);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Ojo: el path var usa "producto" en español. */
  async getByProduct(productId: string): Promise<StockMovement[]> {
    try {
      const { data } = await api.get<StockMovement[]>(`${BASE}/producto/${productId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getByType(movementType: MovementType): Promise<StockMovement[]> {
    try {
      const { data } = await api.get<StockMovement[]>(`${BASE}/tipo/${movementType}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getById(id: number): Promise<StockMovement> {
    try {
      const { data } = await api.get<StockMovement>(`${BASE}/${id}`);
      if (data?.id == null) throw new Error('El movimiento solicitado no existe.');
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * POST /in — suma stock. El tipo de movimiento lo fija el endpoint, por eso
   * StockMovementInput no lo incluye.
   */
  async registerIn(input: StockMovementInput): Promise<StockMovement> {
    try {
      const { data } = await api.post<StockMovement>(`${BASE}/in`, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** POST /out — resta stock y falla si no hay cantidad suficiente. */
  async registerOut(input: StockMovementInput): Promise<StockMovement> {
    try {
      const { data } = await api.post<StockMovement>(`${BASE}/out`, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export default stockMovementService;