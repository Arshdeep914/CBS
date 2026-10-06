/**
 * Wire types — exactly what the backend sends. Screens never use these
 * directly; `src/services/live` maps them into the app's own types.
 */

/** Every endpoint answers with this envelope. */
export type ApiEnvelope<T> = {
  status: number;
  messageCode: number;
  message: string;
  data: T;
};

/** `status: 200` alone doesn't mean success — always check `messageCode`. */
export const MESSAGE_CODE = {
  SUCCESS: 100,
  NO_RECORD: 101,
  NOT_VERIFIED: 102,
  ALREADY_EXISTS: 108,
  VALIDATION_FAILED: 126,
  ECHOED_BAG: 128,
} as const;

/* ------------------------------- catalogue ------------------------------- */

export type ApiImage = {
  isPrimary: boolean;
  productCode: string | null;
  variationCode: string | null;
  image: string;
  order: number;
};

export type ApiProduct = {
  product: string;
  price: number;
  mrp?: number;
  rating: number;
  images: ApiImage[];
  /** null for products not yet mapped to a seller price */
  mappingCode: string | null;
  variationCode: string | null;
  isFavourite: boolean;
  isOutOfStock: boolean;
};

export type ApiProductGroup = {
  tag: string;
  code: string;
  order: number;
  products: ApiProduct[];
};

export type ApiCategory = {
  code: string;
  name: string;
  image?: string;
};

export type ApiFilterHeader = {
  name: string;
  code: string;
  childs: { childName: string; childCode: string }[];
};

export type ApiFilters = {
  priceDetails: { minPrice: number; maxPrice: number };
  headers: ApiFilterHeader[];
};

/** A filter selection as the listing endpoints expect it. */
export type ApiFilterSelection = { code: string; typeName: string };

/** `Customer/brand` rows use their own shape, with pricing nested on `sellerPrice`. */
export type ApiBrandProduct = {
  product?: string;
  variationName?: string;
  p_Image?: string;
  v_Image?: string;
  sellerPrice?: {
    mappingCode?: string;
    variationCode?: string;
    price?: number;
    mrp?: number;
    rating?: number;
    isOutOfStock?: boolean;
  } | null;
};

export type ApiSellerPrice = {
  productCode: string;
  variationCode: string;
  mrp: number;
  price: number;
  rating: number | null;
  totalReviews?: number;
  isOutOfStock: boolean;
  mappingCode: string;
};

export type ApiVariant = {
  product: string;
  brandName: string | null;
  variationName: string | null;
  mrp: number;
  price: number;
  rating: number;
  productRating?: number;
  productTotalReviews?: number;
  avail: number;
  isOutOfStock: boolean | null;
  keyDescription: string | null;
  images: ApiImage[];
  /** absent on sparse catalogue rows — always guard before reading */
  sellerPrice?: ApiSellerPrice | null;
  sellers?: ApiSellerPrice[];
};

export type ApiProductDetail = {
  product: ApiVariant;
  variations: ApiVariant[];
  attributes: { name: string; details: { name: string }[] }[];
};

/* --------------------------------- cart --------------------------------- */

export type ApiCartItem = {
  availableStock: number;
  variationCode: string;
  variationName: string | null;
  productCode: string;
  product: string;
  mrp: number;
  price: number;
  image: string | null;
  isStockOut: boolean;
  qty: number;
  sellerPriceDTO?: { mappingCode?: string } | null;
};

export type ApiCartMutation = { cartCount?: number };

/** A CheckList (wishlist) row. Pricing sits on `sellerPriceDTO`, with root-level fallbacks. */
export type ApiWishlistItem = {
  mappingCode?: string;
  variationCode?: string;
  product?: string;
  productName?: string;
  name?: string;
  variationName?: string | null;
  image?: string | null;
  price?: number;
  mrp?: number;
  rating?: number;
  isStockOut?: boolean;
  isOutOfStock?: boolean;
  sellerPriceDTO?: Partial<ApiSellerPrice> | null;
  sellerPrice?: Partial<ApiSellerPrice> | null;
};

/* ------------------------------- address -------------------------------- */

export type ApiAddress = {
  id?: string | number;
  code?: string | number;
  fullName?: string;
  mobileNo?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  landMark?: string;
  cityName?: string;
  stateName?: string;
  countryName?: string;
  pinCode?: string;
  isPrimary?: boolean;
};

/* -------------------------------- orders -------------------------------- */

export type ApiOrderLine = {
  orderCode: string;
  orderNo: string;
  orderDate: string;
  status: number;
  productCode: string;
  productName: string;
  image: string | null;
  amount: number;
  quantity: number;
};

/** `Order/proceed` hands back the token every later call in the flow needs. */
export type ApiProceedOrder = {
  token?: string;
  orderNo?: string;
  orderId?: string;
  razorpayOrderId?: string;
  receiptNo?: string;
  key?: string;
};

export const PAYMENT_MODE = { CASH: 1, ONLINE: 2 } as const;

/* --------------------------------- auth --------------------------------- */

export type ApiLogin = {
  token: string;
  pksoft_token: string;
  userModel: { code: string; name: string; userName: string };
};

export type ApiOtpToken = { token: string };
