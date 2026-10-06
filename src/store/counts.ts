import { useSyncExternalStore } from 'react';

import { shop } from '@/services';

/**
 * Cart and wishlist badge numbers from the Count API, shown on the home header.
 * `null` until the first answer arrives. Refreshed when Home comes into view and
 * shortly after any cart or wishlist change.
 */
type CountsState = { cart: number | null; wishlist: number | null };

const INITIAL: CountsState = { cart: null, wishlist: null };

let state: CountsState = INITIAL;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// one request at a time; a refresh asked for mid-flight runs once more afterwards
let inFlight: Promise<void> | null = null;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | null = null;
// bumped on sign-out so a late answer for the old account is ignored
let generation = 0;

async function refresh(): Promise<void> {
  if (inFlight) {
    rerun = true;
    return inFlight;
  }
  const started = generation;
  inFlight = (async () => {
    do {
      rerun = false;
      try {
        const counts = await shop.counts.fetch();
        if (started !== generation) return;
        state = { cart: counts.cart, wishlist: counts.wishlist };
        listeners.forEach((listener) => listener());
      } catch (err) {
        // badges are cosmetic: keep the last numbers rather than interrupt anything
        if (!rerun) throw err;
      }
    } while (rerun);
  })();
  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

export const countsActions = {
  refresh,

  /** Coalesces a burst of cart/wishlist taps into one Count call. */
  refreshSoon(delay = 500) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      refresh().catch(() => {});
    }, delay);
  },

  reset() {
    generation += 1;
    if (timer) clearTimeout(timer);
    timer = null;
    rerun = false;
    state = INITIAL;
    listeners.forEach((listener) => listener());
  },
};

export function useCounts() {
  return useSyncExternalStore(subscribe, () => state);
}
