import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// Small data-fetching hook: re-runs whenever `path` changes. Pass null to skip.
export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });

  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api(path);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
}
