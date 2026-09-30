import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import type { OrderStatus } from '@/data/orders';
import { useTheme } from '@/hooks/use-theme';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function isActiveOrder(status: OrderStatus) {
  return status !== 'delivered' && status !== 'cancelled';
}

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  const theme = useTheme();
  const tone =
    status === 'delivered'
      ? { bg: theme.successSoft, fg: theme.success }
      : status === 'cancelled'
        ? { bg: theme.surfaceMuted, fg: theme.textSecondary }
        : { bg: theme.warningSoft, fg: theme.warning };

  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <AppText variant="captionStrong" color={tone.fg}>
        {STATUS_LABELS[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
