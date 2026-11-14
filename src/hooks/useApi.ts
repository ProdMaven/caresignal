"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/api";

interface State<T> {
  key: string | null;
  data: T | null;
  error: string | null;
}

// GET a JSON resource with loading and error states. Pass null to skip.
export function useApi<T>(url: string | null) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null });
  const key = url ? `${url}#${nonce}` : null;

  useEffect(() => {
    if (!url || !key) return;
    let cancelled = false;
    fetchJson<T>(url)
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ key, data: null, error: err instanceof Error ? err.message : "Something went wrong." });
      });
    return () => {
      cancelled = true;
    };
  }, [url, key]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: Boolean(url) && !current,
    reload,
  };
}
