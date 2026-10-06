/**
 * Offline implementation of ShopService, built on the CBS demo catalogue.
 * With EXPO_PUBLIC_USE_DEMO_PRODUCTS=true its catalogue, cart, wishlist and
 * orders are used (nothing product-related leaves the device). Its auth and
 * addresses are only used when no API URL is configured at all, in which case
 * any sign-in is accepted. Small delays mimic the network so loaders behave the
 * same as against the live API.
 */
import {
  brands as demoBrands,
  categories as demoCategories,
  getBrand,
  getProduct,
  products as demoProducts,
  type Product,
} from '@/data/catalog';
import { imageUrl } from '@/data/images';
import type {
  Address,
  Cart,
  CartLine,
  HomeSection,
  Order,
  ProductBadge,
  ProductDetail,
  ProductSummary,
  ShopService,
} from '@/services/types';

const PAGE_SIZE = 12;

const wait = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

function page<T>(items: T[], pageNo: number) {
  return items.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE);
}

const BADGE: Record<string, ProductBadge> = {
  bestseller: 'bestseller',
  new: 'new',
  'bulk-deal': 'deal',
  trending: 'trending',
};

function badgeOf(product: Product): ProductBadge | undefined {
  const order = ['bulk-deal', 'bestseller', 'trending', 'new'] as const;
  const tag = order.find((t) => product.tags.includes(t));
  return tag ? BADGE[tag] : undefined;
}

function summary(product: Product): ProductSummary {
  return {
    id: product.id,
    variationCode: `${product.id}-v1`,
    name: product.name,
    brand: getBrand(product.brandId)?.name ?? null,
    price: product.price,
    mrp: product.mrp,
    rating: product.rating,
    image: imageUrl(product.images[0], 600),
    isOutOfStock: product.stock === 'out-of-stock',
    badge: badgeOf(product),
  };
}

const categoryByName = (name: string) =>
  demoCategories.find((c) => c.name.toLowerCase() === name.toLowerCase());

/* ------------------------------------------------------------------ */
/*  mutable demo state                                                 */
/* ------------------------------------------------------------------ */

let cartLines: CartLine[] = [];
let wishlistIds: string[] = [];

let addresses: Address[] = [
  {
    id: 'home',
    fullName: 'Rahul Sharma',
    mobile: '9811045672',
    email: 'rahul@example.com',
    line1: 'Flat 304, Green Park Residency',
    line2: 'Sector 21',
    landmark: 'Near City Mall',
    city: 'Gurugram',
    state: 'Haryana',
    pinCode: '122016',
    isPrimary: true,
  },
  {
    id: 'office',
    fullName: 'Rahul Sharma',
    mobile: '9811045672',
    email: 'rahul@example.com',
    line1: '5th Floor, Cyber Hub Tower B',
    line2: 'DLF Phase 2',
    landmark: '',
    city: 'Gurugram',
    state: 'Haryana',
    pinCode: '122002',
    isPrimary: false,
  },
];

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function demoOrder(id: string, days: number, statusCode: number, status: string, lines: [string, number][]): Order {
  const items = lines.flatMap(([productId, qty]) => {
    const p = getProduct(productId);
    return p ? [{ productCode: p.id, name: p.name, image: imageUrl(p.images[0], 200), price: p.price, qty }] : [];
  });
  return {
    id,
    number: id,
    date: daysAgo(days),
    statusCode,
    status,
    total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    items,
  };
}

let orders: Order[] = [
  demoOrder('CBS-10418', 1, 5, 'Shipped', [
    ['cbs-triply-cooker-5l', 1],
    ['kit-nonstick-kadai-24', 1],
  ]),
  demoOrder('CBS-10391', 6, 6, 'Delivered', [
    ['cq-coffee-mugs-6', 1],
    ['an-insulated-bottle-750', 2],
  ]),
  demoOrder('CBS-10322', 19, 6, 'Delivered', [['vm-mixer-750', 1]]),
  demoOrder('CBS-10287', 33, 7, 'Cancelled', [['vm-air-fryer-4-2', 1]]),
];

/* ------------------------------------------------------------------ */
/*  service                                                            */
/* ------------------------------------------------------------------ */

export const demoShop: ShopService = {
  catalog: {
    async categories() {
      await wait(300);
      return demoCategories.map((c) => ({ code: c.id, name: c.name, image: imageUrl(c.image, 200) }));
    },

    async brands() {
      await wait(200);
      return demoBrands.map((b) => ({ name: b.name }));
    },

    async filters() {
      await wait(200);
      return {
        price: { min: 0, max: 10000 },
        groups: [{ code: 'BRAND', name: 'Brand', options: demoBrands.map((b) => b.name) }],
      };
    },

    async home() {
      await wait(600);
      const byTag = (tag: Product['tags'][number]) => demoProducts.filter((p) => p.tags.includes(tag)).map(summary);
      const sections: HomeSection[] = [
        { code: 'bestseller', title: 'Bestsellers', products: byTag('bestseller').slice(0, 10) },
        { code: 'bulk-deal', title: 'Deals of the day', products: byTag('bulk-deal').slice(0, 10) },
        { code: 'trending', title: 'Trending now', products: byTag('trending').slice(0, 10) },
        { code: 'new', title: 'New arrivals', products: byTag('new').slice(0, 10) },
      ];
      return sections;
    },

    async categoryProducts(category, pageNo, filters) {
      await wait();
      const cat = categoryByName(category);
      const brandFilter = filters.filter((f) => f.code === 'BRAND').map((f) => f.value);
      const price = filters.find((f) => f.code === 'price')?.value.split('-').map(Number);
      const list = demoProducts
        .filter((p) => !cat || p.categoryId === cat.id)
        .filter((p) => brandFilter.length === 0 || brandFilter.includes(getBrand(p.brandId)?.name ?? ''))
        .filter((p) => !price || (p.price >= price[0] && p.price <= price[1]));
      return page(list.map(summary), pageNo);
    },

    async sectionProducts(code, pageNo) {
      await wait();
      return page(
        demoProducts.filter((p) => p.tags.includes(code as Product['tags'][number])).map(summary),
        pageNo,
      );
    },

    async brandProducts(brand, pageNo) {
      await wait();
      const match = demoBrands.find((b) => b.name.toLowerCase() === brand.toLowerCase());
      return page(demoProducts.filter((p) => p.brandId === match?.id).map(summary), pageNo);
    },

    async search(query, pageNo) {
      await wait();
      const words = query.toLowerCase().split(/\s+/).filter(Boolean);
      const list = demoProducts.filter((p) => {
        const text = `${p.name} ${getBrand(p.brandId)?.name ?? ''} ${p.highlights.join(' ')}`.toLowerCase();
        return words.every((w) => text.includes(w.replace(/s$/, '')));
      });
      return page(list.map(summary), pageNo);
    },

    async suggestions(query) {
      await wait(150);
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return demoProducts
        .filter((p) => p.name.toLowerCase().includes(q))
        .slice(0, 8)
        .map((p) => ({ id: p.id, name: p.name }));
    },

    async product(id) {
      await wait(500);
      const p = getProduct(id);
      if (!p) throw new Error('This product is not available right now.');
      const detail: ProductDetail = {
        id: p.id,
        name: p.name,
        brand: getBrand(p.brandId)?.name ?? null,
        rating: p.rating,
        reviewCount: p.ratingCount,
        description: p.highlights,
        attributes: p.specs.filter((s) => s.label !== 'Brand').map((s) => ({ name: s.label, values: [s.value] })),
        variants: [
          {
            id: p.id,
            variationCode: `${p.id}-v1`,
            label: null,
            price: p.price,
            mrp: p.mrp,
            rating: p.rating,
            isOutOfStock: p.stock === 'out-of-stock',
            available: p.stock === 'low-stock' ? 3 : null,
            images: p.images.map((key) => imageUrl(key, 900)),
          },
        ],
        defaultVariantIndex: 0,
      };
      return detail;
    },
  },

  auth: {
    async signIn(email) {
      await wait(700);
      const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return { jwt: 'demo', pksoftToken: 'demo', user: { code: 'demo-user', name: name || 'Demo Shopper', email } };
    },
    async register() {
      await wait(700);
      return { token: 'demo', message: 'Demo mode: enter any 6-digit code.' };
    },
    async verifyRegistration() {
      await wait(600);
    },
    async requestPasswordReset() {
      await wait(600);
      return { otpSent: true, token: 'demo', message: 'Demo mode: enter any 6-digit code.' };
    },
    async confirmPasswordReset() {
      await wait(600);
    },
  },

  cart: {
    async fetch(): Promise<Cart> {
      await wait(350);
      return { lines: cartLines.map((l) => ({ ...l })), paymentModes: { cash: true, online: true } };
    },
    async add(id, variationCode, qty) {
      await wait(350);
      const existing = cartLines.find((l) => l.id === id);
      if (existing) {
        existing.qty += qty;
        return;
      }
      const p = getProduct(id);
      if (!p) throw new Error('This product is no longer available.');
      cartLines.push({
        id,
        variationCode,
        name: p.name,
        variant: null,
        image: imageUrl(p.images[0], 200),
        price: p.price,
        mrp: p.mrp,
        qty,
        available: p.stock === 'low-stock' ? 3 : 0,
        isOutOfStock: p.stock === 'out-of-stock',
      });
    },
    async remove(id) {
      await wait(300);
      cartLines = cartLines.filter((l) => l.id !== id);
    },
    async setQty(id, qty) {
      await wait(300);
      const line = cartLines.find((l) => l.id === id);
      if (!line) return { acknowledged: false, qty: null };
      const clamped = line.available > 0 ? Math.min(qty, line.available) : qty;
      line.qty = clamped;
      return { acknowledged: true, qty: clamped };
    },
  },

  counts: {
    async fetch() {
      await wait(200);
      return { cart: cartLines.length, wishlist: wishlistIds.length };
    },
  },

  wishlist: {
    async list() {
      await wait(350);
      return wishlistIds.flatMap((id) => {
        const p = getProduct(id);
        return p ? [summary(p)] : [];
      });
    },
    async add(id) {
      await wait(250);
      if (!wishlistIds.includes(id)) wishlistIds = [id, ...wishlistIds];
    },
    async remove(id) {
      await wait(250);
      wishlistIds = wishlistIds.filter((w) => w !== id);
    },
  },

  orders: {
    async start({ mode, lines }) {
      await wait(900);
      const orderNo = `CBS-${10500 + orders.length}`;
      if (mode === 'online') {
        // there's no gateway in demo mode, so online orders are confirmed directly
      }
      const items = lines.map((l) => ({ productCode: l.id, name: l.name, image: l.image, price: l.price, qty: l.qty }));
      orders = [
        {
          id: orderNo,
          number: orderNo,
          date: new Date().toISOString(),
          statusCode: 1,
          status: 'Processing',
          total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
          items,
        },
        ...orders,
      ];
      cartLines = [];
      return { status: 'confirmed', orderNo };
    },
    async completePayment() {
      return { ok: true };
    },
    async cancel() {},
    async list(pageNo, pageSize) {
      await wait(500);
      return orders.slice((pageNo - 1) * pageSize, pageNo * pageSize);
    },
  },

  addresses: {
    async list() {
      await wait(350);
      return addresses.map((a) => ({ ...a }));
    },
    async create(input) {
      await wait(500);
      addresses = [...addresses, { ...input, id: `addr-${Date.now()}`, isPrimary: addresses.length === 0 }];
    },
    async update(id, input) {
      await wait(500);
      addresses = addresses.map((a) => (a.id === id ? { ...a, ...input } : a));
    },
    async remove(id) {
      await wait(400);
      const removed = addresses.find((a) => a.id === id);
      addresses = addresses.filter((a) => a.id !== id);
      if (removed?.isPrimary && addresses[0]) addresses[0] = { ...addresses[0], isPrimary: true };
    },
    async setPrimary(id) {
      await wait(300);
      addresses = addresses.map((a) => ({ ...a, isPrimary: a.id === id }));
    },
  },
};
