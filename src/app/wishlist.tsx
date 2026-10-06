import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ProductGridRow, toRows, useGridLayout } from '@/components/product/product-grid';
import { ProductGridSkeleton } from '@/components/product/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { HeaderButton, ScreenHeader } from '@/components/ui/screen-header';
import { Icons } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { HOME_HREF } from '@/lib/routes';
import { useCartCount } from '@/store/cart';
import { wishlistActions, useWishlist } from '@/store/wishlist';

export default function WishlistScreen() {
  const theme = useTheme();
  const wishlist = useWishlist();
  const cartCount = useCartCount();
  const layout = useGridLayout();
  const [refreshing, setRefreshing] = useState(false);

  // re-read the wishlist on every visit; the saved list stays on screen meanwhile
  const updating = useRefreshOnFocus(() => wishlistActions.refresh(), wishlist.status === 'ready');

  async function refresh() {
    setRefreshing(true);
    await wishlistActions.refresh().catch(() => {});
    setRefreshing(false);
  }

  const count = wishlist.items.length;
  const subtitle = wishlist.status === 'ready' && count > 0 ? `${count} saved ${count === 1 ? 'item' : 'items'}` : undefined;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Wishlist"
        subtitle={subtitle}
        updating={updating && wishlist.status === 'ready'}
        right={<HeaderButton icon={Icons.cart} label="Cart" badge={cartCount} onPress={() => router.push('/cart')} />}
      />
      {wishlist.status === 'loading' || wishlist.status === 'idle' ? (
        <View style={styles.top}>
          <ProductGridSkeleton {...layout} rows={2} />
        </View>
      ) : wishlist.status === 'error' ? (
        <ErrorState
          message={wishlist.error ?? 'Couldn’t load your wishlist.'}
          onRetry={() => wishlistActions.refresh().catch(() => {})}
        />
      ) : count === 0 ? (
        <EmptyState
          icon={Icons.heart}
          title="Your wishlist is empty"
          message="Tap the heart on any product to save it for later."
          action={{ label: 'Start shopping', onPress: () => router.dismissTo(HOME_HREF) }}
        />
      ) : (
        <FlatList
          data={toRows(wishlist.items, layout.columns)}
          keyExtractor={(row) => row[0].id}
          renderItem={({ item }) => <ProductGridRow products={item} {...layout} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} colors={[theme.primary]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  top: {
    paddingTop: Spacing.three,
  },
  list: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
