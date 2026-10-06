import { useSyncExternalStore } from 'react';

import { Env } from '@/config/env';
import { shop } from '@/services';
import type { CartLine, PaymentModes, ProductSummary } from '@/services/types';

/**
 * The cart lives on the server; this store mirrors it.
 *
 * - Lines are keyed by mappingCode (`id`), which every mutation is addressed by.
 * - Mutations are optimistic, and each line carries its own pending flag so one
 *   row can show a spinner while the rest stay interactive.
 * - `status` only covers the first load; later refreshes keep rows on screen.
 *
 * State lives outside React so each ADD button subscribes to just its own line.
 */
export type CartStatus = 'idle' | 'loading' | 'ready' | 'error';

type CartState = {
  status: CartStatus;
  lines: CartLine[];
  paymentModes: PaymentModes;
  /** ids with a request in flight */
  pending: ReadonlySet<string>;
};

const INITIAL: CartState = {
  status: 'idle',
  lines: [],
  paymentModes: { cash: true, online: true },
  pending: new Set(),
};

let state: CartState = INITIAL;
const listeners = new Set<() => void>();

function setState(patch: Partial<CartState>) {
  state = { ...state, ...patch };
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

function patchLine(id: string, patch: Partial<CartLine>) {
  setState({ lines: state.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)) });
}

/*
 * One refresh at a time. A refresh requested while another is in flight is
 * queued to run once more afterwards — not dropped — so a mutation that lands
 * mid-refresh is always reflected. (The web storefront skips it instead, which
 * can leave a just-added item missing.)
 */
let inFlight: Promise<void> | null = null;
let rerun = false;

async function refresh(): Promise<void> {
  if (inFlight) {
    rerun = true;
    return inFlight;
  }
  if (state.status === 'idle' || state.status === 'error') setState({ status: 'loading' });

  inFlight = (async () => {
    do {
      rerun = false;
      try {
        const cart = await shop.cart.fetch();
        setState({ status: 'ready', lines: cart.lines, paymentModes: cart.paymentModes });
      } catch (err) {
        // keep whatever is on screen; only a failed first load shows an error
        if (state.status !== 'ready') setState({ status: 'error' });
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

async function remove(id: string) {
  setPending(id, true);
  const previous = state.lines;
  setState({ lines: previous.filter((line) => line.id !== id) });
  try {
    await shop.cart.remove(id);
  } catch (err) {
    // the server is the source of truth on what "put it back" means
    await refresh().catch(() => setState({ lines: previous }));
    throw err;
  } finally {
    setPending(id, false);
  }
}

export const cartActions = {
  refresh,

  /** Adds one of a product, then reloads the bag so totals come from the server. */
  async add(product: Pick<ProductSummary, 'id' | 'variationCode'>, qty = 1) {
    setPending(product.id, true);
    try {
      await shop.cart.add(product.id, product.variationCode ?? '', qty);
      await refresh();
    } finally {
      setPending(product.id, false);
    }
  },

  async setQty(id: string, qty: number) {
    if (qty <= 0) return remove(id);

    setPending(id, true);
    const before = state.lines.find((line) => line.id === id)?.qty ?? 0;
    patchLine(id, { qty });
    try {
      const ack = await shop.cart.setQty(id, qty);
      if (!ack.acknowledged) {
        patchLine(id, { qty: before });
        throw new Error("Couldn't update the quantity.");
      }
      // the server only echoes the touched row; patch just that line
      if (ack.qty !== null && ack.qty !== qty) patchLine(id, { qty: ack.qty });
    } catch (err) {
      patchLine(id, { qty: before });
      throw err;
    } finally {
      setPending(id, false);
    }
  },

  remove,

  /** Empties the local copy after an order, then confirms with the server. */
  async afterOrder() {
    setState({ lines: [] });
    await refresh().catch(() => {});
  },

  /** Signed out — forget everything. */
  reset() {
    rerun = false;
    setState(INITIAL);
  },
};

/* ------------------------------------------------------------------ */
/*  hooks                                                              */
/* ------------------------------------------------------------------ */

export function useCartQuantity(id: string) {
  return useSyncExternalStore(subscribe, () => state.lines.find((line) => line.id === id)?.qty ?? 0);
}

export function useCartPending(id: string) {
  return useSyncExternalStore(subscribe, () => state.pending.has(id));
}

/** Number of distinct products in the cart. */
export function useCartCount() {
  return useSyncExternalStore(subscribe, () => state.lines.length);
}

export function useCartState() {
  return useSyncExternalStore(subscribe, () => state);
}

export type CartTotals = {
  totalMrp: number;
  subtotal: number;
  savings: number;
  platformFee: number;
  total: number;
  itemCount: number;
  hasOutOfStock: boolean;
};

/** Derived from the lines every time — never hand-patched. */
export function cartTotals(lines: CartLine[]): CartTotals {
  let totalMrp = 0;
  let subtotal = 0;
  let itemCount = 0;
  let hasOutOfStock = false;
  for (const line of lines) {
    const mrp = line.mrp && line.mrp > line.price ? line.mrp : line.price;
    totalMrp += mrp * line.qty;
    subtotal += line.price * line.qty;
    itemCount += line.qty;
    hasOutOfStock ||= line.isOutOfStock;
  }
  const platformFee = subtotal > 0 ? Env.platformFee : 0;
  return {
    totalMrp,
    subtotal,
    savings: totalMrp - subtotal,
    platformFee,
    total: subtotal + platformFee,
    itemCount,
    hasOutOfStock,
  };
}
