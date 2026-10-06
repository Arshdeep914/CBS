import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BrandCard } from '@/components/brand-card';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { CardListSkeleton } from '@/components/product/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { plural } from '@/lib/format';
import { shop } from '@/services';

export default function BrandsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const brands = useAsync(() => shop.catalog.brands(), []);
  const available = Math.min(width, 900) - Spacing.three * 2;
  const columns = available > 600 ? 4 : 2;
  const gap = Spacing.three - 4;
  const cardWidth = Math.floor((available - gap * (columns - 1)) / columns);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="All brands" subtitle={brands.data ? plural(brands.data.length, 'brand') : undefined} />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={brands.refreshing} onRefresh={brands.refresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
        contentContainerStyle={[styles.content, { paddingBottom: CART_BAR_SPACE }]}>
        {brands.loading ? (
          <CardListSkeleton count={4} height={110} />
        ) : brands.error ? (
          <ErrorState message={brands.error} onRetry={brands.reload} />
        ) : !brands.data?.length ? (
          <EmptyState icon={Icons.store} title="No brands yet" message="Brands will appear here once listed." />
        ) : (
          <View style={[styles.grid, { gap }]}>
            {brands.data.map((brand) => (
              <BrandCard key={brand.name} brand={brand} width={cardWidth} />
            ))}
          </View>
        )}
      </ScrollView>
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
