"use client";

import { useCallback, useEffect, useState } from "react";

interface AsyncDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAsyncData<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  const reload = useCallback(() => {
    Promise.resolve()
      .then(() => setState((prev) => ({ ...prev, isLoading: true, error: null })))
      .then(loader)
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch((error: Error) =>
        setState({ data: null, isLoading: false, error })
      );
  }, [loader]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
