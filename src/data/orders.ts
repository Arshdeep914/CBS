/** Demo order history so the Orders tab isn't empty on first launch. */
export type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export type OrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  placedAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  gst: number;
  delivery: number;
  total: number;
  addressId: string;
  paymentMethod: string;
  expectedBy?: string;
};

export const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'placed', label: 'Order placed' },
  { status: 'confirmed', label: 'Confirmed by CBS' },
  { status: 'packed', label: 'Packed' },
  { status: 'shipped', label: 'Out for delivery' },
  { status: 'delivered', label: 'Delivered' },
];

const daysAgo = (days: number, hour = 11) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 24, 0, 0);
  return date.toISOString();
};

type DemoLine = [productId: string, quantity: number, unitPrice: number];

function demoOrder(
  id: string,
  placedDaysAgo: number,
  status: OrderStatus,
  lines: DemoLine[],
  extra: Partial<Order> = {},
): Order {
  const orderLines = lines.map(([productId, quantity, unitPrice]) => ({ productId, quantity, unitPrice }));
  const subtotal = orderLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discount = 0;
  const gst = Math.round(subtotal * 0.12);
  const delivery = subtotal >= 25000 ? 0 : 499;
  return {
    id,
    placedAt: daysAgo(placedDaysAgo),
    status,
    lines: orderLines,
    subtotal,
    discount,
    gst,
    delivery,
    total: subtotal - discount + gst + delivery,
    addressId: 'main',
    paymentMethod: 'Bank transfer',
    ...extra,
  };
}

export const demoOrders: Order[] = [
  demoOrder('CBS-240918', 1, 'shipped', [
    ['cbs-triply-cooker-5l', 10, 2295],
    ['kit-nonstick-kadai-24', 15, 1005],
    ['an-insulated-bottle-750', 30, 440],
  ], { expectedBy: daysAgo(-1) }),
  demoOrder('CBS-240911', 3, 'confirmed', [
    ['vm-mixer-750', 4, 3190],
    ['vm-glass-kettle-1-7', 10, 1145],
  ], { expectedBy: daysAgo(-3) }),
  demoOrder('CBS-240887', 9, 'delivered', [
    ['cq-stoneware-plates-6', 6, 1690],
    ['gq-tumblers-6', 24, 345],
    ['sk-mirror-cutlery-24', 4, 1390],
    ['cq-coffee-mugs-6', 8, 790],
  ]),
  demoOrder('CBS-240852', 18, 'delivered', [
    ['cbs-rolling-pin', 48, 165],
    ['cl-neem-spatula-4', 40, 315],
    ['cbs-scrub-sponge-12', 60, 165],
  ]),
  demoOrder('CBS-240819', 26, 'cancelled', [
    ['vm-air-fryer-4-2', 2, 4990],
  ], { paymentMethod: 'UPI' }),
  demoOrder('CBS-240774', 41, 'delivered', [
    ['fc-castiron-skillet-25', 8, 1290],
    ['fc-dosa-tawa-30', 12, 1105],
    ['cl-chef-knife-8', 12, 690],
  ]),
];
