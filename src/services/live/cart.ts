import { post, requestEnvelope, resolveImageUrl } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { MESSAGE_CODE, type ApiCartItem, type ApiCartMutation } from '@/api/types';
import { encodedTimestamp } from '@/api/timestamp';
import { currentUid } from '@/lib/session-storage';
import type { Cart, CartLine, ShopService } from '@/services/types';

/** mappingCode is what every cart mutation is addressed by. */
function lineId(item: ApiCartItem) {
  return String(item.sellerPriceDTO?.mappingCode || item.variationCode || item.productCode || '');
}

function toLine(item: ApiCartItem): CartLine | null {
  const id = lineId(item);
  if (!id) return null;
  const mrp = Number(item.mrp) || 0;
  return {
    id,
    variationCode: item.variationCode ?? '',
    name: item.product ?? 'Product',
    variant: item.variationName?.trim() || null,
    image: resolveImageUrl(item.image),
    price: Number(item.price) || 0,
    mrp: mrp > 0 ? mrp : null,
    qty: Number(item.qty) || 0,
    available: Number(item.availableStock) || 0,
    isOutOfStock: Boolean(item.isStockOut),
  };
}

/**
 * The Bag payload has shifted shape over time (a bare array or `{ items }`) and
 * its success code varies (100 or 128), so read whatever array is there.
 */
function readBag(payload: unknown): Cart {
  const data = (payload ?? {}) as Record<string, unknown>;
  const items = Array.isArray(payload)
    ? (payload as ApiCartItem[])
    : Array.isArray(data.items)
      ? (data.items as ApiCartItem[])
      : [];
  const mode = data.enable_mode as { cash?: boolean; online?: boolean } | undefined;
  return {
    lines: items.map(toLine).filter((line): line is CartLine => line !== null),
    paymentModes: { cash: mode?.cash ?? true, online: mode?.online ?? true },
  };
}

export const liveCart: ShopService['cart'] = {
  async fetch() {
    const envelope = await requestEnvelope<unknown>({
      method: 'post',
      url: ENDPOINTS.CUSTOMER.BAG,
      data: { uid: currentUid(), variations: [], d: encodedTimestamp(), mode: 'fetchCartItems' },
    });
    return readBag(envelope.data);
  },

  async add(id, variationCode, qty) {
    await post<ApiCartMutation>(`${ENDPOINTS.CUSTOMER.CART}/add`, {
      uid: currentUid(),
      mappingCode: id,
      variationCode: variationCode || '',
      qty,
      d: encodedTimestamp(),
    });
  },

  async remove(id) {
    await post<ApiCartMutation>(`${ENDPOINTS.CUSTOMER.CART}/remove`, {
      uid: currentUid(),
      mappingCode: id,
      d: encodedTimestamp(),
    });
  },

  /**
   * The server answers a quantity change with just the touched row (often with
   * a null qty), NOT a fresh bag — so only its corrected quantity is returned.
   */
  async setQty(id, qty) {
    const envelope = await requestEnvelope<unknown>({
      method: 'post',
      url: ENDPOINTS.CUSTOMER.BAG,
      data: {
        uid: currentUid(),
        variations: [{ mappingCode: id, qty, isOutOfStock: false }],
        d: encodedTimestamp(),
        mode: 'updateQty',
      },
    });
    const acknowledged =
      envelope.messageCode === MESSAGE_CODE.SUCCESS || envelope.messageCode === MESSAGE_CODE.ECHOED_BAG;
    const echoed = readBag(envelope.data).lines.find((line) => line.id === id);
    return { acknowledged, qty: echoed && echoed.qty > 0 ? echoed.qty : null };
  },
};
