import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage, isCancel } from '@/api/client';

type AsyncState<T> = {
  data: T | undefined;
  /** True only until the first result (or error) arrives. */
  loading: boolean;
  /** True during a pull-to-refresh, while the old data stays on screen. */
  refreshing: boolean;
  error: string | null;
};

const INITIAL = { data: undefined, loading: true, refreshing: false, error: null };

function sameDeps(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Loads data for a screen, with first-load / refresh / error states and
 * cancellation when the inputs change or the screen closes.
 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<AsyncState<T>>(INITIAL);

  // New inputs mean a fresh first load: reset during render rather than in an effect.
  const [currentDeps, setCurrentDeps] = useState(deps);
  if (!sameDeps(currentDeps, deps)) {
    setCurrentDeps(deps);
    setState(INITIAL);
  }

  const controller = useRef<AbortController | null>(null);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const run = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      const data = await loadRef.current(current.signal);
      if (current.signal.aborted) return;
      setState({ data, loading: false, refreshing: false, error: null });
    } catch (err) {
      if (current.signal.aborted || isCancel(err)) return;
      setState((s) => ({ ...s, loading: false, refreshing: false, error: errorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    void run();
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    /** Start over, showing the loading state (e.g. "Try again" after an error). */
    reload: () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      void run();
    },
    /** Reload in the background, keeping current data on screen (pull-to-refresh). */
    refresh: () => {
      setState((s) => ({ ...s, refreshing: true }));
      void run();
    },
  };
}
