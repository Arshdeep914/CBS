import { useSyncExternalStore } from 'react';

import { getProduct, type Product } from '@/data/catalog';
import { computeBill, priceLines, type CartLine } from '@/lib/pricing';

/**
 * Cart state lives outside React so components can subscribe to just the slice
 * they need — tapping ADD on one product only re-renders that product's button
 * and the cart bar, not every card on screen.
 */
type CartState = {
  lines: CartLine[];
  couponApplied: boolean;
};

let state: CartState = { lines: [], couponApplied: false };
const listeners = new Set<() => void>();

function setState(next: CartState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function quantityOf(productId: string) {
  return state.lines.find((l) => l.productId === productId)?.quantity ?? 0;
}

function setQuantity(product: Product, quantity: number) {
  const { lines } = state;
  if (quantity < product.moq) {
    setState({ ...state, lines: lines.filter((l) => l.productId !== product.id) });
    return;
  }
  const exists = lines.some((l) => l.productId === product.id);
  setState({
    ...state,
    lines: exists
      ? lines.map((l) => (l.productId === product.id ? { ...l, quantity } : l))
      : [...lines, { productId: product.id, quantity }],
  });
}

export const cartActions = {
  quantityOf,
  setQuantity,
  /** Adds the product at its minimum order quantity. */
  add: (product: Product) => setQuantity(product, product.moq),
  /** Steps up by one case pack. */
  increment: (product: Product) => setQuantity(product, quantityOf(product.id) + product.casePack),
  /** Steps down by one case pack; removes the line below the MOQ. */
  decrement: (product: Product) => {
    const next = quantityOf(product.id) - product.casePack;
    setQuantity(product, next < product.moq ? 0 : next);
  },
  remove: (productId: string) =>
    setState({ ...state, lines: state.lines.filter((l) => l.productId !== productId) }),
  /** Merges lines into the cart, e.g. for "Reorder". Skips out-of-stock products. */
  addMany: (incoming: CartLine[]) => {
    const next = [...state.lines];
    for (const line of incoming) {
      const product = getProduct(line.productId);
      if (!product || product.stock === 'out-of-stock') continue;
      const index = next.findIndex((l) => l.productId === line.productId);
      if (index >= 0) next[index] = { ...next[index], quantity: next[index].quantity + line.quantity };
      else next.push({ ...line, quantity: Math.max(line.quantity, product.moq) });
    }
    setState({ ...state, lines: next });
  },
  setCouponApplied: (couponApplied: boolean) => setState({ ...state, couponApplied }),
  clear: () => setState({ lines: [], couponApplied: false }),
};

/** Quantity of one product; re-renders only when that quantity changes. */
export function useCartQuantity(productId: string) {
  return useSyncExternalStore(subscribe, () => quantityOf(productId));
}

/** Number of distinct products in the cart. */
export function useCartCount() {
  return useSyncExternalStore(subscribe, () => state.lines.length);
}

export function useCouponApplied() {
  return useSyncExternalStore(subscribe, () => state.couponApplied);
}

/** Priced cart lines plus the bill breakdown. */
export function useCartSummary() {
  const current = useSyncExternalStore(subscribe, () => state);
  const priced = priceLines(current.lines);
  const bill = computeBill(priced, current.couponApplied);
  const unitCount = priced.reduce((sum, l) => sum + l.quantity, 0);
  return { lines: priced, bill, itemCount: priced.length, unitCount };
}
