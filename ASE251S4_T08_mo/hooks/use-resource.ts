import { useCallback, useEffect, useRef, useState } from 'react';
import { hapticError, hapticSuccess } from '../utils/haptics';
import type { ApiResult } from '../types';

/**
 * Extrae un mensaje presentable de cualquier excepción, sin que la pantalla
 * tenga que conocer axios.
 */
export function messageOf(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

interface ListOptions<T> {
  /** Etiqueta usada en los mensajes de error. */
  label: string;
  list: () => Promise<T[]>;
  /** false evita un parpadeo de "cargando" en la primera carga. */
  initialLoading?: boolean;
}

/**
 * Los maestros de MongoDB usan ObjectId (string) y los recursos
 * transaccionales de R2DBC usan Long (number), así que el id es genérico.
 */
export type ResourceId = string | number;

export interface ResourceState<T> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface CrudResource<T, TInput, Id extends ResourceId = string>
  extends ResourceState<T> {
  create: (input: TInput) => Promise<ApiResult<T>>;
  update: (id: Id, input: TInput) => Promise<ApiResult<T>>;
}

/**
 * Hook de listado con recarga, error normalizado y control de montaje.
 *
 * Se usa tal cual para recursos de sólo lectura (aplicaciones, pedidos,
 * movimientos). Para recursos con escritura, ver `useCrudResource`.
 */
export function useResource<T>({ label, list, initialLoading = true }: ListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await list();
      if (mounted.current) setItems(data);
    } catch (e) {
      if (mounted.current) {
        setError(messageOf(e, `No se pudieron cargar los ${label}.`));
        hapticError();
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
    // `list` viene de un servicio con referencia estable.
  }, [list, label]);

  useEffect(() => {
    // La carga inicial es precisamente el efecto de montaje de un hook de
    // datos. Los dos `setState` iniciales (loading ya vale `true` y error ya
    // vale `null`) son no-ops y React hace bailout, así que no hay render en
    // cascada; el error solo aparece al recargar a mano.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return { items, setItems, loading, error, refetch };
}

/**
 * Hook de listado + alta / edición / baja lógica.
 *
 * Tras cada mutación se recarga la lista desde el servidor en lugar de parchear
 * el estado local: el backend calcula `active`, `state`, `createdAt` y otros
 * campos en cada escritura, y un parche optimista los desincronizaría.
 */
export function useCrudResource<T, TInput, Id extends ResourceId = string>({
  label,
  list,
  create: createRequest,
  update: updateRequest,
  initialLoading = true,
}: ListOptions<T> & {
  create: (input: TInput) => Promise<T>;
  update: (id: Id, input: TInput) => Promise<T>;
}): CrudResource<T, TInput, Id> {
  const base = useResource<T>({ label, list, initialLoading });

  const create = useCallback(
    async (input: TInput): Promise<ApiResult<T>> => {
      try {
        const created = await createRequest(input);
        await base.refetch();
        hapticSuccess();
        return { success: true, data: created };
      } catch (e) {
        hapticError();
        return { success: false, error: messageOf(e, `No se pudo crear ${label}.`) };
      }
    },
    [createRequest, base, label],
  );

  const update = useCallback(
    async (id: Id, input: TInput): Promise<ApiResult<T>> => {
      try {
        const updated = await updateRequest(id, input);
        await base.refetch();
        hapticSuccess();
        return { success: true, data: updated };
      } catch (e) {
        hapticError();
        return { success: false, error: messageOf(e, `No se pudo actualizar ${label}.`) };
      }
    },
    [updateRequest, base, label],
  );

  return { ...base, create, update };
}

/**
 * Hook de baja / restauración lógica para los maestros de MongoDB.
 *
 * No lleva estado propio: delega en `refetch` para volver a pedir la lista
 * completa después de cada operación, que es la fuente de verdad.
 */
export function useSoftDelete<Id extends ResourceId = string>({
  deactivate: deactivateRequest,
  restore: restoreRequest,
  refetch,
}: {
  deactivate: (id: Id) => Promise<unknown>;
  restore: (id: Id) => Promise<unknown>;
  refetch: () => Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<Id | null>(null);

  const deactivate = useCallback(
    async (id: Id): Promise<ApiResult<void>> => {
      setPendingId(id);
      try {
        await deactivateRequest(id);
        await refetch();
        hapticSuccess();
        return { success: true };
      } catch (e) {
        hapticError();
        return { success: false, error: messageOf(e, 'No se pudo desactivar el registro.') };
      } finally {
        setPendingId(null);
      }
    },
    [deactivateRequest, refetch],
  );

  const restore = useCallback(
    async (id: Id): Promise<ApiResult<void>> => {
      setPendingId(id);
      try {
        await restoreRequest(id);
        await refetch();
        hapticSuccess();
        return { success: true };
      } catch (e) {
        hapticError();
        return { success: false, error: messageOf(e, 'No se pudo restaurar el registro.') };
      } finally {
        setPendingId(null);
      }
    },
    [restoreRequest, refetch],
  );

  return { deactivate, restore, pendingId };
}

export default useResource;