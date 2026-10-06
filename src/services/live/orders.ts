import { requestEnvelope, resolveImageUrl } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { MESSAGE_CODE, PAYMENT_MODE, type ApiOrderLine, type ApiOrdersPage, type ApiProceedOrder } from '@/api/types';
import { encodedTimestamp } from '@/api/timestamp';
import { Env } from '@/config/env';
import { parseApiDate } from '@/lib/format';
import { currentUid } from '@/lib/session-storage';
import type { Order, ShopService } from '@/services/types';

/** Labels for the numeric status codes (older backend builds sent numbers). */
export const ORDER_STATUS: Record<number, string> = {
  1: 'Processing',
  2: 'Confirmed',
  3: 'Confirmed',
  4: 'Preparing',
  5: 'Shipped',
  6: 'Delivered',
  7: 'Cancelled',
  8: 'Deleted',
  9: 'Returned',
};

/**
 * The backend's status labels → the app's status codes (see ORDER_STEPS),
 * which drive the timeline, the pill colour and the Active/Delivered/Cancelled
 * tabs. Keys are lower-cased letters only, so "New Order" → "neworder".
 * Same idea as the Chicstylista storefront's STATUS_BY_LABEL.
 */
const STATUS_CODE_BY_LABEL: Record<string, number> = {
  new: 1,
  neworder: 1,
  pending: 1,
  placed: 1,
  orderplaced: 1,
  processing: 1,
  confirmed: 2,
  accepted: 2,
  confirmedbyseller: 3,
  preparing: 4,
  packed: 4,
  readytoship: 4,
  shipped: 5,
  dispatched: 5,
  intransit: 5,
  outfordelivery: 5,
  delivered: 6,
  deliverd: 6,
  completed: 6,
  cancelled: 7,
  canceled: 7,
  rejected: 7,
  failed: 7,
  delete: 8,
  deleted: 8,
  return: 9,
  returned: 9,
};

/** Reads `status` whether it's a label ("New Order") or a number; unknown labels count as in progress. */
function readStatus(raw: string | number): { code: number; label: string } {
  if (typeof raw === 'number' || /^\s*\d+\s*$/.test(String(raw))) {
    const code = Number(raw);
    return { code, label: ORDER_STATUS[code] ?? 'Processing' };
  }
  const label = String(raw ?? '').trim();
  const code = STATUS_CODE_BY_LABEL[label.toLowerCase().replace(/[^a-z]/g, '')] ?? 1;
  return { code, label: label || ORDER_STATUS[code] };
}

const RAZORPAY_ORDER_ID = /^order_[A-Za-z0-9]+$/;

function finalize(payload: Record<string, unknown>) {
  return requestEnvelope<unknown>({
    method: 'post',
    url: ENDPOINTS.ORDER.SUCCESS,
    data: { ...payload, uid: currentUid(), d: encodedTimestamp() },
  });
}

async function cancel(token?: string) {
  if (!token) return;
  try {
    await requestEnvelope<unknown>({
      method: 'post',
      url: ENDPOINTS.ORDER.CANCEL,
      data: { token, uid: currentUid(), d: encodedTimestamp() },
    });
  } catch (err) {
    // best-effort: a dangling pending order is better than a crash here
    console.warn("Couldn't cancel the pending order", err);
  }
}

/**
 * Order lines point at `…/Uploads/107/Products/<productCode>/<file>`, which the
 * server rejects (401). The file actually lives one folder down, under `1/` —
 * the same layout catalogue images use (`…/Products/1/<productCode>/<file>`).
 * Remove this once the backend returns the full path.
 */
function orderImagePath(image: string | null) {
  return (image ?? '')
    .replace(/\\/g, '/')
    .replace(/\/Products\/(?!1\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/)/i, '/Products/1/$1');
}

/** The orders API returns one row per line item; group them back into orders. */
function groupOrderLines(lines: ApiOrderLine[]): Order[] {
  const grouped = new Map<string, Order>();
  for (const line of lines) {
    let order = grouped.get(line.orderCode);
    if (!order) {
      const status = readStatus(line.status);
      order = {
        id: line.orderCode,
        number: line.orderNo,
        date: parseApiDate(line.orderDate)?.toISOString() ?? line.orderDate,
        statusCode: status.code,
        status: status.label,
        total: 0,
        items: [],
      };
      grouped.set(line.orderCode, order);
    }
    // `amount` is the line total, so the unit price is amount ÷ quantity
    const lineTotal = Number(line.amount) || 0;
    const qty = Number(line.quantity) || 0;
    order.items.push({
      productCode: line.productCode,
      name: line.productName,
      image: resolveImageUrl(orderImagePath(line.image)),
      price: qty > 0 ? lineTotal / qty : lineTotal,
      qty,
    });
    order.total += lineTotal;
  }
  return [...grouped.values()];
}

export const liveOrders: ShopService['orders'] = {
  /**
   * Creates the order server-side. Cash orders are confirmed straight away;
   * online orders come back with what Razorpay checkout needs, and the caller
   * finishes them with `completePayment` (or `cancel`).
   */
  async start({ mode, lines, addressId, total, prefill }) {
    let envelope;
    try {
      envelope = await requestEnvelope<ApiProceedOrder>({
        method: 'post',
        url: ENDPOINTS.ORDER.PROCEED,
        data: {
          uid: currentUid(),
          variations: lines.map((line) => ({ mappingCode: line.id, qty: line.qty, isOutOfStock: line.isOutOfStock })),
          addressCode: addressId,
          d: encodedTimestamp(),
          mode: mode === 'online' ? PAYMENT_MODE.ONLINE : PAYMENT_MODE.CASH,
        },
      });
    } catch {
      return { status: 'error', message: "Couldn't start your order. Please try again." };
    }

    if (envelope.messageCode !== MESSAGE_CODE.SUCCESS) {
      return { status: 'error', message: envelope.message || "Couldn't place your order." };
    }

    const order = envelope.data ?? {};
    const token = order.token ?? '';

    if (mode === 'cash') {
      try {
        const confirmed = await finalize({ trnxNo: 'x', token });
        if (confirmed.messageCode === MESSAGE_CODE.SUCCESS) {
          return { status: 'confirmed', orderNo: order.orderNo ?? '' };
        }
        await cancel(token);
        return { status: 'error', message: confirmed.message || "Couldn't confirm your order." };
      } catch {
        await cancel(token);
        return { status: 'error', message: "Couldn't confirm your order. Please try again." };
      }
    }

    const gatewayOrderId = String(order.orderNo || order.orderId || order.razorpayOrderId || '').trim();
    const key = order.key || Env.razorpayKeyId;
    if (!RAZORPAY_ORDER_ID.test(gatewayOrderId) || !key) {
      await cancel(token);
      return { status: 'error', message: "Online payment isn't available right now. Please choose cash on delivery." };
    }

    return {
      status: 'payment',
      token,
      orderNo: gatewayOrderId,
      gateway: {
        orderId: gatewayOrderId,
        key,
        amount: total,
        description: order.receiptNo || `Order ${gatewayOrderId}`,
        prefill,
      },
    };
  },

  async completePayment(token, payment) {
    try {
      const confirmed = await finalize({
        payment_id: payment.paymentId,
        order_id: payment.orderId,
        signature: payment.signature,
        token,
      });
      if (confirmed.messageCode === MESSAGE_CODE.SUCCESS) return { ok: true };
      await cancel(token);
      return {
        ok: false,
        message: confirmed.message || "We couldn't verify the payment. Any amount debited will be refunded.",
      };
    } catch {
      await cancel(token);
      return { ok: false, message: "We couldn't verify the payment. Any amount debited will be refunded." };
    }
  },

  cancel,

  async list(page, pageSize) {
    // same window the web storefront asks for: the last 180 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 180);
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const envelope = await requestEnvelope<ApiOrdersPage>({
      method: 'post',
      url: ENDPOINTS.ORDER.USER_ORDERS,
      data: {
        pageNo: page,
        pageSize,
        orderNo: '',
        searchText: '',
        startDate: ymd(start),
        endDate: ymd(end),
        d: encodedTimestamp(),
      },
    });
    if (envelope.messageCode !== MESSAGE_CODE.SUCCESS || !envelope.data) return { orders: [], hasMore: false };
    const lines = envelope.data.orders ?? [];
    // trust the page count when it's sent; otherwise a short page means the end
    const totalPages = Number(envelope.data.totalPageCount);
    const hasMore = Number.isFinite(totalPages) && totalPages > 0 ? page < totalPages : lines.length >= pageSize;
    return { orders: groupOrderLines(lines), hasMore };
  },
};
