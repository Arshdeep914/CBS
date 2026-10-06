import type { FilterSelection, ProductSummary } from '@/services/types';

/*
 * Two kinds of filter, matching the web storefront:
 *  - server filters (brand, colour, size, price…) are sent with the listing
 *    request, so paging stays correct;
 *  - sort and the quick toggles run on the device over what's loaded, because
 *    the API has no sort parameter.
 */

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'discount';

export type QuickFilter = 'in-stock' | 'rating-4' | 'on-offer';

export type PriceRange = { label: string; min: number; max: number };

export type Filters = {
  sort: SortKey;
  quick: QuickFilter[];
  /** Server-side selections, e.g. brand = Havells. */
  selections: FilterSelection[];
  price: PriceRange | null;
};

export const EMPTY_FILTERS: Filters = { sort: 'relevance', quick: [], selections: [], price: null };

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Rating: high to low' },
  { id: 'discount', label: 'Discount: high to low' },
];

export const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'in-stock', label: 'In stock' },
  { id: 'rating-4', label: 'Rated 4+' },
  { id: 'on-offer', label: 'On offer' },
];

export const PRICE_RANGES: PriceRange[] = [
  { label: 'Under ₹500', min: 0, max: 499 },
  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
  { label: '₹1,000 – ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 – ₹20,000', min: 5000, max: 20000 },
  { label: 'Above ₹20,000', min: 20000, max: 9_999_999 },
];

export function discountPercent(product: Pick<ProductSummary, 'price' | 'mrp'>) {
  if (!product.mrp || product.mrp <= product.price || product.price <= 0) return 0;
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

/** What the listing endpoint should receive for these filters. */
export function serverFilters(filters: Filters): FilterSelection[] {
  return [
    ...filters.selections,
    ...(filters.price ? [{ code: 'price', value: `${filters.price.min}-${filters.price.max}` }] : []),
  ];
}

/** Changes only when the server request would change — use as a list reset key. */
export function serverFilterKey(filters: Filters) {
  return JSON.stringify(serverFilters(filters));
}

const quickTests: Record<QuickFilter, (p: ProductSummary) => boolean> = {
  'in-stock': (p) => !p.isOutOfStock,
  'rating-4': (p) => p.rating >= 4,
  'on-offer': (p) => discountPercent(p) > 0,
};

/** Sort + quick filters over the products loaded so far. */
export function applyLocalFilters(list: ProductSummary[], filters: Filters) {
  const filtered = list.filter((p) => filters.quick.every((q) => quickTests[q](p)));
  switch (filters.sort) {
    case 'price-asc':
      return filtered.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return filtered.sort((a, b) => b.price - a.price);
    case 'rating':
      return filtered.sort((a, b) => b.rating - a.rating);
    case 'discount':
      return filtered.sort((a, b) => discountPercent(b) - discountPercent(a));
    default:
      return filtered;
  }
}

export function activeFilterCount(filters: Filters) {
  return (
    filters.quick.length +
    filters.selections.length +
    (filters.price ? 1 : 0) +
    (filters.sort === 'relevance' ? 0 : 1)
  );
}

export function isSelected(filters: Filters, code: string, value: string) {
  return filters.selections.some((s) => s.code === code && s.value === value);
}

export function toggleSelection(filters: Filters, code: string, value: string): Filters {
  return {
    ...filters,
    selections: isSelected(filters, code, value)
      ? filters.selections.filter((s) => !(s.code === code && s.value === value))
      : [...filters.selections, { code, value }],
  };
}
