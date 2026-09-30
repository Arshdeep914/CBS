import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { FilterBar } from '@/components/filters/filter-bar';
import { ProductGridRow, toRows, useGridLayout } from '@/components/product/product-grid';
import { RemoteImage } from '@/components/product/product-image';
import { EndOfList, ProductGridSkeleton } from '@/components/product/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { Icons } from '@/components/ui/icon';
import { HeaderButton, ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { getCategory, productsByCategory } from '@/data/catalog';
import { usePagedList } from '@/hooks/use-paged-list';
import { useTheme } from '@/hooks/use-theme';
import { applyFilters, brandsIn, EMPTY_FILTERS, type Filters } from '@/lib/filters';
import { plural } from '@/lib/format';
import { useCartCount } from '@/store/cart';

const RAIL_WIDTH = 84;

/** Blinkit-style category page: subcategory rail on the left, products on the right. */
export default function CategoryScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { id, sub } = useLocalSearchParams<{ id: string; sub?: string }>();
  const category = getCategory(id);
  const itemCount = useCartCount();

  const [activeSub, setActiveSub] = useState<string>(sub ?? 'all');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const inCategory = category ? productsByCategory(category.id) : [];
  const inSub = activeSub === 'all' ? inCategory : inCategory.filter((p) => p.subcategoryId === activeSub);
  const filtered = applyFilters([...inSub], filters);
  const grid = useGridLayout(Math.min(width, 900) - RAIL_WIDTH, Spacing.two + 2, Spacing.two + 2);
  const page = usePagedList(filtered, `${activeSub}|${JSON.stringify(filters)}`, grid.columns * 5);

  if (!category) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Category" />
        <EmptyState icon={Icons.categories} title="Category not found" message="It may have been moved." />
      </View>
    );
  }


  const railItems = [
    { id: 'all', name: `All ${category.name}`, image: category.image },
    ...category.subcategories,
  ];

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={category.name}
        subtitle={plural(inCategory.length, 'product')}
        right={<HeaderButton icon={Icons.search} label="Search" onPress={() => router.push('/search')} />}
      />
      <View style={styles.body}>
        <ScrollView
          style={[styles.rail, { backgroundColor: theme.surface, borderRightColor: theme.border }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: CART_BAR_SPACE }}>
          {railItems.map((item) => {
            const active = item.id === activeSub;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveSub(item.id)}
                style={[styles.railItem, active && { backgroundColor: theme.primarySoft }]}>
                {active && <View style={[styles.railIndicator, { backgroundColor: theme.primary }]} />}
                <View style={[styles.railImage, { backgroundColor: category.tint }]}>
                  <RemoteImage image={item.image} width={44} radius={22} />
                </View>
                <AppText
                  variant="micro"
                  color={active ? 'primary' : 'textSecondary'}
                  numberOfLines={2}
                  style={styles.railLabel}>
                  {item.name}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <FlatList
          style={styles.flex}
          data={toRows(page.visible, grid.columns)}
          keyExtractor={(row) => row[0].id}
          renderItem={({ item }) => (
            <ProductGridRow products={item} cardWidth={grid.cardWidth} padding={grid.padding} gap={grid.gap} />
          )}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <View style={[styles.filters, { backgroundColor: theme.background }]}>
              <FilterBar filters={filters} onChange={setFilters} brands={brandsIn(inSub)} sticky />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon={Icons.filter}
              title="Nothing here yet"
              message="No products match these filters."
              action={{ label: 'Clear filters', onPress: () => setFilters(EMPTY_FILTERS) }}
            />
          }
          ListFooterComponent={
            page.hasMore ? (
              <ProductGridSkeleton {...grid} />
            ) : filtered.length > 0 ? (
              <EndOfList total={filtered.length} />
            ) : null
          }
          onEndReached={page.loadMore}
          onEndReachedThreshold={0.6}
          initialNumToRender={4}
          windowSize={7}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: itemCount > 0 ? CART_BAR_SPACE + Spacing.four : Spacing.five }}
        />
      </View>
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  filters: {
    paddingBottom: Spacing.one,
  },
  rail: {
    width: RAIL_WIDTH,
    flexGrow: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  railItem: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: Spacing.one,
  },
  railIndicator: {
    position: 'absolute',
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  railImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLabel: {
    textAlign: 'center',
  },
});
