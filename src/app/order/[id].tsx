import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { OrderStatusPill } from '@/components/order-status-pill';
import { RemoteImage } from '@/components/product/product-image';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatINR } from '@/lib/format';
import { HOME_HREF } from '@/lib/routes';
import { CANCELLED_CODES, getCachedOrder, ORDER_STEPS, RETURNED_CODE, stepIndex } from '@/store/orders';

export default function OrderScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = getCachedOrder(id);

  if (!order) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Order" />
        <EmptyState
          icon={Icons.orders}
          title="Order not found"
          message="Open it from your orders list."
          action={{ label: 'Go to orders', onPress: () => router.replace('/orders') }}
        />
      </View>
    );
  }

  const cancelled = CANCELLED_CODES.has(order.statusCode);
  const returned = order.statusCode === RETURNED_CODE;
  const current = stepIndex(order.statusCode);
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title={`Order #${order.number}`} subtitle={`Placed ${formatDate(order.date)}`} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.rowBetween}>
            <AppText variant="subheading">Order status</AppText>
            <OrderStatusPill statusCode={order.statusCode} label={order.status} />
          </View>
          {cancelled || returned ? (
            <AppText color="textSecondary">
              {cancelled
                ? 'This order was cancelled. If you were charged, the amount will be refunded to your original payment method.'
                : 'This order was returned. Any refund is processed to your original payment method.'}
            </AppText>
          ) : (
            <View>
              {ORDER_STEPS.map((step, index) => {
                const done = index <= current;
                const last = index === ORDER_STEPS.length - 1;
                return (
                  <View key={step.code} style={styles.step}>
                    <View style={styles.stepRail}>
                      <View
                        style={[
                          styles.stepDot,
                          { backgroundColor: done ? theme.success : theme.surface, borderColor: done ? theme.success : theme.border },
                        ]}>
                        {done && <Icon name={Icons.check} color="#FFFFFF" size={10} weight="bold" />}
                      </View>
                      {!last && <View style={[styles.stepLine, { backgroundColor: index < current ? theme.success : theme.border }]} />}
                    </View>
                    <View style={styles.stepText}>
                      <AppText variant={index === current ? 'bodyStrong' : 'body'} color={done ? 'text' : 'textMuted'}>
                        {step.label}
                      </AppText>
                      {index === 0 && (
                        <AppText variant="caption" color="textMuted">
                          {formatDate(order.date)}
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
          <AppText variant="subheading">Items ({order.items.length})</AppText>
          {/* order lines carry a productCode, which the product endpoint can't open,
              so items aren't linked to product pages */}
          {order.items.map((item, index) => (
            <View key={`${item.productCode}-${index}`} style={styles.item}>
              <RemoteImage uri={item.image} width={56} radius={Radius.sm} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong" numberOfLines={2}>
                  {item.name}
                </AppText>
                <AppText variant="caption" color="textSecondary">
                  {item.qty} × {formatINR(item.price)}
                </AppText>
              </View>
              <AppText variant="bodyStrong">{formatINR(item.qty * item.price)}</AppText>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.rowBetween}>
            <AppText variant="subheading">Items total</AppText>
            <AppText variant="subheading">{formatINR(subtotal)}</AppText>
          </View>
          <AppText variant="caption" color="textMuted">
            Platform fee and delivery charges, if any, appear on your invoice.
          </AppText>
        </View>

        <Button title="Continue shopping" variant="secondary" onPress={() => router.navigate(HOME_HREF)} />
      </ScrollView>
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
    paddingBottom: Spacing.six,
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
});
