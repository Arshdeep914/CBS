import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { CategoryTile, TILE_TINTS } from '@/components/home/category-tile';
import { TileGridSkeleton } from '@/components/product/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icons } from '@/components/ui/icon';
import { HeaderButton, ScreenHeader } from '@/components/ui/screen-header';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { plural } from '@/lib/format';
import { shop } from '@/services';
import { useCartCount } from '@/store/cart';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const itemCount = useCartCount();
  const categories = useAsync((_, options) => shop.catalog.categories(options), []);
  const columns = width > 600 ? 5 : 3;
  const tileWidth = (Math.min(width, 900) - Spacing.three * 2) / columns;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Categories"
        subtitle={categories.data ? plural(categories.data.length, 'category', 'categories') : undefined}
        showBack={false}
        right={<HeaderButton icon={Icons.search} label="Search" onPress={() => router.push('/search')} />}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={categories.refreshing}
            onRefresh={categories.refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={[styles.content, { paddingBottom: itemCount > 0 ? CART_BAR_SPACE : Spacing.four }]}>
        {categories.loading ? (
          <TileGridSkeleton tileWidth={tileWidth} count={12} />
        ) : categories.error ? (
          <ErrorState message={categories.error} onRetry={categories.reload} />
        ) : !categories.data?.length ? (
          <EmptyState icon={Icons.categories} title="No categories yet" message="Check back soon." />
        ) : (
          <View style={styles.grid}>
            {categories.data.map((category, index) => (
              <CategoryTile
                key={category.code}
                label={category.name}
                uri={category.image}
                tint={TILE_TINTS[index % TILE_TINTS.length]}
                width={tileWidth}
                onPress={() =>
                  router.push({ pathname: '/category/[id]', params: { id: category.code, name: category.name } })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
      <CartBar aboveTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
});
