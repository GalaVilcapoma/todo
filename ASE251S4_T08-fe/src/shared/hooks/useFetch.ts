import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { ApiErrorResponse } from '../types/api';

interface AxiosLikeError {
  response?: { data?: ApiErrorResponse };
  message?: string;
}

export const useFetch = <T,>(fetchFunction: () => Promise<T>, dependencies: unknown[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      const apiError = err as AxiosLikeError;
      setError(apiError.response?.data?.message || apiError.message || 'Error al obtener datos');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    void refetch();
    // Las dependencias las controla el consumidor del hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch,
    setData: setData as Dispatch<SetStateAction<T | null>>,
  };
};

export default useFetch;
