import { Env } from '@/config/env';
import { demoShop } from '@/services/demo';
import { liveAddresses } from '@/services/live/addresses';
import { liveAuth } from '@/services/live/auth';
import { liveCart } from '@/services/live/cart';
import { liveCatalog } from '@/services/live/catalog';
import { liveCounts } from '@/services/live/counts';
import { liveOrders } from '@/services/live/orders';
import { livePush } from '@/services/live/push';
import { liveWishlist } from '@/services/live/wishlist';
import type { ShopService } from '@/services/types';

/** True when products come from the built-in demo catalogue (EXPO_PUBLIC_USE_DEMO_PRODUCTS). */
export const isDemo = Env.useDemoProducts;

/**
 * The app's data source.
 *
 * EXPO_PUBLIC_USE_DEMO_PRODUCTS only swaps what is built on products —
 * catalogue, cart, counts, wishlist and orders — since demo product ids mean nothing to
 * the live cart. Sign-in, sign-up, password reset, saved addresses and push tokens
 * belong to the real account, so they always hit the API (unless no API URL is set at all).
 */
export const shop: ShopService = {
  auth: Env.offline ? demoShop.auth : liveAuth,
  addresses: Env.offline ? demoShop.addresses : liveAddresses,
  push: Env.offline ? demoShop.push : livePush,
  catalog: isDemo ? demoShop.catalog : liveCatalog,
  cart: isDemo ? demoShop.cart : liveCart,
  counts: isDemo ? demoShop.counts : liveCounts,
  wishlist: isDemo ? demoShop.wishlist : liveWishlist,
  orders: isDemo ? demoShop.orders : liveOrders,
};

export type * from '@/services/types';
