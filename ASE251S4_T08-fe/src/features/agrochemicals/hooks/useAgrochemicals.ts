import { useCallback, useEffect, useState } from 'react';
import agrochemicalApi from '../api/agrochemicalApi';
import type { Agrochemical, AgrochemicalPayload } from '../types';
import { getApiErrorMessage } from '../../../shared/api/getApiErrorMessage';
import type { MutationResult } from '../../../shared/types/api';

export const useAgrochemicals = () => {
  const [agrochemicals, setAgrochemicals] = useState<Agrochemical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgrochemicals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await agrochemicalApi.getAll();
      setAgrochemicals(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar agroquímicos'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAgrochemicals();
  }, [fetchAgrochemicals]);

  const addAgrochemical = async (
    data: AgrochemicalPayload,
  ): Promise<MutationResult<Agrochemical>> => {
    try {
      const created = await agrochemicalApi.create(data);
      setAgrochemicals((prev) => [...prev, created]);
      return { success: true, data: created };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al crear agroquímico') };
    }
  };

  const updateAgrochemical = async (
    id: string,
    data: AgrochemicalPayload,
  ): Promise<MutationResult<Agrochemical>> => {
    try {
      const updated = await agrochemicalApi.update(id, data);
      setAgrochemicals((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al actualizar agroquímico') };
    }
  };

  const removeAgrochemical = async (id: string): Promise<MutationResult<void>> => {
    try {
      await agrochemicalApi.remove(id);
      setAgrochemicals((prev) => prev.map((item) => (item.id === id ? { ...item, active: false } : item)));
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al desactivar agroquímico') };
    }
  };

  const restoreAgrochemical = async (id: string): Promise<MutationResult<void>> => {
    try {
      await agrochemicalApi.restore(id);
      setAgrochemicals((prev) => prev.map((item) => (item.id === id ? { ...item, active: true } : item)));
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al restaurar agroquímico') };
    }
  };

  return {
    agrochemicals,
    loading,
    error,
    refetch: fetchAgrochemicals,
    addAgrochemical,
    updateAgrochemical,
    removeAgrochemical,
    restoreAgrochemical,
  };
};

export default useAgrochemicals;
