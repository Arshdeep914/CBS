import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { OrderStatusPill } from '@/components/order-status-pill';
import { RemoteImage } from '@/components/product/product-image';
import { CardListSkeleton, EndOfList } from '@/components/product/skeletons';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon, Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useInfiniteList } from '@/hooks/use-infinite-list';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatINR, plural } from '@/lib/format';
import { HOME_HREF } from '@/lib/routes';
import { shop } from '@/services';
import type { Order } from '@/services/types';
import { cacheOrders, CANCELLED_CODES, isActiveOrder, mergeOrders } from '@/store/orders';

type Segment = 'all' | 'active' | 'delivered' | 'cancelled';

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const PAGE_SIZE = 10;

export default function OrdersScreen() {
  const theme = useTheme();
  const [segment, setSegment] = useState<Segment>('all');
  const list = useInfiniteList(async (page) => {
    const { orders, hasMore } = await shop.orders.list(page, PAGE_SIZE);
    return { items: orders, hasMore };
  }, 'orders');
  // an order can continue on the next page; join the halves before showing or caching
  const orders = useMemo(() => mergeOrders(list.items), [list.items]);
  useEffect(() => cacheOrders(orders), [orders]);

  // a new order may have been placed since the tab was last shown
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      list.revalidate();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const visible = orders.filter((order) =>
    segment === 'all'
      ? true
      : segment === 'active'
        ? isActiveOrder(order.statusCode)
        : segment === 'delivered'
          ? order.statusCode === 6
          : CANCELLED_CODES.has(order.statusCode),
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Orders" showBack={false} bordered={false} updating={list.updating} />
      <FlatList
        data={visible}
        keyExtractor={(order) => order.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
        ListHeaderComponent={
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segments}>
            {SEGMENTS.map((s) => (
              <Chip key={s.id} label={s.label} selected={segment === s.id} onPress={() => setSegment(s.id)} />
            ))}
          </ScrollView>
        }
        ListEmptyComponent={
          list.loading ? (
            <CardListSkeleton count={3} />
          ) : list.error ? (
            <ErrorState message={list.error} onRetry={list.retry} />
          ) : (
            <EmptyState
              icon={Icons.orders}
              title={list.items.length > 0 ? 'Nothing in this list' : 'No orders yet'}
              message={list.items.length > 0 ? 'Try another filter above.' : 'When you place an order, it shows up here.'}
              action={list.items.length > 0 ? undefined : { label: 'Start shopping', onPress: () => router.navigate(HOME_HREF) }}
            />
          )
        }
        ListFooterComponent={
          list.items.length === 0 ? null : list.error ? (
            <ErrorState compact message={list.error} onRetry={list.retry} />
          ) : list.loadingMore || list.hasMore ? (
            <CardListSkeleton count={1} />
          ) : (
            <EndOfList label="No older orders" />
          )
        }
      />
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const theme = useTheme();
  const units = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
      style={({ pressed }) => [styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <AppText variant="subheading">#{order.number}</AppText>
          <AppText variant="caption" color="textMuted">
            Placed {formatDate(order.date)}
          </AppText>
        </View>
        <OrderStatusPill statusCode={order.statusCode} label={order.status} />
      </View>

      <View style={styles.thumbs}>
        {order.items.slice(0, 4).map((item, index) => (
          <RemoteImage key={`${item.productCode}-${index}`} uri={item.image} width={52} radius={Radius.sm} />
        ))}
        {order.items.length > 4 && (
          <View style={[styles.more, { backgroundColor: theme.surfaceMuted }]}>
            <AppText variant="captionStrong" color="textSecondary">
              +{order.items.length - 4}
            </AppText>
          </View>
        )}
      </View>

      <AppText variant="caption" color="textSecondary" numberOfLines={1}>
        {order.items.map((item) => item.name).join(', ')}
      </AppText>

      <View style={[styles.cardBottom, { borderTopColor: theme.border }]}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{formatINR(order.total)}</AppText>
          <AppText variant="caption" color="textMuted">
            {plural(units, 'item')}
          </AppText>
        </View>
        <View style={styles.track}>
          <AppText variant="captionStrong" color="primary">
            {isActiveOrder(order.statusCode) ? 'Track order' : 'View details'}
          </AppText>
          <Icon name={Icons.chevronRight} color={theme.primary} size={12} weight="bold" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
  },
  list: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three - 4,
  },
  segments: {
    gap: Spacing.two,
    paddingBottom: Spacing.one,
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
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
