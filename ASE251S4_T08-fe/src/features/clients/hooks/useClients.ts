import { useCallback, useEffect, useState } from 'react';
import clientApi from '../api/clientApi';
import type { Client, ClientPayload } from '../types';
import { getApiErrorMessage } from '../../../shared/api/getApiErrorMessage';
import type { MutationResult } from '../../../shared/types/api';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientApi.getAll();
      setClients(data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar clientes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  const addClient = async (clientData: ClientPayload): Promise<MutationResult<Client>> => {
    try {
      const newClient = await clientApi.create(clientData);
      setClients((prev) => [...prev, newClient]);
      return { success: true, data: newClient };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al crear cliente') };
    }
  };

  const updateClient = async (
    id: string,
    clientData: ClientPayload,
  ): Promise<MutationResult<Client>> => {
    try {
      const updated = await clientApi.update(id, clientData);
      setClients((prev) => prev.map((client) => (client.id === id ? updated : client)));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al actualizar cliente') };
    }
  };

  const removeClient = async (id: string): Promise<MutationResult<void>> => {
    try {
      await clientApi.remove(id);
      setClients((prev) => prev.map((client) => (client.id === id ? { ...client, active: false } : client)));
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al desactivar cliente') };
    }
  };

  const restoreClient = async (id: string): Promise<MutationResult<void>> => {
    try {
      await clientApi.restore(id);
      setClients((prev) => prev.map((client) => (client.id === id ? { ...client, active: true } : client)));
      return { success: true };
    } catch (err) {
      return { success: false, error: getApiErrorMessage(err, 'Error al restaurar cliente') };
    }
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    addClient,
    updateClient,
    removeClient,
    restoreClient,
  };
};

export default useClients;
