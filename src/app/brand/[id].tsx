import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactElement } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { FilterBar } from '@/components/filters/filter-bar';
import { ProductGridRow, toRows, useGridLayout } from '@/components/product/product-grid';
import { RemoteImage } from '@/components/product/product-image';
import { EndOfList, ProductGridSkeleton } from '@/components/product/skeletons';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { categories, getBrand, productsByBrand, type Product } from '@/data/catalog';
import { usePagedList } from '@/hooks/use-paged-list';
import { useTheme } from '@/hooks/use-theme';
import { applyFilters, EMPTY_FILTERS, type Filters } from '@/lib/filters';
import { useCartCount } from '@/store/cart';

const COVER_HEIGHT = 220;

type BrandItem = { key: 'intro' } | { key: 'filters' } | { key: 'empty' } | { key: 'loading' } | { key: 'end' } | { key: string; row: Product[] };

export default function BrandScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const brand = getBrand(id);
  const itemCount = useCartCount();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const all = brand ? productsByBrand(brand.id) : [];
  const inCategory = categoryId ? all.filter((p) => p.categoryId === categoryId) : all;
  const filtered = applyFilters([...inCategory], filters);
  const coverWidth = Math.min(width, 900);
  const grid = useGridLayout(coverWidth);
  const page = usePagedList(filtered, `${categoryId}|${JSON.stringify(filters)}`, grid.columns * 4);

  if (!brand) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Brand" />
        <EmptyState icon={Icons.store} title="Brand not found" message="It may no longer be available." />
      </View>
    );
  }

  const brandCategories = categories.filter((c) => all.some((p) => p.categoryId === c.id));
  const avgRating = all.reduce((sum, p) => sum + p.rating, 0) / all.length;
  const rows = toRows(page.visible, grid.columns);
  const items: BrandItem[] = [
    { key: 'intro' },
    { key: 'filters' },
    ...(rows.length > 0 ? rows.map((row) => ({ key: `row-${row[0].id}`, row })) : [{ key: 'empty' as const }]),
    ...(page.hasMore ? [{ key: 'loading' as const }] : rows.length > 0 ? [{ key: 'end' as const }] : []),
  ];

  function renderItem({ item }: { item: BrandItem }): ReactElement | null {
    if (!brand) return null;
    if ('row' in item) {
      return <ProductGridRow products={item.row} cardWidth={grid.cardWidth} padding={grid.padding} gap={grid.gap} />;
    }
    switch (item.key) {
      case 'intro':
        return (
          <View>
            <View style={{ height: COVER_HEIGHT }}>
              <RemoteImage image={brand.cover} width={coverWidth} height={COVER_HEIGHT} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: brand.color, opacity: 0.55 }]} />
              <View style={[StyleSheet.absoluteFill, styles.coverShade]} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => router.back()}
                style={[styles.back, { top: Spacing.two }]}>
                <Icon name={Icons.back} color="#FFFFFF" size={18} weight="semibold" />
              </Pressable>
            </View>

            <View style={styles.intro}>
              <View style={styles.markRow}>
                <BrandMark brand={brand} size={76} />
                {brand.featured && (
                  <View style={[styles.verified, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Icon name={Icons.verified} color="#1F6FD1" size={14} />
                    <AppText variant="captionStrong">Authorised brand</AppText>
                  </View>
                )}
              </View>
              <AppText variant="display">{brand.name}</AppText>
              <AppText color="textSecondary">{brand.tagline}</AppText>
              <View style={[styles.stats, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Stat value={all.length.toString()} label="Products" />
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <Stat value={`${avgRating.toFixed(1)} ★`} label="Avg rating" />
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <Stat value={brand.since.toString()} label="Since" />
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <Stat value={brand.origin.split(',')[0]} label="Based in" />
              </View>
            </View>
          </View>
        );
      case 'filters':
        return (
          <View style={{ backgroundColor: theme.background, paddingBottom: Spacing.one }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              <Chip label="All" selected={categoryId === null} onPress={() => setCategoryId(null)} />
              {brandCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() => setCategoryId(categoryId === category.id ? null : category.id)}
                />
              ))}
            </ScrollView>
            <FilterBar filters={filters} onChange={setFilters} brands={[]} />
          </View>
        );
      case 'empty':
        return (
          <EmptyState
            icon={Icons.filter}
            title="No products match"
            message="Try a different filter."
            action={{ label: 'Clear filters', onPress: () => setFilters(EMPTY_FILTERS) }}
          />
        );
      case 'loading':
        return <ProductGridSkeleton {...grid} />;
      case 'end':
        return <EndOfList total={filtered.length} />;
      default:
        return null;
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      {/* Content starts below the status bar so the sticky filters never slide under it. */}
      <View style={{ height: insets.top, backgroundColor: brand.color }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        stickyHeaderIndices={[1]}
        onEndReached={page.loadMore}
        onEndReachedThreshold={0.6}
        initialNumToRender={4}
        windowSize={7}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: itemCount > 0 ? CART_BAR_SPACE + Spacing.four : Spacing.five }}
      />
      <CartBar />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="bodyStrong" numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="micro" color="textMuted">
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  coverShade: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  back: {
    position: 'absolute',
    left: Spacing.three,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    paddingHorizontal: Spacing.three,
    marginTop: -38,
    gap: Spacing.one + 2,
    paddingBottom: Spacing.two,
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three - 4,
    paddingVertical: Spacing.three - 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  catRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three - 4,
  },
});
