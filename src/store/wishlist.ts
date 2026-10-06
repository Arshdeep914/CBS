import { useSyncExternalStore } from 'react';

import { errorMessage } from '@/api/client';
import { shop } from '@/services';
import type { ProductSummary } from '@/services/types';

/**
 * The wishlist lives on the server; this store mirrors it so every heart
 * button and the wishlist screen agree. Toggles are optimistic, with a
 * per-product pending flag so only the tapped heart shows a spinner.
 */
type WishlistState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: ProductSummary[];
  ids: ReadonlySet<string>;
  pending: ReadonlySet<string>;
  error: string | null;
};

const INITIAL: WishlistState = { status: 'idle', items: [], ids: new Set(), pending: new Set(), error: null };

let state: WishlistState = INITIAL;
const listeners = new Set<() => void>();

function setState(patch: Partial<WishlistState>) {
  state = { ...state, ...patch };
  if (patch.items) state.ids = new Set(state.items.map((item) => item.id));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setPending(id: string, active: boolean) {
  const next = new Set(state.pending);
  if (active) next.add(id);
  else next.delete(id);
  setState({ pending: next });
}

async function refresh() {
  if (state.status !== 'ready') setState({ status: 'loading', error: null });
  try {
    setState({ status: 'ready', items: await shop.wishlist.list(), error: null });
  } catch (err) {
    if (state.status !== 'ready') setState({ status: 'error', error: errorMessage(err) });
    throw err;
  }
}

export const wishlistActions = {
  refresh,

  /** Adds or removes `product`; resolves to whether it's now saved. Throws on failure (state is rolled back). */
  async toggle(product: ProductSummary) {
    const { id } = product;
    if (state.pending.has(id)) return state.ids.has(id);
    const wasSaved = state.ids.has(id);
    const previous = state.items;

    setPending(id, true);
    setState({ items: wasSaved ? previous.filter((item) => item.id !== id) : [product, ...previous] });
    try {
      if (wasSaved) await shop.wishlist.remove(id);
      else await shop.wishlist.add(id);
      return !wasSaved;
    } catch (err) {
      setState({ items: previous });
      throw err;
    } finally {
      setPending(id, false);
      // pick up the server's own copy (prices, stock) without blocking the tap
      if (!wasSaved) refresh().catch(() => {});
    }
  },

  reset() {
    setState({ ...INITIAL, items: [] });
  },
};

export function useWishlist() {
  return useSyncExternalStore(subscribe, () => state);
}

export function useWishlisted(id: string) {
  return useSyncExternalStore(subscribe, () => state.ids.has(id));
}

export function useWishlistPending(id: string) {
  return useSyncExternalStore(subscribe, () => state.pending.has(id));
}
