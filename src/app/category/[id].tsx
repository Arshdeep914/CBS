import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { FilterBar } from '@/components/filters/filter-bar';
import { TILE_TINTS } from '@/components/home/category-tile';
import { PagedProductGrid } from '@/components/product/paged-grid';
import { RemoteImage } from '@/components/product/product-image';
import { Block } from '@/components/product/skeletons';
import { Icons } from '@/components/ui/icon';
import { HeaderButton, ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useInfiniteList } from '@/hooks/use-infinite-list';
import { useTheme } from '@/hooks/use-theme';
import { applyLocalFilters, EMPTY_FILTERS, serverFilterKey, serverFilters, type Filters } from '@/lib/filters';
import { shop } from '@/services';
import { useCartCount } from '@/store/cart';

const RAIL_WIDTH = 84;

/**
 * Blinkit-style category page: every category in a rail on the left, the
 * selected one's products on the right, loaded page by page.
 */
export default function CategoryScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const itemCount = useCartCount();

  const categories = useAsync(() => shop.catalog.categories(), []);
  const filterOptions = useAsync(() => shop.catalog.filters(), []);

  const [activeCode, setActiveCode] = useState(params.id);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const active = categories.data?.find((c) => c.code === activeCode);
  // the listing endpoint is queried by category *name*
  const activeName = active?.name ?? (activeCode === params.id ? params.name : undefined) ?? '';

  const list = useInfiniteList(
    (page, signal) =>
      activeName
        ? shop.catalog.categoryProducts(activeName, page, serverFilters(filters), signal)
        : Promise.resolve([]),
    `${activeName}|${serverFilterKey(filters)}`,
  );
  const visible = applyLocalFilters([...list.items], filters);
  const gridWidth = Math.min(width, 900) - RAIL_WIDTH;

  function select(code: string) {
    if (code === activeCode) return;
    setActiveCode(code);
    // filters like "brand" rarely carry over between categories
    setFilters(EMPTY_FILTERS);
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={activeName || 'Category'}
        subtitle={list.loading ? 'Loading…' : `${list.items.length}${list.hasMore ? '+' : ''} products`}
        right={<HeaderButton icon={Icons.search} label="Search" onPress={() => router.push('/search')} />}
      />
      <View style={styles.body}>
        <ScrollView
          style={[styles.rail, { backgroundColor: theme.surface, borderRightColor: theme.border }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: CART_BAR_SPACE }}>
          {categories.loading
            ? Array.from({ length: 7 }, (_, i) => (
                <View key={i} style={styles.railItem}>
                  <Block width={52} height={52} radius={26} />
                  <Block width={56} height={9} />
                </View>
              ))
            : (categories.data ?? []).map((item, index) => {
                const selected = item.code === activeCode;
                return (
                  <Pressable
                    key={item.code}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => select(item.code)}
                    style={[styles.railItem, selected && { backgroundColor: theme.primarySoft }]}>
                    {selected && <View style={[styles.railIndicator, { backgroundColor: theme.primary }]} />}
                    <View style={[styles.railImage, { backgroundColor: TILE_TINTS[index % TILE_TINTS.length] }]}>
                      <RemoteImage uri={item.image} width={44} radius={22} />
                    </View>
                    <AppText
                      variant="micro"
                      color={selected ? 'primary' : 'textSecondary'}
                      numberOfLines={2}
                      style={styles.railLabel}>
                      {item.name}
                    </AppText>
                  </Pressable>
                );
              })}
        </ScrollView>

        <View style={styles.flex}>
          <PagedProductGrid
            list={list}
            products={visible}
            loadedCount={list.items.length}
            width={gridWidth}
            padding={Spacing.two + 2}
            gap={Spacing.two + 2}
            stickyHeader={
              <View style={{ backgroundColor: theme.background }}>
                <FilterBar filters={filters} onChange={setFilters} groups={filterOptions.data?.groups ?? []} sticky />
              </View>
            }
            onClearFilters={() => setFilters(EMPTY_FILTERS)}
            emptyTitle="Nothing in this category yet"
            bottomPadding={itemCount > 0 ? CART_BAR_SPACE + Spacing.four : Spacing.five}
          />
        </View>
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
