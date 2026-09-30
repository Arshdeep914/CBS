import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { isActiveOrder, OrderStatusPill } from '@/components/order-status-pill';
import { RemoteImage } from '@/components/product/product-image';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { getProduct } from '@/data/catalog';
import type { Order } from '@/data/orders';
import { useTheme } from '@/hooks/use-theme';
import { formatCompactINR, formatDate, formatINR, formatShortDate, plural } from '@/lib/format';
import { cartActions } from '@/store/cart';
import { useOrders } from '@/store/orders';
import { HOME_HREF } from '@/lib/routes';

type Segment = 'all' | 'active' | 'delivered' | 'cancelled';

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrdersScreen() {
  const theme = useTheme();
  const { orders } = useOrders();
  const [segment, setSegment] = useState<Segment>('all');

  const visible = orders.filter((order) =>
    segment === 'all'
      ? true
      : segment === 'active'
        ? isActiveOrder(order.status)
        : order.status === segment,
  );

  const spent = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
  const activeCount = orders.filter((o) => isActiveOrder(o.status)).length;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Orders" showBack={false} bordered={false} />
      <FlatList
        data={visible}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.stats}>
              <StatCard label="Active orders" value={activeCount.toString()} icon={Icons.truck} />
              <StatCard label="Purchased (60 days)" value={formatCompactINR(spent)} icon={Icons.rupee} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segments}>
              {SEGMENTS.map((s) => (
                <Chip key={s.id} label={s.label} selected={segment === s.id} onPress={() => setSegment(s.id)} />
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={
          <EmptyState
            icon={Icons.orders}
            title="No orders here"
            message="Orders you place will show up here with live status."
            action={{ label: 'Start shopping', onPress: () => router.navigate(HOME_HREF) }}
          />
        }
      />
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: IconName }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.statIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} color={theme.primary} size={18} />
      </View>
      <View>
        <AppText variant="heading">{value}</AppText>
        <AppText variant="caption" color="textSecondary">
          {label}
        </AppText>
      </View>
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const theme = useTheme();
  const products = order.lines.flatMap((line) => getProduct(line.productId) ?? []);
  const units = order.lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && { opacity: 0.9 },
      ]}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <AppText variant="subheading">#{order.id}</AppText>
          <AppText variant="caption" color="textMuted">
            Placed {formatDate(order.placedAt)}
          </AppText>
        </View>
        <OrderStatusPill status={order.status} />
      </View>

      <View style={styles.thumbs}>
        {products.slice(0, 4).map((product) => (
          <RemoteImage key={product.id} image={product.images[0]} width={52} radius={Radius.sm} />
        ))}
        {products.length > 4 && (
          <View style={[styles.more, { backgroundColor: theme.surfaceMuted }]}>
            <AppText variant="captionStrong" color="textSecondary">
              +{products.length - 4}
            </AppText>
          </View>
        )}
      </View>

      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
        {products.map((p) => p.name).join(', ')}
      </AppText>

      <View style={[styles.cardBottom, { borderTopColor: theme.border }]}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{formatINR(order.total)}</AppText>
          <AppText variant="caption" color="textMuted">
            {plural(order.lines.length, 'item')} · {plural(units, 'unit')}
            {order.expectedBy && isActiveOrder(order.status) ? ` · by ${formatShortDate(order.expectedBy)}` : ''}
          </AppText>
        </View>
        {order.status === 'delivered' || order.status === 'cancelled' ? (
          <View style={styles.reorder}>
            <Button
              title="Reorder"
              icon={Icons.refresh}
              variant="secondary"
              onPress={() => {
                cartActions.addMany(order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
                router.push('/cart');
              }}
            />
          </View>
        ) : (
          <View style={styles.track}>
            <AppText variant="captionStrong" color="primary">
              Track order
            </AppText>
            <Icon name={Icons.chevronRight} color={theme.primary} size={12} weight="bold" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three - 4,
  },
  headerBlock: {
    gap: Spacing.three - 4,
    paddingBottom: Spacing.one,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.three - 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segments: {
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three - 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  thumbs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  more: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.three - 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  reorder: {
    width: 136,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
