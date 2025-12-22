// ===========================================
// React Hooks for API Data Fetching
// ===========================================

import { useState, useEffect, useCallback } from 'react';
import { ApiError } from './api-client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

/**
 * Generic hook for API calls with loading and error states
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = { immediate: true }
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: options.immediate ?? true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as ApiError | Error });
    }
  }, [apiCall]);

  useEffect(() => {
    if (options.immediate) {
      fetchData();
    }
  }, [fetchData, options.immediate]);

  return { ...state, refetch: fetchData };
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T>(
  apiCall: (page: number) => Promise<{ results: T[]; count: number; next: string | null; previous: string | null }>,
  initialPage = 1
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchData = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(pageNum);
      setData(response.results);
      setTotalCount(response.count);
      setHasMore(!!response.next);
      setPage(pageNum);
    } catch (err) {
      setError(err as ApiError | Error);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData(initialPage);
  }, [fetchData, initialPage]);

  const nextPage = useCallback(() => {
    if (hasMore) {
      fetchData(page + 1);
    }
  }, [fetchData, hasMore, page]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      fetchData(page - 1);
    }
  }, [fetchData, page]);

  const goToPage = useCallback((pageNum: number) => {
    fetchData(pageNum);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    page,
    totalCount,
    hasMore,
    hasPrevious: page > 1,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchData(page),
  };
}

/**
 * Hook for mutation API calls (POST, PUT, DELETE)
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
): {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: ApiError | Error | null;
  reset: () => void;
} {
  const [state, setState] = useState<{
    data: TData | null;
    loading: boolean;
    error: ApiError | Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await mutationFn(variables);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: error as ApiError | Error });
      throw error;
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
}

/**
 * Hook for managing form state with API submission
 */
export function useFormApi<TData, TFormData>(
  submitFn: (data: TFormData) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError | Error) => void;
  }
) {
  const { mutate, loading, error, data, reset } = useMutation(submitFn);

  const handleSubmit = useCallback(async (formData: TFormData) => {
    try {
      const result = await mutate(formData);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      options?.onError?.(err as ApiError | Error);
      throw err;
    }
  }, [mutate, options]);

  return {
    submit: handleSubmit,
    loading,
    error,
    data,
    reset,
  };
}

/**
 * Hook for debounced search
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for search with API
 */
export function useSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchFn(debouncedQuery);
        setResults(data);
      } catch (err) {
        setError(err as ApiError | Error);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery, searchFn]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clear: () => {
      setQuery('');
      setResults([]);
    },
  };
}
