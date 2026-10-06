/**
 * Every backend route the app talks to, in one place. Mirrors the web
 * storefronts (registration follows the Sardar Times site's v2 flow). Paths are relative — the axios client supplies the base URL.
 */
export const ENDPOINTS = {
  CUSTOMER: {
    /** v2 sign-up: the customer chooses their password up front, then verifies an emailed OTP. */
    REGISTER: 'api/pk/Customer/v2/register',
    VERIFY_OTP: 'api/pk/Customer/v2/verify-otp',
    LOGIN: 'api/pk/Customer/auth',
    FORGET_PASSWORD: 'api/pk/Customer/forget-password',
    FORGET_PASSWORD_OTP: 'api/pk/Customer/verify-forget-password-otp',
    VERIFY_CSRF: 'api/pk/Customer/verify-cs',

    CATEGORY: 'api/pk/Customer/load/category',
    DETAILS: 'api/pk/Customer/load/details',
    CATEGORY_PRODUCTS: 'api/pk/Customer/loadCategoryProducts',
    TAG_PRODUCTS: 'api/pk/Customer/loadTagWiseProducts',
    PRODUCT: 'api/pk/Customer/product',
    FILTERS: 'api/pk/Customer/filters',
    SEARCH: 'api/pk/Customer/search',
    BRAND: 'api/pk/Customer/brand',

    BAG: 'api/pk/Customer/Bag',
    CART: 'api/pk/Customer/Cart',
    /** Reads the wishlist (POST with `mappingCodes: []`). */
    CHECKLIST: 'api/pk/Customer/CheckList',
    /** `/add` and `/remove`. */
    WISHLIST: 'api/pk/Customer/wishlist',
  },
  ORDER: {
    PROCEED: 'api/pk/Order/proceed',
    SUCCESS: 'api/pk/Order/success',
    CANCEL: 'api/pk/Order/cancel',
    USER_ORDERS: 'api/pk/User/Orders',
  },
  ADDRESS: {
    LIST: 'api/pk/Customer/Address/List',
    CREATE: 'api/pk/Customer/Address/Create',
    UPDATE: 'api/pk/Customer/Address/Update',
    DELETE: 'api/pk/Customer/Address/Delete',
    SET_PRIMARY: 'api/pk/Customer/Address/Primary',
  },
} as const;
