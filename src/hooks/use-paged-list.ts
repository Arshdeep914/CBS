import { useEffect, useState } from 'react';

/** Products shown per page. */
export const PAGE_SIZE = 12;

/** Simulated network time per page, so the demo behaves like a real paginated API. */
const PAGE_DELAY_MS = 450;

/**
 * Reveals `items` one page at a time as the user scrolls.
 *
 * Pass a `resetKey` that changes whenever the underlying list changes (filters,
 * search query, subcategory) to jump back to the first page.
 *
 * TODO: when the CBS API exists, replace the timeout with a fetch of the next page.
 */
export function usePagedList<T>(items: T[], resetKey: string, pageSize = PAGE_SIZE) {
  const [count, setCount] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [key, setKey] = useState(resetKey);

  // Adjust state during render when the list changes (React's recommended pattern).
  if (key !== resetKey) {
    setKey(resetKey);
    setCount(pageSize);
    setLoading(false);
  }

  // The "request" lives in an effect so it restarts if interrupted, e.g. by a
  // remount, instead of leaving the list stuck in the loading state.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setCount((c) => c + pageSize);
      setLoading(false);
    }, PAGE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, pageSize]);

  const hasMore = count < items.length;

  function loadMore() {
    if (hasMore && !loading) setLoading(true);
  }

  return { visible: items.slice(0, count), hasMore, loading, loadMore, total: items.length };
}
