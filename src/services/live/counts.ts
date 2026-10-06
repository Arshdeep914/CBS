import { request } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiCounts } from '@/api/types';
import { encodedTimestamp } from '@/api/timestamp';
import { currentUid } from '@/lib/session-storage';
import type { ShopService } from '@/services/types';

export const liveCounts: ShopService['counts'] = {
  /**
   * Cart and wishlist badge numbers in one call, as the Chicstylista storefront
   * does. Cart and wishlist live on the server only, so the mapping arrays (once
   * used to merge a signed-out visitor's local lists) are always empty.
   */
  async fetch() {
    const data = await request<ApiCounts>({
      method: 'post',
      url: `${ENDPOINTS.CUSTOMER.COUNT}/${currentUid()}`,
      data: { c_mappings: [], w_mappings: [], date: encodedTimestamp() },
    });
    return { cart: Number(data?.cartCount) || 0, wishlist: Number(data?.wishlistCount) || 0 };
  },
};
