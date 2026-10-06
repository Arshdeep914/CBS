import { post, requestEnvelope, resolveImageUrl } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiCartMutation, ApiWishlistItem } from '@/api/types';
import { encodedTimestamp } from '@/api/timestamp';
import { currentUid } from '@/lib/session-storage';
import type { ProductSummary, ShopService } from '@/services/types';

function toSummary(raw: ApiWishlistItem): ProductSummary | null {
  const seller = raw.sellerPriceDTO ?? raw.sellerPrice ?? {};
  const id = String(seller.mappingCode ?? raw.mappingCode ?? raw.variationCode ?? '');
  if (!id) return null;
  const name = raw.product ?? raw.productName ?? raw.name ?? 'Product';
  const variant = raw.variationName?.trim();
  const mrp = Number(seller.mrp ?? raw.mrp) || 0;
  return {
    id,
    variationCode: String(raw.variationCode ?? seller.variationCode ?? '') || null,
    name: variant ? `${name} (${variant})` : name,
    brand: null,
    price: Number(seller.price ?? raw.price) || 0,
    mrp: mrp > 0 ? mrp : null,
    rating: Number(seller.rating ?? raw.rating) || 0,
    image: resolveImageUrl(raw.image),
    isOutOfStock: Boolean(raw.isStockOut ?? seller.isOutOfStock ?? raw.isOutOfStock),
  };
}

export const liveWishlist: ShopService['wishlist'] = {
  async list() {
    const envelope = await requestEnvelope<ApiWishlistItem[]>({
      method: 'post',
      url: ENDPOINTS.CUSTOMER.CHECKLIST,
      data: { uid: currentUid(), mappingCodes: [], d: encodedTimestamp() },
    });
    // like Bag, the success code varies, so read whatever list came back
    if (!Array.isArray(envelope?.data)) return [];
    return envelope.data.map(toSummary).filter((item): item is ProductSummary => item !== null);
  },

  async add(id) {
    await post<ApiCartMutation>(`${ENDPOINTS.CUSTOMER.WISHLIST}/add`, {
      uid: currentUid(),
      mappingCode: id,
      d: encodedTimestamp(),
    });
  },

  async remove(id) {
    await post<ApiCartMutation>(`${ENDPOINTS.CUSTOMER.WISHLIST}/remove`, {
      uid: currentUid(),
      mappingCode: id,
      d: encodedTimestamp(),
    });
  },
};
