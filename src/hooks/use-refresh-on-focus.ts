import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { errorMessage } from '@/api/client';
import { toast } from '@/components/ui/toast';

/**
 * Calls `refresh` every time the screen comes into view (including the first
 * time) and reports whether it's still running, for the "Updating…" hint.
 * `hasData`: whether the screen already shows something (decides if a failure
 * is worth a toast).
 * For screens backed by a shared store (cart, wishlist, addresses): the store
 * shows its own skeleton when it has nothing yet, and keeps its data on failure.
 */
export function useRefreshOnFocus(refresh: () => Promise<unknown>, hasData: boolean) {
  const [updating, setUpdating] = useState(false);
  const refreshRef = useRef(refresh);
  const hasDataRef = useRef(hasData);
  useEffect(() => {
    refreshRef.current = refresh;
    hasDataRef.current = hasData;
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setUpdating(true);
      refreshRef
        .current()
        .catch((err) => {
          // with nothing on screen yet, the store's own error state already says so
          if (active && hasDataRef.current) toast.show(`Couldn't update — ${errorMessage(err)}`, 'error');
        })
        .finally(() => {
          if (active) setUpdating(false);
        });
      return () => {
        active = false;
        setUpdating(false);
      };
    }, []),
  );

  return updating;
}
