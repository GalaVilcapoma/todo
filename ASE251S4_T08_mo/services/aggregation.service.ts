import api, { toApiError } from './api.service';
import { ENDPOINTS } from '../constants/config';
import { toNumber } from '../utils/format';
import type { ManufacturerSummary, ProductCategorySummary } from '../types';

const BASE = ENDPOINTS.AGGREGATIONS;

/**
 * Estos endpoints devuelven `Flux<Map<String, Object>>`: la forma exacta la
 * define el pipeline de MongoDB, no un DTO. Se normaliza defensivamente para
 * que un campo ausente o con otro tipo no rompa la pantalla de reportes.
 */
function normalizeCategorySummary(raw: Record<string, unknown>): ProductCategorySummary {
  return {
    category: typeof raw.category === 'string' ? raw.category : null,
    totalProducts: toNumber(raw.totalProducts) ?? 0,
    totalStock: toNumber(raw.totalStock) ?? 0,
    averagePrice: toNumber(raw.averagePrice),
  };
}

function normalizeManufacturerSummary(raw: Record<string, unknown>): ManufacturerSummary {
  return {
    manufacturer: typeof raw.manufacturer === 'string' ? raw.manufacturer : null,
    totalProducts: toNumber(raw.totalProducts) ?? 0,
    categories: Array.isArray(raw.categories)
      ? raw.categories.filter((c): c is string => typeof c === 'string')
      : [],
    averageWaitingDays: toNumber(raw.averageWaitingDays),
  };
}

export const aggregationService = {
  /** Resumen de `products` agrupado por categoría. No filtra por `active`. */
  async productsByCategory(): Promise<ProductCategorySummary[]> {
    try {
      const { data } = await api.get<Record<string, unknown>[]>(
        `${BASE}/productos/por-categoria`,
      );
      return Array.isArray(data) ? data.map(normalizeCategorySummary) : [];
    } catch (error) {
      throw toApiError(error);
    }
  },

  /** Ranking de fabricantes de `agrochemicals`. Sólo cuenta activos. */
  async agrochemicalsByManufacturer(): Promise<ManufacturerSummary[]> {
    try {
      const { data } = await api.get<Record<string, unknown>[]>(
        `${BASE}/agroquimicos/por-fabricante`,
      );
      return Array.isArray(data) ? data.map(normalizeManufacturerSummary) : [];
    } catch (error) {
      throw toApiError(error);
    }
  },
};

export default aggregationService;