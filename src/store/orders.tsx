import { createContext, use, useState, type ReactNode } from 'react';

import { demoOrders, type Order } from '@/data/orders';
import type { Bill, PricedLine } from '@/lib/pricing';

type PlaceOrderInput = {
  lines: PricedLine[];
  bill: Bill;
  addressId: string;
  paymentMethod: string;
};

type OrdersContextValue = {
  orders: Order[];
  getOrder: (id: string) => Order | undefined;
  placeOrder: (input: PlaceOrderInput) => Order;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(demoOrders);

  function placeOrder({ lines, bill, addressId, paymentMethod }: PlaceOrderInput) {
    const expectedBy = new Date();
    expectedBy.setDate(expectedBy.getDate() + 3);

    const order: Order = {
      id: `CBS-${241000 + orders.length + Math.floor(Math.random() * 90)}`,
      placedAt: new Date().toISOString(),
      status: 'placed',
      lines: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, unitPrice: l.unitPrice })),
      subtotal: bill.itemsTotal,
      discount: bill.couponDiscount,
      gst: bill.gst,
      delivery: bill.delivery,
      total: bill.total,
      addressId,
      paymentMethod,
      expectedBy: expectedBy.toISOString(),
    };
    setOrders((current) => [order, ...current]);
    return order;
  }

  const value: OrdersContextValue = {
    orders,
    getOrder: (id) => orders.find((o) => o.id === id),
    placeOrder,
  };

  return <OrdersContext value={value}>{children}</OrdersContext>;
}

export function useOrders() {
  const context = use(OrdersContext);
  if (!context) throw new Error('useOrders must be used inside OrdersProvider');
  return context;
}
