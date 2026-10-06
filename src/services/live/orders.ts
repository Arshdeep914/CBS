import { requestEnvelope, resolveImageUrl } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { MESSAGE_CODE, PAYMENT_MODE, type ApiOrderLine, type ApiProceedOrder } from '@/api/types';
import { encodedTimestamp } from '@/api/timestamp';
import { Env } from '@/config/env';
import { currentUid } from '@/lib/session-storage';
import type { Order, ShopService } from '@/services/types';

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

/** The orders API returns one row per line item; group them back into orders. */
function groupOrderLines(lines: ApiOrderLine[]): Order[] {
  const grouped = new Map<string, Order>();
  for (const line of lines) {
    let order = grouped.get(line.orderCode);
    if (!order) {
      order = {
        id: line.orderCode,
        number: line.orderNo,
        date: line.orderDate,
        statusCode: line.status,
        status: ORDER_STATUS[line.status] ?? 'Processing',
        total: 0,
        items: [],
      };
      grouped.set(line.orderCode, order);
    }
    order.items.push({
      productCode: line.productCode,
      name: line.productName,
      image: resolveImageUrl(line.image),
      price: Number(line.amount) || 0,
      qty: Number(line.quantity) || 0,
    });
    order.total += (Number(line.amount) || 0) * (Number(line.quantity) || 0);
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

    const envelope = await requestEnvelope<{ orders?: ApiOrderLine[] }>({
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
    if (envelope.messageCode !== MESSAGE_CODE.SUCCESS || !envelope.data) return [];
    return groupOrderLines(envelope.data.orders ?? []);
  },
};
