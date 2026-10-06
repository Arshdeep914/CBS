import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage, isCancel } from '@/api/client';
import { toast } from '@/components/ui/toast';

type AsyncState<T> = {
  data: T | undefined;
  /** True only until the first result (or error) arrives — show a skeleton. */
  loading: boolean;
  /** True during a pull-to-refresh, while the old data stays on screen. */
  refreshing: boolean;
  /** True while re-fetching because the screen came back into view — show a small "Updating…" hint. */
  updating: boolean;
  error: string | null;
};

const INITIAL = { data: undefined, loading: true, refreshing: false, updating: false, error: null };

/** Passed to the loader; `fresh` means "skip any cache and ask the API". */
export type LoadOptions = { fresh: boolean };

type UseAsyncOptions = {
  /**
   * Call the API every time the screen comes into view: the first visit loads
   * fresh (skeleton), and each return re-fetches with the old data still shown.
   */
  refetchOnFocus?: boolean;
};

type RunMode = 'load' | 'refresh' | 'background';

function sameDeps(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}

/**
 * Loads data for a screen, with first-load / refresh / error states and
 * cancellation when the inputs change or the screen closes.
 */
export function useAsync<T>(
  load: (signal: AbortSignal, options: LoadOptions) => Promise<T>,
  deps: readonly unknown[],
  { refetchOnFocus = false }: UseAsyncOptions = {},
) {
  const [state, setState] = useState<AsyncState<T>>(INITIAL);

  // New inputs mean a fresh first load: reset during render rather than in an effect.
  const [currentDeps, setCurrentDeps] = useState(deps);
  if (!sameDeps(currentDeps, deps)) {
    setCurrentDeps(deps);
    setState(INITIAL);
  }

  const controller = useRef<AbortController | null>(null);
  const loadRef = useRef(load);
  const hasData = useRef(false);
  useEffect(() => {
    loadRef.current = load;
    hasData.current = state.data !== undefined;
  });

  const run = useCallback(async (fresh: boolean, mode: RunMode) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    try {
      const data = await loadRef.current(current.signal, { fresh });
      if (current.signal.aborted) return;
      setState({ data, loading: false, refreshing: false, updating: false, error: null });
    } catch (err) {
      if (current.signal.aborted || isCancel(err)) return;
      const message = errorMessage(err);
      setState((s) => {
        // a failed re-fetch keeps what's on screen rather than replacing it with an error
        if (mode !== 'load' && s.data !== undefined) return { ...s, refreshing: false, updating: false };
        return { ...s, loading: false, refreshing: false, updating: false, error: message };
      });
      if (mode !== 'load' && hasData.current) toast.show(`Couldn't update — ${message}`, 'error');
    }
  }, []);

  useEffect(() => {
    void run(refetchOnFocus, 'load');
    return () => controller.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // the mount is handled above; every later return to the screen re-fetches
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!refetchOnFocus) return;
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (hasData.current) {
        setState((s) => ({ ...s, updating: true }));
        void run(true, 'background');
      } else {
        setState((s) => ({ ...s, loading: true, error: null }));
        void run(true, 'load');
      }
    }, [refetchOnFocus, run]),
  );

  return {
    ...state,
    /** Start over, showing the loading state (e.g. "Try again" after an error). */
    reload: () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      void run(true, 'load');
    },
    /** Reload in the background, keeping current data on screen (pull-to-refresh). */
    refresh: () => {
      setState((s) => ({ ...s, refreshing: true }));
      void run(true, 'refresh');
    },
  };
}
