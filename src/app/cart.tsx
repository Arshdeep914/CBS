import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { AddButton } from '@/components/product/add-button';
import { RemoteImage } from '@/components/product/product-image';
import { CardListSkeleton } from '@/components/product/skeletons';
import { RazorpayCheckout } from '@/components/razorpay-checkout';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatINR, plural } from '@/lib/format';
import { HOME_HREF } from '@/lib/routes';
import { isDemo, shop } from '@/services';
import type { CartLine, GatewayPayment, PaymentMode } from '@/services/types';
import { addressActions, formatAddress, useAddresses } from '@/store/addresses';
import { cartActions, cartTotals, useCartPending, useCartState } from '@/store/cart';
import { useSession } from '@/store/session';

type PendingPayment = { token: string; orderNo: string; gateway: GatewayPayment };

export default function CartScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const cart = useCartState();
  const addresses = useAddresses();

  const [preferredMode, setPreferredMode] = useState<PaymentMode>('online');
  const [addressSheet, setAddressSheet] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [payment, setPayment] = useState<PendingPayment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // every visit re-reads the cart (it may have changed on another device) and the addresses
  const updating = useRefreshOnFocus(
    () => Promise.all([cartActions.refresh(), addressActions.load()]),
    cart.status === 'ready',
  );

  const totals = cartTotals(cart.lines);
  const selected = addresses.items.find((a) => a.id === addresses.selectedId) ?? null;
  const { cash, online } = cart.paymentModes;
  // online wins by default, falling back to whatever is left
  const mode: PaymentMode = preferredMode === 'online' && !online ? 'cash' : preferredMode === 'cash' && !cash ? 'online' : preferredMode;

  // one reason at a time, in the order the shopper can fix them
  const blocker = totals.hasOutOfStock
    ? 'Remove out-of-stock items to continue.'
    : !selected
      ? 'Add a delivery address to continue.'
      : !cash && !online
        ? 'Payments are unavailable right now. Please try again shortly.'
        : null;

  async function refresh() {
    setRefreshing(true);
    await Promise.all([cartActions.refresh().catch(() => {}), addressActions.load().catch(() => {})]);
    setRefreshing(false);
  }

  function finish(orderNo: string) {
    void cartActions.afterOrder();
    router.replace({ pathname: '/order-placed', params: { orderNo } });
  }

  async function placeOrder() {
    if (!selected || blocker) return;
    setBusy(mode === 'online' ? 'Preparing secure payment…' : 'Placing your order…');
    try {
      const result = await shop.orders.start({
        mode,
        lines: cart.lines,
        addressId: selected.id,
        total: totals.total,
        prefill: { name: user?.name, email: user?.email, contact: selected.mobile },
      });
      if (result.status === 'confirmed') return finish(result.orderNo);
      if (result.status === 'payment') {
        setPayment({ token: result.token, orderNo: result.orderNo, gateway: result.gateway });
        return;
      }
      toast.show(result.message, 'error');
    } catch (err) {
      toast.show(errorMessage(err, "Couldn't place your order."), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function onPaid(result: { paymentId: string; orderId: string; signature: string }) {
    if (!payment) return;
    const pending = payment;
    setPayment(null);
    setBusy('Confirming your payment…');
    try {
      const confirmed = await shop.orders.completePayment(pending.token, result);
      if (confirmed.ok) return finish(pending.orderNo);
      toast.show(confirmed.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  function onPaymentDismissed(reason: 'cancelled' | 'failed') {
    const pending = payment;
    setPayment(null);
    // release the pending order server-side so it doesn't linger
    if (pending) void shop.orders.cancel(pending.token);
    toast.show(reason === 'failed' ? 'The payment failed. Please try again.' : 'Payment cancelled.', reason === 'failed' ? 'error' : 'info');
  }

  /* ----------------------------- states ----------------------------- */

  let body;
  if (cart.status === 'loading' || cart.status === 'idle') {
    body = (
      <View style={styles.content}>
        <CardListSkeleton count={3} height={120} />
      </View>
    );
  } else if (cart.status === 'error') {
    body = <ErrorState message="We couldn't load your cart." onRetry={() => cartActions.refresh().catch(() => {})} />;
  } else if (cart.lines.length === 0) {
    body = (
      <EmptyState
        icon={Icons.cart}
        title="Your cart is empty"
        message="Browse the catalogue and add something you love."
        action={{ label: 'Start shopping', onPress: () => router.dismissTo(HOME_HREF) }}
      />
    );
  } else {
    body = (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />}
        contentContainerStyle={styles.content}>
        {totals.savings > 0 && (
          <View style={[styles.savings, { backgroundColor: theme.successSoft }]}>
            <Icon name={Icons.tag} color={theme.success} size={16} />
            <AppText variant="bodyStrong" color="success">
              You’re saving {formatINR(totals.savings)} on this order
            </AppText>
          </View>
        )}

        {/* Items */}
        <View style={[styles.card, styles.itemsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {cart.lines.map((line, index) => (
            <CartItem key={line.id} line={line} first={index === 0} />
          ))}
          <Pressable onPress={() => router.dismissTo(HOME_HREF)} style={[styles.addMore, { borderTopColor: theme.border }]}>
            <Icon name={Icons.plus} color={theme.primary} size={14} weight="bold" />
            <AppText variant="bodyStrong" color="primary">
              Add more items
            </AppText>
          </Pressable>
        </View>

        {/* Delivery */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
              <Icon name={Icons.location} color={theme.primary} size={18} />
            </View>
            {addresses.status === 'loading' ? (
              <AppText color="textMuted" style={styles.flex}>
                Loading your addresses…
              </AppText>
            ) : selected ? (
              <View style={styles.flex}>
                <AppText variant="bodyStrong">Deliver to {selected.fullName}</AppText>
                <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                  {formatAddress(selected)}
                </AppText>
              </View>
            ) : (
              <AppText color="textSecondary" style={styles.flex}>
                {addresses.status === 'error' ? 'Couldn’t load your addresses.' : 'No delivery address yet.'}
              </AppText>
            )}
            <Pressable
              hitSlop={8}
              onPress={() =>
                addresses.status === 'error'
                  ? addressActions.load().catch(() => {})
                  : addresses.items.length === 0
                    ? router.push('/address-form')
                    : setAddressSheet(true)
              }>
              <AppText variant="captionStrong" color="primary">
                {addresses.status === 'error' ? 'RETRY' : addresses.items.length === 0 ? 'ADD' : 'CHANGE'}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Payment */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="subheading">Payment method</AppText>
          <PaymentOption
            icon={Icons.wallet}
            label="Pay online"
            detail={online ? (isDemo ? 'Demo mode — confirmed without payment' : 'UPI, cards, net banking via Razorpay') : 'Unavailable right now'}
            selected={mode === 'online'}
            disabled={!online}
            onPress={() => setPreferredMode('online')}
          />
          <PaymentOption
            icon={Icons.rupee}
            label="Cash on delivery"
            detail={cash ? 'Pay when your order arrives' : 'Not available for this order'}
            selected={mode === 'cash'}
            disabled={!cash}
            onPress={() => setPreferredMode('cash')}
          />
        </View>

        {/* Bill */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="subheading">Bill details</AppText>
          <BillRow label={`Item total (${plural(totals.itemCount, 'item')})`} value={formatINR(totals.totalMrp)} />
          {totals.savings > 0 && <BillRow label="Discount" value={`−${formatINR(totals.savings)}`} tone="success" />}
          {totals.platformFee > 0 && <BillRow label="Platform fee" value={formatINR(totals.platformFee)} />}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.billRow}>
            <AppText variant="subheading">To pay</AppText>
            <AppText variant="subheading">{formatINR(totals.total)}</AppText>
          </View>
          <AppText variant="caption" color="textMuted">
            Prices include GST. The final amount is confirmed by our server when you place the order.
          </AppText>
        </View>
      </ScrollView>
    );
  }

  const showBar = cart.status === 'ready' && cart.lines.length > 0;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Cart"
        subtitle={showBar ? plural(totals.itemCount, 'item') : undefined}
        updating={updating && cart.status === 'ready'}
      />
      {body}

      {showBar && (
        <View style={[styles.bottomBar, { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two }]}>
          {blocker && (
            <AppText variant="caption" color="warning" style={styles.blocker}>
              {blocker}
            </AppText>
          )}
          <View style={styles.bottomInner}>
            <View>
              <AppText variant="heading">{formatINR(totals.total)}</AppText>
              <AppText variant="caption" color="textMuted">
                {mode === 'online' ? 'Pay online' : 'Cash on delivery'}
              </AppText>
            </View>
            <View style={styles.flex}>
              <Button
                title={mode === 'online' ? `Pay ${formatINR(totals.total)}` : 'Place order'}
                onPress={placeOrder}
                disabled={!!blocker || !!busy}
              />
            </View>
          </View>
        </View>
      )}

      <AddressSheet visible={addressSheet} onClose={() => setAddressSheet(false)} />
      <RazorpayCheckout payment={payment?.gateway ?? null} onSuccess={onPaid} onDismiss={onPaymentDismissed} />
      <LoadingOverlay message={busy} />
    </View>
  );
}

function CartItem({ line, first }: { line: CartLine; first: boolean }) {
  const theme = useTheme();
  const pending = useCartPending(line.id);

  return (
    <View style={[styles.item, !first && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <Pressable onPress={() => router.push({ pathname: '/product/[id]', params: { id: line.id } })}>
        <RemoteImage uri={line.image} width={64} radius={Radius.sm} dimmed={line.isOutOfStock} />
      </Pressable>
      <View style={styles.flex}>
        <AppText variant="bodyStrong" numberOfLines={2}>
          {line.name}
        </AppText>
        {line.variant && (
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {line.variant}
          </AppText>
        )}
        <View style={styles.linePrice}>
          <AppText variant="bodyStrong">{formatINR(line.price * line.qty)}</AppText>
          {line.mrp && line.mrp > line.price && (
            <AppText variant="caption" color="textMuted" style={styles.strike}>
              {formatINR(line.mrp * line.qty)}
            </AppText>
          )}
        </View>
        {line.isOutOfStock && (
          <AppText variant="caption" color="danger">
            Out of stock — remove to continue
          </AppText>
        )}
      </View>
      <View style={styles.itemRight}>
        <AddButton product={{ id: line.id, variationCode: line.variationCode, isOutOfStock: line.isOutOfStock, name: line.name }} size="sm" max={line.available > 0 ? line.available : null} />
        <Pressable
          hitSlop={8}
          disabled={pending}
          accessibilityLabel={`Remove ${line.name}`}
          onPress={() => cartActions.remove(line.id).catch((err) => toast.show(errorMessage(err, "Couldn't remove that item."), 'error'))}>
          <Icon name={Icons.trash} color={theme.textMuted} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

function AddressSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const addresses = useAddresses();

  return (
    <BottomSheet visible={visible} title="Deliver to" onClose={onClose}>
      <ScrollView contentContainerStyle={styles.sheetContent}>
        {addresses.items.map((address) => {
          const selected = address.id === addresses.selectedId;
          return (
            <Pressable
              key={address.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                addressActions.select(address.id);
                onClose();
              }}
              style={[styles.addressOption, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySoft : theme.surface }]}>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">
                  {address.fullName}
                  {address.isPrimary ? '  · Default' : ''}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {formatAddress(address)}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {address.mobile}
                </AppText>
              </View>
              <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                {selected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
              </View>
            </Pressable>
          );
        })}
        <Button
          title="Add a new address"
          icon={Icons.plus}
          variant="secondary"
          onPress={() => {
            onClose();
            router.push('/address-form');
          }}
        />
      </ScrollView>
    </BottomSheet>
  );
}

function PaymentOption({
  icon,
  label,
  detail,
  selected,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  detail: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.payment,
        { borderColor: selected ? theme.primary : theme.border },
        selected && { backgroundColor: theme.primarySoft },
        disabled && styles.disabled,
      ]}>
      <Icon name={icon} color={selected ? theme.primary : theme.textSecondary} size={20} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" color="textSecondary">
          {detail}
        </AppText>
      </View>
      <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
        {selected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
      </View>
    </Pressable>
  );
}

function BillRow({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
  return (
    <View style={styles.billRow}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText variant="bodyStrong" color={tone ?? 'text'}>
        {value}
      </AppText>
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
    paddingBottom: 150,
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
  item: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
    paddingVertical: Spacing.three,
  },
  itemRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  linePrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  strike: {
    textDecorationLine: 'line-through',
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
  disabled: {
    opacity: 0.5,
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
  sheetContent: {
    padding: Spacing.four,
    gap: Spacing.three - 4,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.three - 2,
    borderRadius: Radius.md,
    borderWidth: 1.5,
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
    gap: Spacing.two,
  },
  blocker: {
    textAlign: 'center',
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
