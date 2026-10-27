import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL } from '../constants/config';
import {
  aggregationService,
  agrochemicalService,
  applicationService,
  checkHealth,
  customerService,
  isCustomerActive,
  isProductActive,
  orderService,
  productService,
} from '../services';
import { isLowStock } from '../services/product.service';
import type {
  Agrochemical,
  Application,
  Customer,
  ManufacturerSummary,
  Order,
  Product,
  ProductCategorySummary,
} from '../types';

export interface DashboardSnapshot {
  products: Product[];
  agrochemicals: Agrochemical[];
  customers: Customer[];
  orders: Order[];
  applications: Application[];
  productCategories: ProductCategorySummary[];
  manufacturers: ManufacturerSummary[];
}

export interface DashboardMetrics {
  activeProducts: number;
  totalStockUnits: number;
  lowStock: Product[];
  activeCustomers: number;
  activeAgrochemicals: number;
  openOrders: number;
  pendingRevenue: number;
  scheduledApplications: number;
}

const EMPTY: DashboardSnapshot = {
  products: [],
  agrochemicals: [],
  customers: [],
  orders: [],
  applications: [],
  productCategories: [],
  manufacturers: [],
};

/**
 * Carga agregada del dashboard.
 *
 * Cada recurso se pide por separado y se resuelve con allSettled: si el
 * endpoint de pedidos falla, el dashboard sigue mostrando inventario y
 * agroquímicos en lugar de quedarse en blanco.
 */
function loadSnapshot(): Promise<DashboardSnapshot> {
  return Promise.allSettled([
    productService.getAll(),
    agrochemicalService.getAll(),
    customerService.getAll(),
    orderService.getAll(),
    applicationService.getAll(),
  ]).then((results) => ({
    products: valueOf(results[0], []),
    agrochemicals: valueOf(results[1], []),
    customers: valueOf(results[2], []),
    orders: valueOf(results[3], []),
    applications: valueOf(results[4], []),
    productCategories: [],
    manufacturers: [],
  }));
}

function valueOf<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export function useDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [next, isUp, categories, manufacturers] = await Promise.allSettled([
        loadSnapshot(),
        checkHealth(),
        aggregationService.productsByCategory(),
        aggregationService.agrochemicalsByManufacturer(),
      ]);

      if (!mounted.current) return;
      if (next.status === 'rejected') {
        const reason = next.reason;
        throw reason instanceof Error && reason.message
          ? reason
          : new Error(
              `No se pudo cargar el resumen. Verifica que el backend (${API_BASE_URL}) esté encendido y accesible.`,
            );
      }
      // Las agregaciones son el respaldo visual del dashboard; si fallan se
      // omiten sin romper el resto.
      setSnapshot({
        ...next.value,
        productCategories: valueOf(categories, []),
        manufacturers: valueOf(manufacturers, []),
      });
      // isUp ya es PromiseSettledResult<boolean> — valueOf lo resuelve sin cast.
      // Si checkHealth falla pero los datos cargaron, el backend está activo.
      const healthResult = valueOf(isUp, false);
      const dataLoaded =
        next.status === 'fulfilled' &&
        (next.value.products.length > 0 ||
          next.value.agrochemicals.length > 0 ||
          next.value.customers.length > 0 ||
          next.value.orders.length > 0);
      setOnline(healthResult || dataLoaded);
    } catch (e) {
      if (!mounted.current) return;
      setError(
        e instanceof Error && e.message
          ? e.message
          : 'No se pudo cargar el resumen del sistema.',
      );
      setOnline(false);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // Ver la nota equivalente en hooks/use-resource.ts: es la carga inicial
    // del hook y los setState iniciales no provocan render en cascada.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load('initial');
  }, [load]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const activeProducts = snapshot.products.filter(isProductActive);
    return {
      activeProducts: activeProducts.length,
      totalStockUnits: activeProducts.reduce((sum, p) => sum + (p.currentStock ?? 0), 0),
      lowStock: activeProducts
        .filter(isLowStock)
        .sort((a, b) => (a.currentStock ?? 0) - (b.currentStock ?? 0)),
      activeCustomers: snapshot.customers.filter(isCustomerActive).length,
      activeAgrochemicals: snapshot.agrochemicals.filter((a) => a.active === true).length,
      openOrders: snapshot.orders.filter(
        (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED',
      ).length,
      pendingRevenue: snapshot.orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (o.total ?? 0), 0),
      scheduledApplications: snapshot.applications.filter(
        (a) => a.status === 'SCHEDULED' || a.status === 'IN_PROCESS',
      ).length,
    };
  }, [snapshot]);

  return {
    ...snapshot,
    metrics,
    loading,
    refreshing,
    online,
    error,
    refresh: () => load('refresh'),
  };
}

export default useDashboard;