import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark, brandColor } from '@/components/brand-mark';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { FilterBar } from '@/components/filters/filter-bar';
import { PagedProductGrid } from '@/components/product/paged-grid';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useInfiniteList } from '@/hooks/use-infinite-list';
import { useTheme } from '@/hooks/use-theme';
import { applyLocalFilters, EMPTY_FILTERS, serverFilterKey, serverFilters, type Filters } from '@/lib/filters';
import { shop } from '@/services';
import { useCartCount } from '@/store/cart';

const BAND_HEIGHT = 150;

export default function BrandScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { name = '' } = useLocalSearchParams<{ name: string }>();
  const itemCount = useCartCount();
  const color = brandColor(name);

  const filterOptions = useAsync(() => shop.catalog.filters(), []);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const list = useInfiniteList(
    (page, signal) => shop.catalog.brandProducts(name, page, serverFilters(filters), signal),
    `${name}|${serverFilterKey(filters)}`,
  );
  const visible = applyLocalFilters([...list.items], filters);
  // the brand is fixed on this page, so don't offer it as a filter
  const groups = (filterOptions.data?.groups ?? []).filter((g) => g.code.toUpperCase() !== 'BRAND');

  const intro = (
    <View>
      <View style={[styles.band, { backgroundColor: color }]}>
        <View style={[styles.circle, styles.circleLarge]} />
        <View style={[styles.circle, styles.circleSmall]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
          <Icon name={Icons.back} color="#FFFFFF" size={18} weight="semibold" />
        </Pressable>
      </View>
      <View style={styles.intro}>
        <BrandMark name={name} size={76} />
        <AppText variant="display">{name}</AppText>
        <AppText color="textSecondary">
          {list.loading
            ? 'Loading the range…'
            : `${list.items.length}${list.hasMore ? '+' : ''} products from ${name}`}
        </AppText>
      </View>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {/* Content starts below the status bar so the sticky filters never slide under it. */}
      <View style={{ height: insets.top, backgroundColor: color }} />
      <PagedProductGrid
        list={list}
        products={visible}
        loadedCount={list.items.length}
        intro={intro}
        stickyHeader={
          <View style={{ backgroundColor: theme.background }}>
            <FilterBar filters={filters} onChange={setFilters} groups={groups} sticky />
          </View>
        }
        onClearFilters={() => setFilters(EMPTY_FILTERS)}
        emptyTitle={`No ${name} products yet`}
        bottomPadding={itemCount > 0 ? CART_BAR_SPACE + Spacing.four : Spacing.five}
      />
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  band: {
    height: BAND_HEIGHT,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  circleLarge: {
    width: 260,
    height: 260,
    top: -120,
    right: -70,
  },
  circleSmall: {
    width: 140,
    height: 140,
    bottom: -80,
    left: 40,
  },
  back: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.three,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    paddingHorizontal: Spacing.three,
    marginTop: -38,
    gap: Spacing.one + 2,
    paddingBottom: Spacing.two,
  },
});
