import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage, isCancel } from '@/api/client';

type FetchPage<T> = (page: number, signal: AbortSignal) => Promise<T[]>;

/**
 * Server-side paging for "load more as you scroll" lists.
 *
 * The backend doesn't report its page size or a total, and the web storefront
 * guesses differently per screen (30 on categories, 12 on brands). Here the
 * page size is learned from the first page: a later page shorter than that
 * means the end. An empty first page is simply an empty list.
 *
 * Changing `key` (filters, query, category) restarts from page 1 and cancels
 * any request still in flight, so stale results can never be appended.
 */
export function useInfiniteList<T>(fetchPage: FetchPage<T>, key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Reset as soon as the key changes, during render — React's recommended
  // alternative to resetting state inside an effect.
  const [currentKey, setCurrentKey] = useState(key);
  if (currentKey !== key) {
    setCurrentKey(key);
    setItems([]);
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setHasMore(true);
  }

  const fetchRef = useRef(fetchPage);
  const page = useRef(0);
  const pageSize = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);

  // always call the latest fetcher (it closes over the current filters)
  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const loadPage = useCallback(async (pageNo: number, mode: 'first' | 'more' | 'refresh') => {
    if (mode === 'more' && busy.current) return;
    if (mode !== 'more') controller.current?.abort();
    const current = mode === 'more' && controller.current ? controller.current : new AbortController();
    controller.current = current;
    busy.current = true;

    try {
      const result = await fetchRef.current(pageNo, current.signal);
      if (current.signal.aborted) return;
      if (pageNo === 1) pageSize.current = result.length;
      page.current = pageNo;
      setItems((prev) => (pageNo === 1 ? result : [...prev, ...result]));
      setHasMore(result.length > 0 && result.length >= pageSize.current);
      setError(null);
    } catch (err) {
      if (current.signal.aborted || isCancel(err)) return;
      setError(errorMessage(err));
      // a failed "load more" stops the auto-trigger until the user retries
      if (mode === 'more') setHasMore(false);
    } finally {
      if (!current.signal.aborted) {
        busy.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    page.current = 0;
    pageSize.current = 0;
    busy.current = false;
    void loadPage(1, 'first');
    return () => controller.current?.abort();
  }, [key, loadPage]);

  function more() {
    if (!hasMore || loading || busy.current) return;
    setLoadingMore(true);
    void loadPage(page.current + 1, 'more');
  }

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore: more,
    /** Retry after an error: resumes paging, or restarts if nothing loaded. */
    retry: () => {
      setError(null);
      setHasMore(true);
      if (page.current === 0) {
        setLoading(true);
        void loadPage(1, 'first');
      } else {
        setLoadingMore(true);
        void loadPage(page.current + 1, 'more');
      }
    },
    refresh: () => {
      setRefreshing(true);
      void loadPage(1, 'refresh');
    },
  };
}
