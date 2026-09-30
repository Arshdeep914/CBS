import { getProduct, unitPriceFor, type Product } from '@/data/catalog';

export type CartLine = {
  productId: string;
  quantity: number;
};

export type PricedLine = {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export const COUPON = {
  code: 'BULK5',
  description: '5% off orders above ₹20,000 (up to ₹5,000)',
  percent: 5,
  minOrder: 20000,
  maxDiscount: 5000,
};

export const FREE_DELIVERY_ABOVE = 25000;
export const DELIVERY_FEE = 499;

export function priceLines(lines: CartLine[]): PricedLine[] {
  return lines.flatMap((line) => {
    const product = getProduct(line.productId);
    if (!product) return [];
    const unitPrice = unitPriceFor(product, line.quantity);
    return [{ product, quantity: line.quantity, unitPrice, lineTotal: unitPrice * line.quantity }];
  });
}

export type Bill = {
  mrpTotal: number;
  baseTotal: number;
  bulkSavings: number;
  itemsTotal: number;
  couponDiscount: number;
  gst: number;
  delivery: number;
  total: number;
  couponEligible: boolean;
};

export function computeBill(lines: PricedLine[], couponApplied: boolean): Bill {
  const mrpTotal = lines.reduce((sum, l) => sum + l.product.mrp * l.quantity, 0);
  const baseTotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const itemsTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const couponEligible = itemsTotal >= COUPON.minOrder;
  const couponDiscount =
    couponApplied && couponEligible
      ? Math.min(Math.round((itemsTotal * COUPON.percent) / 100), COUPON.maxDiscount)
      : 0;

  // Spread the coupon across lines so each is taxed at its own GST rate.
  const taxableRatio = itemsTotal > 0 ? (itemsTotal - couponDiscount) / itemsTotal : 0;
  const gst = Math.round(
    lines.reduce((sum, l) => sum + l.lineTotal * taxableRatio * (l.product.gstRate / 100), 0),
  );

  const delivery = itemsTotal === 0 || itemsTotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;

  return {
    mrpTotal,
    baseTotal,
    bulkSavings: baseTotal - itemsTotal,
    itemsTotal,
    couponDiscount,
    gst,
    delivery,
    total: itemsTotal - couponDiscount + gst + delivery,
    couponEligible,
  };
}
