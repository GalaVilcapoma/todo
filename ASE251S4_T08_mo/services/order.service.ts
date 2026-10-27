import api, { toApiError } from './api.service';
import { ENDPOINTS, ORDER_EDITABLE_STATUSES } from '../constants/config';
import type { Order, OrderInput, OrderStatus } from '../types';

const BASE = ENDPOINTS.ORDERS;

/** `customerId` y `details[].productId` son ObjectIds de MongoDB (string). */
export function isOrderEditable(order: Pick<Order, 'status'>): boolean {
  return order.status !== null && ORDER_EDITABLE_STATUSES.includes(order.status);
}

export function isOrderCancellable(order: Pick<Order, 'status'>): boolean {
  return order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'IN_PROCESS';
}

/**
 * El backend no tiene DELETE para pedidos: cancelar es un cambio de estado a
 * CANCELLED vía PUT /{id}/cancel, que devuelve el stock de cada detalle a
 * MongoDB. Cancelar un pedido entregado o ya cancelado devuelve error.
 */
export const orderService = {
  async getAll(): Promise<Order[]> {
    try {
      const { data } = await api.get<Order[]>(BASE);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getById(id: number): Promise<Order> {
    try {
      const { data } = await api.get<Order>(`${BASE}/${id}`);
      if (data?.id == null) throw new Error('El pedido solicitado no existe.');
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getByNumber(orderNumber: string): Promise<Order> {
    try {
      const { data } = await api.get<Order>(`${BASE}/number/${orderNumber}`);
      if (data?.id == null) throw new Error(`No existe el pedido ${orderNumber}.`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    try {
      const { data } = await api.get<Order[]>(`${BASE}/customer/${customerId}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  /**
   * El cliente debe estar activo, cada producto debe existir y estar activo, la
   * cantidad debe ser positiva y no puede superar el stock disponible: crear el
   * pedido descuenta el stock de cada producto en MongoDB. Los precios y el IGV
   * los calcula el backend, por eso OrderInput no los incluye.
   */
  async create(input: OrderInput): Promise<Order> {
    try {
      const { data } = await api.post<Order>(BASE, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Devuelve el stock de las líneas anteriores y descuenta el nuevo detalle. */
  async update(id: number, input: OrderInput): Promise<Order> {
    try {
      const { data } = await api.put<Order>(`${BASE}/${id}`, input);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** PUT /{id}/status/{status} — valida el valor contra el enum del backend. */
  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    try {
      const { data } = await api.put<Order>(`${BASE}/${id}/status/${status}`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** PUT /{id}/cancel — devuelve el stock al inventario. */
  async cancel(id: number): Promise<Order> {
    try {
      const { data } = await api.put<Order>(`${BASE}/${id}/cancel`);
      return data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export default orderService;