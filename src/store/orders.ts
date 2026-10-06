import type { Order } from '@/services/types';

/**
 * The API has no single-order endpoint — order details come from the list.
 * The Orders tab caches what it loads so the detail screen can open instantly.
 */
const cache = new Map<string, Order>();

export function cacheOrders(orders: Order[]) {
  for (const order of orders) cache.set(order.id, order);
}

export function getCachedOrder(id: string) {
  return cache.get(id);
}

export function clearOrderCache() {
  cache.clear();
}

/** Status codes the backend uses, in fulfilment order. */
export const ORDER_STEPS: { code: number; label: string }[] = [
  { code: 1, label: 'Order placed' },
  { code: 2, label: 'Confirmed' },
  { code: 4, label: 'Being prepared' },
  { code: 5, label: 'Shipped' },
  { code: 6, label: 'Delivered' },
];

export const CANCELLED_CODES = new Set([7, 8]);
export const RETURNED_CODE = 9;

export function isActiveOrder(statusCode: number) {
  return statusCode < 6;
}

/** How far along the timeline an order is (3 = "confirmed by seller" counts as confirmed). */
export function stepIndex(statusCode: number) {
  const code = statusCode === 3 ? 2 : statusCode;
  let index = 0;
  ORDER_STEPS.forEach((step, i) => {
    if (code >= step.code) index = i;
  });
  return index;
}
