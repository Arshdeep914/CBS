/**
 * The app's own data shapes. Screens only ever see these — the live API and the
 * demo catalogue are both mapped into them, so switching
 * EXPO_PUBLIC_USE_DEMO_PRODUCTS never touches UI code.
 */

export type ProductBadge = 'bestseller' | 'new' | 'deal' | 'trending';

export type ProductSummary = {
  /** The mappingCode — product pages and cart lines are keyed on it. */
  id: string;
  variationCode: string | null;
  name: string;
  brand: string | null;
  price: number;
  /** null when the listing doesn't include an MRP */
  mrp: number | null;
  /** 0 when there's no rating yet */
  rating: number;
  image: string | null;
  isOutOfStock: boolean;
  badge?: ProductBadge;
};

export type Category = {
  code: string;
  name: string;
  image: string | null;
};

export type Brand = { name: string };

export type HomeSection = {
  code: string;
  title: string;
  products: ProductSummary[];
};

export type FilterGroup = {
  code: string;
  name: string;
  options: string[];
};

export type CatalogFilters = {
  price: { min: number; max: number } | null;
  /** Server-side filter groups (brand, colour, size, …). */
  groups: FilterGroup[];
};

/** One server-side filter choice, e.g. `{ code: 'BRAND', value: 'Havells' }`. */
export type FilterSelection = { code: string; value: string };

export type Variant = {
  /** mappingCode for this variant + seller */
  id: string;
  variationCode: string;
  label: string | null;
  price: number;
  mrp: number | null;
  rating: number;
  isOutOfStock: boolean;
  /** null when the backend doesn't say */
  available: number | null;
  images: string[];
};

export type ProductDetail = {
  id: string;
  name: string;
  brand: string | null;
  rating: number;
  reviewCount: number;
  description: string[];
  attributes: { name: string; values: string[] }[];
  /** At least one. */
  variants: Variant[];
  defaultVariantIndex: number;
};

export type CartLine = {
  /** mappingCode — every cart mutation is addressed by it */
  id: string;
  variationCode: string;
  name: string;
  variant: string | null;
  image: string | null;
  price: number;
  mrp: number | null;
  qty: number;
  /** Live sellable stock; 0 can also mean "unknown" for demo items. */
  available: number;
  isOutOfStock: boolean;
};

export type PaymentModes = { cash: boolean; online: boolean };

export type Cart = {
  lines: CartLine[];
  paymentModes: PaymentModes;
};

export type Address = {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
  isPrimary: boolean;
};

export type AddressInput = Omit<Address, 'id' | 'isPrimary'>;

export type OrderItem = {
  productCode: string;
  name: string;
  image: string | null;
  /** Unit price. */
  price: number;
  qty: number;
};

export type Order = {
  id: string;
  number: string;
  /** ISO date string (falls back to the backend's own text if it can't be read) */
  date: string;
  statusCode: number;
  status: string;
  total: number;
  items: OrderItem[];
};

export type PaymentMode = 'online' | 'cash';

/** What Razorpay checkout needs, as returned by the order's first step. */
export type GatewayPayment = {
  orderId: string;
  key: string;
  amount: number;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
};

export type StartOrderResult =
  | { status: 'confirmed'; orderNo: string }
  | { status: 'payment'; token: string; orderNo: string; gateway: GatewayPayment }
  | { status: 'error'; message: string };

export type GatewayResult = { paymentId: string; orderId: string; signature: string };

export type UserProfile = {
  code: string;
  name: string;
  email: string;
};

export type SignInResult = {
  jwt: string;
  pksoftToken: string;
  user: UserProfile;
};

/** For the catalogue lists that are cached app-wide: `fresh` skips the cache (pull-to-refresh, retry). */
export type CacheOptions = { fresh?: boolean };

export type ShopService = {
  catalog: {
    categories(options?: CacheOptions): Promise<Category[]>;
    brands(options?: CacheOptions): Promise<Brand[]>;
    filters(options?: CacheOptions): Promise<CatalogFilters>;
    home(signal?: AbortSignal): Promise<HomeSection[]>;
    categoryProducts(category: string, page: number, filters: FilterSelection[], signal?: AbortSignal): Promise<ProductSummary[]>;
    sectionProducts(sectionCode: string, page: number, signal?: AbortSignal): Promise<ProductSummary[]>;
    brandProducts(brand: string, page: number, filters: FilterSelection[], signal?: AbortSignal): Promise<ProductSummary[]>;
    search(query: string, page: number, signal?: AbortSignal): Promise<ProductSummary[]>;
    suggestions(query: string, signal?: AbortSignal): Promise<{ id: string; name: string }[]>;
    product(id: string, signal?: AbortSignal): Promise<ProductDetail>;
  };
  auth: {
    signIn(email: string, password: string): Promise<SignInResult>;
    /** Creates the account with the chosen password and emails an OTP; `token` identifies the sign-up. */
    register(input: { name: string; email: string; mobile: string; password: string; confirmPassword: string }): Promise<{
      token: string;
      message: string;
    }>;
    /** Confirms the emailed OTP. The account can sign in with its password afterwards. */
    verifyRegistration(email: string, otp: string, token: string): Promise<void>;
    /** `otpSent: false` means the password was simply emailed. */
    requestPasswordReset(email: string, newPassword: string): Promise<{ otpSent: boolean; token: string; message: string }>;
    confirmPasswordReset(email: string, otp: string, newPassword: string, token: string): Promise<void>;
  };
  cart: {
    fetch(): Promise<Cart>;
    add(id: string, variationCode: string, qty: number): Promise<void>;
    remove(id: string): Promise<void>;
    /** Returns the server's quantity when it corrects ours (e.g. clamped to stock). */
    setQty(id: string, qty: number): Promise<{ acknowledged: boolean; qty: number | null }>;
  };
  push: {
    /** Saves this device's push token for the signed-in customer (idempotent). */
    register(input: { token: string; platform: 'android' | 'ios'; deviceName: string | null; appVersion: string | null }): Promise<void>;
    /** Forgets this device's token (sign-out). Never fails on "not found". */
    remove(token: string): Promise<void>;
  };
  counts: {
    /** Number of items in the cart and the wishlist (Count API). */
    fetch(): Promise<{ cart: number; wishlist: number }>;
  };
  wishlist: {
    list(): Promise<ProductSummary[]>;
    add(id: string): Promise<void>;
    remove(id: string): Promise<void>;
  };
  orders: {
    start(input: {
      mode: PaymentMode;
      lines: CartLine[];
      addressId: string;
      total: number;
      prefill: GatewayPayment['prefill'];
    }): Promise<StartOrderResult>;
    completePayment(token: string, payment: GatewayResult): Promise<{ ok: true } | { ok: false; message: string }>;
    cancel(token: string): Promise<void>;
    /** One page of orders. An order can continue on the next page (the API pages by product line). */
    list(page: number, pageSize: number): Promise<{ orders: Order[]; hasMore: boolean }>;
  };
  addresses: {
    list(): Promise<Address[]>;
    create(input: AddressInput): Promise<void>;
    update(id: string, input: AddressInput): Promise<void>;
    remove(id: string): Promise<void>;
    setPrimary(id: string): Promise<void>;
  };
};
