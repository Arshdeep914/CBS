import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddButton } from '@/components/product/add-button';
import { RemoteImage } from '@/components/product/product-image';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { demoAccount } from '@/data/account';
import { getBrand } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { formatINR, plural } from '@/lib/format';
import { COUPON, FREE_DELIVERY_ABOVE, type PricedLine } from '@/lib/pricing';
import { cartActions, useCartSummary, useCouponApplied } from '@/store/cart';
import { useOrders } from '@/store/orders';
import { HOME_HREF } from '@/lib/routes';

const PAYMENT_METHODS: { id: string; label: string; detail: string; icon: IconName }[] = [
  { id: 'UPI', label: 'UPI', detail: 'Pay once CBS confirms the order', icon: Icons.phone },
  { id: 'Bank transfer', label: 'Bank transfer', detail: 'NEFT / RTGS within 48 hrs', icon: Icons.bank },
  { id: 'Pay on delivery', label: 'Pay on delivery', detail: 'Cash or cheque at delivery', icon: Icons.rupee },
];

export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const couponApplied = useCouponApplied();
  const { lines, bill, itemCount, unitCount } = useCartSummary();
  const { placeOrder } = useOrders();

  const [addressIndex, setAddressIndex] = useState(0);
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].id);
  const [placing, setPlacing] = useState(false);

  const address = demoAccount.addresses[addressIndex];
  const savings = bill.mrpTotal - bill.itemsTotal + bill.couponDiscount;

  if (itemCount === 0) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Cart" />
        <EmptyState
          icon={Icons.cart}
          title="Your cart is empty"
          message="Add products at their minimum order quantity to start a trade order."
          action={{ label: 'Browse catalogue', onPress: () => router.dismissTo(HOME_HREF) }}
        />
      </View>
    );
  }

  async function handlePlaceOrder() {
    setPlacing(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const order = placeOrder({ lines, bill, addressId: address.id, paymentMethod: payment });
    cartActions.clear();
    router.replace({ pathname: '/order/[id]', params: { id: order.id, placed: '1' } });
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Cart" subtitle={`${plural(itemCount, 'item')} · ${plural(unitCount, 'unit')}`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {savings > 0 && (
          <View style={[styles.savings, { backgroundColor: theme.successSoft }]}>
            <Icon name={Icons.tag} color={theme.success} size={16} />
            <AppText variant="bodyStrong" color="success">
              You’re saving {formatINR(savings)} vs MRP on this order
            </AppText>
          </View>
        )}

        {/* Delivery */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
              <Icon name={Icons.location} color={theme.primary} size={18} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">Deliver to {address.label}</AppText>
              <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                {address.line1}, {address.line2}
              </AppText>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => setAddressIndex((i) => (i + 1) % demoAccount.addresses.length)}>
              <AppText variant="captionStrong" color="primary">
                CHANGE
              </AppText>
            </Pressable>
          </View>
          <View style={[styles.eta, { backgroundColor: theme.surfaceMuted }]}>
            <Icon name={Icons.truck} color={theme.textSecondary} size={14} />
            <AppText variant="caption" color="textSecondary">
              Dispatch in 24 hrs · Delivery in 2–3 working days
            </AppText>
          </View>
        </View>

        {/* Items */}
        <View style={[styles.card, styles.itemsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {lines.map((line, index) => (
            <CartItem key={line.product.id} line={line} first={index === 0} />
          ))}
          <Pressable
            onPress={() => router.dismissTo(HOME_HREF)}
            style={[styles.addMore, { borderTopColor: theme.border }]}>
            <Icon name={Icons.plus} color={theme.primary} size={14} weight="bold" />
            <AppText variant="bodyStrong" color="primary">
              Add more items
            </AppText>
          </Pressable>
        </View>

        {/* Coupon */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.successSoft }]}>
              <Icon name={Icons.percent} color={theme.success} size={16} weight="bold" />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{COUPON.code}</AppText>
              <AppText variant="caption" color={bill.couponEligible ? 'textSecondary' : 'warning'}>
                {bill.couponEligible
                  ? COUPON.description
                  : `Add ${formatINR(COUPON.minOrder - bill.itemsTotal)} more to unlock 5% off`}
              </AppText>
            </View>
            <Pressable
              disabled={!bill.couponEligible}
              hitSlop={8}
              onPress={() => cartActions.setCouponApplied(!couponApplied)}>
              <AppText
                variant="captionStrong"
                color={!bill.couponEligible ? 'textMuted' : couponApplied ? 'danger' : 'primary'}>
                {couponApplied && bill.couponEligible ? 'REMOVE' : 'APPLY'}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Bill */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="subheading">Bill details</AppText>
          <BillRow label="Item total" value={formatINR(bill.baseTotal)} />
          {bill.bulkSavings > 0 && (
            <BillRow label="Bulk pricing savings" value={`−${formatINR(bill.bulkSavings)}`} tone="success" />
          )}
          {bill.couponDiscount > 0 && (
            <BillRow label={`Coupon (${COUPON.code})`} value={`−${formatINR(bill.couponDiscount)}`} tone="success" />
          )}
          <BillRow label="GST (12–18%)" value={formatINR(bill.gst)} />
          <BillRow
            label="Delivery"
            value={bill.delivery === 0 ? 'FREE' : formatINR(bill.delivery)}
            tone={bill.delivery === 0 ? 'success' : undefined}
            note={
              bill.delivery > 0
                ? `Add ${formatINR(FREE_DELIVERY_ABOVE - bill.itemsTotal)} more for free delivery`
                : undefined
            }
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.billRow}>
            <AppText variant="subheading">To pay</AppText>
            <AppText variant="subheading">{formatINR(bill.total)}</AppText>
          </View>
        </View>

        {/* Payment */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="subheading">Payment</AppText>
          {PAYMENT_METHODS.map((method) => {
            const selected = payment === method.id;
            return (
              <Pressable
                key={method.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setPayment(method.id)}
                style={[
                  styles.payment,
                  { borderColor: selected ? theme.primary : theme.border },
                  selected && { backgroundColor: theme.primarySoft },
                ]}>
                <Icon name={method.icon} color={selected ? theme.primary : theme.textSecondary} size={20} />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{method.label}</AppText>
                  <AppText variant="caption" color="textSecondary">
                    {method.detail}
                  </AppText>
                </View>
                <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                  {selected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <AppText variant="caption" color="textMuted" style={styles.policy}>
          Prices are exclusive of GST. A tax invoice is issued on dispatch. Orders can be cancelled
          until they are packed.
        </AppText>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two },
        ]}>
        <View style={styles.bottomInner}>
          <View>
            <AppText variant="heading">{formatINR(bill.total)}</AppText>
            <AppText variant="caption" color="textMuted">
              incl. GST · {payment}
            </AppText>
          </View>
          <View style={styles.flex}>
            <Button title="Place order" onPress={handlePlaceOrder} loading={placing} />
          </View>
        </View>
      </View>
    </View>
  );
}

function CartItem({ line, first }: { line: PricedLine; first: boolean }) {
  const theme = useTheme();
  const { product, quantity, unitPrice, lineTotal } = line;
  const brand = getBrand(product.brandId);
  const nextTier = product.tiers.find((t) => t.minQty > quantity);
  const bulkApplied = unitPrice < product.price;

  return (
    <View style={[styles.item, !first && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.itemRow}>
        <Pressable onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}>
          <RemoteImage image={product.images[0]} width={60} radius={Radius.sm} />
        </Pressable>
        <View style={styles.flex}>
          <AppText variant="micro" color="textMuted">
            {brand?.name.toUpperCase()}
          </AppText>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {product.name}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {formatINR(unitPrice)} × {quantity} {product.unit}
            {bulkApplied ? '  ·  ' : ''}
            {bulkApplied && (
              <AppText variant="captionStrong" color="success">
                Bulk price
              </AppText>
            )}
          </AppText>
        </View>
        <View style={styles.itemRight}>
          <AddButton product={product} size="sm" />
          <AppText variant="bodyStrong">{formatINR(lineTotal)}</AppText>
        </View>
      </View>
      <View style={styles.itemFooter}>
        {nextTier ? (
          <Pressable onPress={() => cartActions.setQuantity(product, nextTier.minQty)} style={styles.flex}>
            <AppText variant="caption" color="primary">
              Add {nextTier.minQty - quantity} more → {formatINR(nextTier.price)}/{product.unit.replace(/s$/, '')}
            </AppText>
          </Pressable>
        ) : (
          <AppText variant="caption" color="success" style={styles.flex}>
            Best bulk price unlocked
          </AppText>
        )}
        <Pressable hitSlop={8} onPress={() => cartActions.remove(product.id)} accessibilityLabel="Remove item">
          <Icon name={Icons.trash} color={theme.textMuted} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

function BillRow({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone?: 'success';
  note?: string;
}) {
  return (
    <View>
      <View style={styles.billRow}>
        <AppText color="textSecondary">{label}</AppText>
        <AppText variant="bodyStrong" color={tone ?? 'text'}>
          {value}
        </AppText>
      </View>
      {note && (
        <AppText variant="caption" color="warning">
          {note}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three - 4,
    paddingBottom: 140,
  },
  savings: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three - 4,
    borderRadius: Radius.md,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three - 4,
  },
  itemsCard: {
    paddingVertical: 0,
    gap: 0,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
  },
  item: {
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  itemRow: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.three - 4,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  policy: {
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
  },
  bottomInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
  },
});
