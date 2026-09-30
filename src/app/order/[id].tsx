import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';

import { OrderStatusPill } from '@/components/order-status-pill';
import { RemoteImage } from '@/components/product/product-image';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { demoAccount } from '@/data/account';
import { getProduct } from '@/data/catalog';
import { ORDER_STEPS } from '@/data/orders';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDateTime, formatINR, formatShortDate } from '@/lib/format';
import { cartActions } from '@/store/cart';
import { useOrders } from '@/store/orders';
import { HOME_HREF } from '@/lib/routes';

export default function OrderScreen() {
  const theme = useTheme();
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const { getOrder } = useOrders();
  const order = getOrder(id);

  if (!order) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Order" />
        <EmptyState icon={Icons.orders} title="Order not found" message="Check the Orders tab." />
      </View>
    );
  }

  const address = demoAccount.addresses.find((a) => a.id === order.addressId) ?? demoAccount.addresses[0];
  const currentStep = ORDER_STEPS.findIndex((s) => s.status === order.status);
  const cancelled = order.status === 'cancelled';

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={`Order #${order.id}`}
        subtitle={`Placed ${formatDateTime(order.placedAt)}`}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {placed === '1' && (
          <Animated.View
            entering={FadeInUp.duration(350)}
            style={[styles.success, { backgroundColor: theme.successSoft }]}>
            <Animated.View
              entering={ZoomIn.delay(150).springify().damping(11)}
              style={[styles.successIcon, { backgroundColor: theme.success }]}>
              <Icon name={Icons.check} color="#FFFFFF" size={30} weight="bold" />
            </Animated.View>
            <AppText variant="title" style={styles.center}>
              Order placed!
            </AppText>
            <AppText color="textSecondary" style={styles.center}>
              CBS will confirm your order shortly.
              {order.expectedBy ? ` Expected delivery by ${formatShortDate(order.expectedBy)}.` : ''}
            </AppText>
          </Animated.View>
        )}

        {/* Status */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <AppText variant="subheading">Order status</AppText>
            <OrderStatusPill status={order.status} />
          </View>
          {cancelled ? (
            <AppText color="textSecondary">
              This order was cancelled and no payment was taken. You can reorder the same items anytime.
            </AppText>
          ) : (
            <View>
              {ORDER_STEPS.map((step, index) => {
                const done = index <= currentStep;
                const last = index === ORDER_STEPS.length - 1;
                return (
                  <View key={step.status} style={styles.step}>
                    <View style={styles.stepRail}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            backgroundColor: done ? theme.success : theme.surface,
                            borderColor: done ? theme.success : theme.border,
                          },
                        ]}>
                        {done && <Icon name={Icons.check} color="#FFFFFF" size={10} weight="bold" />}
                      </View>
                      {!last && (
                        <View
                          style={[
                            styles.stepLine,
                            { backgroundColor: index < currentStep ? theme.success : theme.border },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.stepText}>
                      <AppText variant={index === currentStep ? 'bodyStrong' : 'body'} color={done ? 'text' : 'textMuted'}>
                        {step.label}
                      </AppText>
                      {index === 0 && (
                        <AppText variant="caption" color="textMuted">
                          {formatDateTime(order.placedAt)}
                        </AppText>
                      )}
                      {step.status === 'delivered' && !done && order.expectedBy && (
                        <AppText variant="caption" color="textMuted">
                          Expected by {formatDate(order.expectedBy)}
                        </AppText>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Items */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="subheading">Items ({order.lines.length})</AppText>
          {order.lines.map((line) => {
            const product = getProduct(line.productId);
            if (!product) return null;
            return (
              <Pressable
                key={line.productId}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
                style={styles.item}>
                <RemoteImage image={product.images[0]} width={52} radius={Radius.sm} />
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={2}>
                    {product.name}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {line.quantity} {product.unit} × {formatINR(line.unitPrice)}
                  </AppText>
                </View>
                <AppText variant="bodyStrong">{formatINR(line.quantity * line.unitPrice)}</AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Bill */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="subheading">Payment summary</AppText>
          <Row label="Item total" value={formatINR(order.subtotal)} />
          {order.discount > 0 && <Row label="Coupon discount" value={`−${formatINR(order.discount)}`} />}
          <Row label="GST" value={formatINR(order.gst)} />
          <Row label="Delivery" value={order.delivery === 0 ? 'FREE' : formatINR(order.delivery)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.rowBetween}>
            <AppText variant="subheading">{cancelled ? 'Order value' : 'Total'}</AppText>
            <AppText variant="subheading">{formatINR(order.total)}</AppText>
          </View>
          <AppText variant="caption" color="textMuted">
            Paid via {order.paymentMethod}
          </AppText>
        </View>

        {/* Delivery */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppText variant="subheading">Delivery address</AppText>
          <AppText variant="bodyStrong">
            {demoAccount.businessName} · {address.label}
          </AppText>
          <AppText color="textSecondary">
            {address.line1}, {address.line2}
          </AppText>
        </View>

        <View style={styles.actions}>
          <ActionTile
            icon={Icons.invoice}
            label="Invoice"
            onPress={() => Alert.alert('Tax invoice', `The invoice for #${order.id} has been emailed to your registered address.`)}
          />
          <ActionTile
            icon={Icons.refresh}
            label="Reorder"
            onPress={() => {
              cartActions.addMany(order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
              router.push('/cart');
            }}
          />
          <ActionTile
            icon={Icons.support}
            label="Get help"
            onPress={() =>
              Alert.alert('CBS support', `We’ve logged a help request for #${order.id}. Our team will call you back shortly.`)
            }
          />
        </View>

        {placed === '1' && (
          <Button title="Continue shopping" variant="secondary" onPress={() => router.dismissTo(HOME_HREF)} />
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBetween}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function ActionTile({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && { opacity: 0.7 },
      ]}>
      <Icon name={icon} color={theme.primary} size={20} />
      <AppText variant="captionStrong">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three - 4,
    paddingBottom: Spacing.six,
  },
  success: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.lg,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three - 4,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  stepRail: {
    alignItems: 'center',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
  },
  stepText: {
    paddingBottom: Spacing.three,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
