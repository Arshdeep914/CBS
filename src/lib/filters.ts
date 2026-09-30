import {
  brands,
  categories,
  discountPercent,
  getBrand,
  products,
  type Product,
} from '@/data/catalog';

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'discount';

export type QuickFilter = 'bestseller' | 'bulk-deal' | 'rating-4' | 'in-stock' | 'under-1000' | 'new';

export type Filters = {
  sort: SortKey;
  quick: QuickFilter[];
  brandIds: string[];
};

export const EMPTY_FILTERS: Filters = { sort: 'relevance', quick: [], brandIds: [] };

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Rating: high to low' },
  { id: 'discount', label: 'Margin: high to low' },
];

export const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'bulk-deal', label: 'Bulk deals' },
  { id: 'bestseller', label: 'Bestsellers' },
  { id: 'rating-4', label: 'Rated 4.5+' },
  { id: 'under-1000', label: 'Under ₹1,000' },
  { id: 'new', label: 'New arrivals' },
  { id: 'in-stock', label: 'In stock' },
];

const quickTests: Record<QuickFilter, (p: Product) => boolean> = {
  bestseller: (p) => p.tags.includes('bestseller'),
  'bulk-deal': (p) => p.tags.includes('bulk-deal'),
  'rating-4': (p) => p.rating >= 4.5,
  'in-stock': (p) => p.stock !== 'out-of-stock',
  'under-1000': (p) => p.price < 1000,
  new: (p) => p.tags.includes('new'),
};

export function applyFilters(list: Product[], filters: Filters) {
  const filtered = list.filter(
    (p) =>
      filters.quick.every((q) => quickTests[q](p)) &&
      (filters.brandIds.length === 0 || filters.brandIds.includes(p.brandId)),
  );

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
  return filters.quick.length + filters.brandIds.length + (filters.sort === 'relevance' ? 0 : 1);
}

/** Brands present in a product list, for the brand filter. */
export function brandsIn(list: Product[]) {
  const ids = new Set(list.map((p) => p.brandId));
  return brands.filter((b) => ids.has(b.id));
}

function searchText(p: Product) {
  const category = categories.find((c) => c.id === p.categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === p.subcategoryId);
  return [p.name, getBrand(p.brandId)?.name, category?.name, subcategory?.name, ...p.highlights]
    .join(' ')
    .toLowerCase();
}

const searchIndex = new Map(products.map((p) => [p.id, searchText(p)]));

/** Every word in the query must appear somewhere in the product's text. */
export function searchProducts(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return products.filter((p) => {
    const text = searchIndex.get(p.id) ?? '';
    return words.every((word) => text.includes(word.replace(/s$/, '')));
  });
}
