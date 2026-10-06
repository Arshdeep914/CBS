import { isAxiosError } from 'axios';

import { ApiError, get, isCancel, post, resolveImageUrl } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type {
  ApiBrandProduct,
  ApiCategory,
  ApiFilters,
  ApiImage,
  ApiProduct,
  ApiProductDetail,
  ApiProductGroup,
  ApiSellerPrice,
  ApiVariant,
} from '@/api/types';
import type {
  Brand,
  CatalogFilters,
  Category,
  FilterSelection,
  HomeSection,
  ProductDetail,
  ProductSummary,
  ShopService,
  Variant,
} from '@/services/types';

/* ------------------------------------------------------------------ */
/*  mapping                                                            */
/* ------------------------------------------------------------------ */

function sortedImages(images: ApiImage[] | undefined) {
  return [...(images ?? [])]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.order - b.order)
    .map((img) => resolveImageUrl(img.image))
    .filter((url): url is string => !!url);
}

/**
 * Variants the backend hasn't priced yet come back with price 0 and an all-zero
 * mappingCode. They can't be bought (and that code would be sent to the cart),
 * so they're never listed.
 */
const EMPTY_GUID = /^0{8}-0{4}-0{4}-0{4}-0{12}$/;
function isSellable(mappingCode: string | null | undefined, price: unknown) {
  return !!mappingCode && !EMPTY_GUID.test(mappingCode) && Number(price) > 0;
}

/** Products without a usable mappingCode or price can't be opened or carted, so they're dropped. */
function toSummary(raw: ApiProduct | null | undefined): ProductSummary | null {
  const name = (raw?.product ?? '').trim();
  if (!raw || !name || !isSellable(raw.mappingCode, raw.price)) return null;
  const price = Number(raw.price) || 0;
  const mrp = Number(raw.mrp) || 0;
  return {
    id: raw.mappingCode!,
    variationCode: raw.variationCode ?? null,
    name,
    brand: null,
    price,
    mrp: mrp > 0 ? mrp : null,
    rating: Number(raw.rating) || 0,
    image: sortedImages(raw.images)[0] ?? null,
    isOutOfStock: Boolean(raw.isOutOfStock),
  };
}

function toSummaries(list: (ApiProduct | null | undefined)[] | null | undefined) {
  return (Array.isArray(list) ? list : []).map(toSummary).filter((p): p is ProductSummary => p !== null);
}

/** The brand endpoint nests pricing on `sellerPrice` and uses flat image fields. */
function brandRowToSummary(raw: ApiBrandProduct, brand: string): ProductSummary | null {
  const seller = raw.sellerPrice ?? {};
  const product = (raw.product ?? '').trim();
  if (!product || !isSellable(seller.mappingCode, seller.price)) return null;
  // brand rows are one per variant, so say which one
  const variant = (raw.variationName ?? '').trim();
  const mrp = Number(seller.mrp) || 0;
  return {
    id: seller.mappingCode!,
    variationCode: seller.variationCode ?? null,
    name: variant && !product.toLowerCase().includes(variant.toLowerCase()) ? `${product} (${variant})` : product,
    brand,
    price: Number(seller.price) || 0,
    mrp: mrp > 0 ? mrp : null,
    rating: Number(seller.rating) || 0,
    image: resolveImageUrl(raw.v_Image || raw.p_Image),
    isOutOfStock: Boolean(seller.isOutOfStock),
  };
}

/** Listings answer with either a flat product list or `{ tag, products }` groups. */
function flattenGroups(data: (ApiProduct | ApiProductGroup)[] | null | undefined) {
  if (!Array.isArray(data)) return [];
  return data.flatMap((entry) =>
    entry && Array.isArray((entry as ApiProductGroup).products)
      ? (entry as ApiProductGroup).products
      : [entry as ApiProduct],
  );
}

/** `keyDescription` is backend-authored HTML; keep the text, drop the markup. */
function htmlToParagraphs(html: string | null | undefined) {
  if (!html) return [];
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function pickSeller(variant: ApiVariant): ApiSellerPrice | null {
  const all = variant.sellers?.length ? variant.sellers : variant.sellerPrice ? [variant.sellerPrice] : [];
  const sellers = all.filter((s) => isSellable(s.mappingCode, s.price));
  return sellers.find((s) => !s.isOutOfStock) ?? sellers[0] ?? null;
}

function toDetail(data: ApiProductDetail, routeId: string): ProductDetail {
  const base = data.product;
  const rows = data.variations?.length ? data.variations : [base];
  const fallbackImages = sortedImages(base.images);

  const variants: Variant[] = rows.flatMap((row): Variant[] => {
    const seller = pickSeller(row);
    // a variant with no seller price can't be bought — unless it's all there is,
    // in which case the route's mappingCode is still a valid cart key
    if (!seller && rows.length > 1) return [];
    const mrp = Number(seller?.mrp ?? row.mrp) || 0;
    const images = sortedImages(row.images);
    return [
      {
        id: seller?.mappingCode ?? routeId,
        variationCode: seller?.variationCode ?? '',
        label: row.variationName?.trim() || null,
        price: Number(seller?.price ?? row.price) || 0,
        mrp: mrp > 0 ? mrp : null,
        rating: Number(seller?.rating ?? row.rating) || 0,
        isOutOfStock: Boolean(seller?.isOutOfStock ?? row.isOutOfStock),
        // `avail` reads 0 on in-stock rows, so it isn't trustworthy enough to cap quantities
        available: null,
        images: images.length > 0 ? images : fallbackImages,
      },
    ];
  });

  if (variants.length === 0) throw new ApiError('This product is not available right now.');

  const defaultIndex = Math.max(
    0,
    variants.findIndex((v) => v.id === routeId),
  );

  return {
    id: routeId,
    name: base.product,
    brand: base.brandName?.trim() || null,
    // productRating is 0 (not absent) when unrated, so fall through on falsy
    rating: Number(base.productRating) || Number(base.rating) || variants[defaultIndex]?.rating || 0,
    reviewCount: Number(base.productTotalReviews) || 0,
    description: htmlToParagraphs(base.keyDescription),
    attributes: (data.attributes ?? [])
      .map((attr) => ({ name: attr.name, values: (attr.details ?? []).map((d) => d.name).filter(Boolean) }))
      .filter((attr) => attr.name && attr.values.length > 0),
    variants,
    defaultVariantIndex: defaultIndex,
  };
}

const toApiFilters = (filters: FilterSelection[]) =>
  filters.map((f) => ({ code: f.code, typeName: f.value }));

/* ------------------------------------------------------------------ */
/*  shared, cached lookups                                             */
/* ------------------------------------------------------------------ */

// Several screens want these on first paint, so each is fetched once and shared.
// A failed request is forgotten (so the next call retries), and `{ fresh: true }`
// (pull-to-refresh) replaces it with a new request.
let categoriesRequest: Promise<Category[]> | null = null;
let filtersRequest: Promise<ApiFilters | null> | null = null;

function loadFilters(fresh = false) {
  if (fresh || !filtersRequest) {
    const request: Promise<ApiFilters | null> = get<ApiFilters>(ENDPOINTS.CUSTOMER.FILTERS)
      .then((data) => (Array.isArray(data?.headers) ? data : null))
      .catch((err) => {
        // only forget it if a newer request hasn't replaced it meanwhile
        if (filtersRequest === request) filtersRequest = null;
        throw err;
      });
    filtersRequest = request;
  }
  return filtersRequest;
}

const dedupeBy = <T>(items: T[], key: (item: T) => string) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item).toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/* ------------------------------------------------------------------ */
/*  service                                                            */
/* ------------------------------------------------------------------ */

export const liveCatalog: ShopService['catalog'] = {
  categories(options) {
    if (options?.fresh || !categoriesRequest) {
      const request: Promise<Category[]> = get<ApiCategory[]>(ENDPOINTS.CUSTOMER.CATEGORY)
        .then((data) =>
          dedupeBy(
            (Array.isArray(data) ? data : [])
              .filter((c) => c?.code && c.name?.trim())
              .map((c) => ({ code: c.code, name: c.name.trim(), image: resolveImageUrl(c.image) })),
            (c) => c.name,
          ),
        )
        .catch((err) => {
          if (categoriesRequest === request) categoriesRequest = null;
          throw err;
        });
      categoriesRequest = request;
    }
    return categoriesRequest;
  },

  /** There's no brand-list endpoint; the filters response carries them under "Brand". */
  async brands(options) {
    const filters = await loadFilters(options?.fresh);
    const header = filters?.headers.find((h) => h.name?.toLowerCase() === 'brand');
    const names = (header?.childs ?? []).map((c) => (c.childName ?? '').trim()).filter(Boolean);
    return dedupeBy(names, (n) => n).map((name): Brand => ({ name }));
  },

  async filters(options): Promise<CatalogFilters> {
    const data = await loadFilters(options?.fresh);
    if (!data) return { price: null, groups: [] };
    const { minPrice, maxPrice } = data.priceDetails ?? {};
    return {
      price: Number.isFinite(minPrice) && Number.isFinite(maxPrice) ? { min: minPrice, max: maxPrice } : null,
      groups: data.headers
        // category is chosen by navigation, not as a filter
        .filter((h) => h.code?.toUpperCase() !== 'CATEGORY')
        .map((h) => ({
          code: h.code,
          name: h.name,
          options: dedupeBy((h.childs ?? []).map((c) => (c.childName ?? '').trim()), (n) => n),
        }))
        .filter((g) => g.options.length > 0),
    };
  },

  async home(signal) {
    const data = await get<ApiProductGroup[]>(ENDPOINTS.CUSTOMER.DETAILS, { signal });
    return (Array.isArray(data) ? data : [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((group): HomeSection => ({
        code: group.code,
        title: (group.tag ?? '').trim(),
        products: toSummaries(group.products),
      }))
      .filter((section) => section.title && section.products.length > 0);
  },

  async categoryProducts(category, page, filters, signal) {
    const data = await post<ApiProduct[]>(
      ENDPOINTS.CUSTOMER.CATEGORY_PRODUCTS,
      { category, pageNo: page, filters: toApiFilters(filters) },
      { signal },
      // past the last page this answers 102 "Invalid Request." (and 101 when
      // empty) — both mean "no more", not an error
      { accept: [101, 102] },
    );
    return toSummaries(data);
  },

  async sectionProducts(sectionCode, page, signal) {
    const data = await post<ApiProductGroup[]>(
      ENDPOINTS.CUSTOMER.TAG_PRODUCTS,
      { tagId: sectionCode, product: '', pageNo: page, filters: [] },
      { signal },
      { accept: [101] },
    );
    return toSummaries(flattenGroups(data));
  },

  async brandProducts(brand, page, filters, signal) {
    const data = await post<{ products?: ApiBrandProduct[] } | null>(
      ENDPOINTS.CUSTOMER.BRAND,
      { pageNo: page, brandName: brand, filters: toApiFilters(filters) },
      { signal },
      // a page past the end answers 102 rather than an empty list
      { accept: [101, 102] },
    );
    return (data?.products ?? [])
      .map((row) => brandRowToSummary(row, brand))
      .filter((p): p is ProductSummary => p !== null);
  },

  async search(query, page, signal) {
    const data = await get<(ApiProduct | ApiProductGroup)[]>(
      ENDPOINTS.CUSTOMER.DETAILS,
      { params: { product: query, pageNo: page }, signal },
      // same as categories: 102 past the last page
      { accept: [101, 102] },
    );
    return toSummaries(flattenGroups(data));
  },

  /** Never throws — typeahead failures should be silent. */
  async suggestions(query, signal) {
    const trimmed = query.trim();
    if (!trimmed) return [];
    try {
      const data = await get<Record<string, unknown>[]>(
        `${ENDPOINTS.CUSTOMER.SEARCH}/${encodeURIComponent(trimmed)}`,
        { signal },
        { accept: [101] },
      );
      return (Array.isArray(data) ? data : [])
        .map((item) => ({
          id: String(item.code ?? item.mappingCode ?? '').trim(),
          // suggestions arrive as "SKU - Name"; the SKU is noise to a shopper
          name: String(item.productName ?? item.product ?? '')
            .trim()
            .replace(/^[A-Za-z0-9]{4,}\s+-\s+/, ''),
        }))
        .filter((s) => s.id && s.name)
        .slice(0, 8);
    } catch {
      return [];
    }
  },

  async product(id, signal) {
    try {
      const data = await get<ApiProductDetail>(`${ENDPOINTS.CUSTOMER.PRODUCT}/${encodeURIComponent(id)}`, { signal });
      if (!data?.product) throw new ApiError('Product not found.');
      return toDetail(data, id);
    } catch (err) {
      // an unknown code answers with a raw server exception (or HTTP 500)
      if (isCancel(err)) throw err;
      if (err instanceof ApiError || (isAxiosError(err) && (err.response?.status ?? 0) >= 400)) {
        throw new ApiError('This product is not available right now.');
      }
      throw err;
    }
  },
};
