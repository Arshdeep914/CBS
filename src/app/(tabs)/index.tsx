import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandCard } from '@/components/brand-card';
import { BrandLogo } from '@/components/brand-logo';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { FilterBar } from '@/components/filters/filter-bar';
import { BannerCarousel } from '@/components/home/banner-carousel';
import { CategoryTile } from '@/components/home/category-tile';
import { ProductRail } from '@/components/home/product-rail';
import { ProductGridRow, toRows, useGridLayout } from '@/components/product/product-grid';
import { EndOfList, ProductGridSkeleton } from '@/components/product/skeletons';
import { RemoteImage } from '@/components/product/product-image';
import { SearchLauncher } from '@/components/search-launcher';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons } from '@/components/ui/icon';
import { HeaderButton } from '@/components/ui/screen-header';
import { DividerTitle, SectionHeader } from '@/components/ui/section-header';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { demoAccount } from '@/data/account';
import { brands, categories, getProduct, products, productsByTag, type Product } from '@/data/catalog';
import { usePagedList } from '@/hooks/use-paged-list';
import { useTheme } from '@/hooks/use-theme';
import { applyFilters, EMPTY_FILTERS, type Filters } from '@/lib/filters';
import { useCartCount } from '@/store/cart';
import { useOrders } from '@/store/orders';

type HomeItem =
  | { key: 'header' }
  | { key: 'search' }
  | { key: 'discover' }
  | { key: 'filters' }
  | { key: 'empty' }
  | { key: 'loading' }
  | { key: 'end' }
  | { key: 'footer' }
  | { key: string; row: Product[] };

// Indexes of the items that stick to the top while scrolling.
const STICKY_INDEXES = [1, 3];

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth, 900);
  const itemCount = useCartCount();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const grid = useGridLayout(contentWidth);

  const filtered = applyFilters([...products], filters);
  // Products arrive a page at a time as the user nears the bottom.
  const page = usePagedList(filtered, JSON.stringify(filters));
  const rows = toRows(page.visible, grid.columns);

  const items: HomeItem[] = [
    { key: 'header' },
    { key: 'search' },
    { key: 'discover' },
    { key: 'filters' },
    ...(rows.length > 0 ? rows.map((row) => ({ key: `row-${row[0].id}`, row })) : [{ key: 'empty' as const }]),
    ...(page.hasMore ? [{ key: 'loading' as const }] : rows.length > 0 ? [{ key: 'end' as const }] : []),
    { key: 'footer' },
  ];

  function renderItem({ item }: { item: HomeItem }): ReactElement | null {
    if ('row' in item) {
      return <ProductGridRow products={item.row} cardWidth={grid.cardWidth} padding={grid.padding} gap={grid.gap} />;
    }
    switch (item.key) {
      case 'header':
        return <HomeHeader cartCount={itemCount} />;
      case 'search':
        return (
          <View style={[styles.searchWrap, { backgroundColor: theme.background }]}>
            <SearchLauncher />
          </View>
        );
      case 'discover':
        return <Discover contentWidth={contentWidth} />;
      case 'filters':
        return (
          <View style={{ backgroundColor: theme.background }}>
            <FilterBar filters={filters} onChange={setFilters} brands={brands} sticky />
          </View>
        );
      case 'empty':
        return (
          <EmptyState
            icon={Icons.filter}
            title="No products match"
            message="Try removing a filter to see more of the catalogue."
            action={{ label: 'Clear filters', onPress: () => setFilters(EMPTY_FILTERS) }}
          />
        );
      case 'loading':
        return <ProductGridSkeleton {...grid} rows={page.loading ? 2 : 1} />;
      case 'end':
        return <EndOfList total={page.total} />;
      case 'footer':
        return (
          <View style={styles.footer}>
            <AppText variant="display" color="textMuted" style={styles.footerTitle}>
              Designer for{'\n'}your kitchen.
            </AppText>
            <AppText variant="caption" color="textMuted">
              CBS Kitchenware · Since 1976 · ISO 9001:2015
            </AppText>
          </View>
        );
      default:
        return null;
    }
  }

  return (
    // The top inset lives outside the list so sticky items stop below the status bar and notch.
    <View style={[styles.flex, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        stickyHeaderIndices={STICKY_INDEXES}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: itemCount > 0 ? CART_BAR_SPACE : Spacing.four }}
        onEndReached={page.loadMore}
        onEndReachedThreshold={0.8}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={7}
      />
      <CartBar aboveTabBar />
    </View>
  );
}

function HomeHeader({ cartCount }: { cartCount: number }) {
  const theme = useTheme();
  const firstName = demoAccount.ownerName.split(' ')[0];

  return (
    <View style={styles.header}>
      <BrandLogo size={44} />
      <View style={styles.flex}>
        <AppText variant="caption" color="textSecondary">
          {greeting()}, {firstName}
        </AppText>
        <AppText variant="subheading" numberOfLines={1}>
          {demoAccount.businessName}
        </AppText>
      </View>
      <HeaderButton icon={Icons.cart} label="Cart" badge={cartCount} onPress={() => router.push('/cart')} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Account"
        onPress={() => router.navigate('/account')}
        style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
        <AppText variant="captionStrong" color="primary">
          RS
        </AppText>
      </Pressable>
    </View>
  );
}

/** Banners, categories, brands and product rails. Rendered once as a single list item. */
function Discover({ contentWidth }: { contentWidth: number }) {
  const theme = useTheme();
  const { orders } = useOrders();
  const tileWidth = (contentWidth - Spacing.three * 2) / 4;

  const lastDelivered = orders.find((o) => o.status === 'delivered');
  const orderAgain = (lastDelivered?.lines ?? []).flatMap((line) => getProduct(line.productId) ?? []);

  return (
    <View style={styles.sections}>
      <BannerCarousel />

      <View style={styles.section}>
        <DividerTitle title="WHAT ARE YOU STOCKING UP ON?" />
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <CategoryTile
              key={category.id}
              label={category.name}
              image={category.image}
              tint={category.tint}
              width={tileWidth}
              onPress={() => router.push({ pathname: '/category/[id]', params: { id: category.id } })}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/categories')}
            style={[styles.moreTile, { width: tileWidth }]}>
            <View style={[styles.moreCircle, { backgroundColor: theme.surfaceMuted }]}>
              <Icon name={Icons.categories} color={theme.textSecondary} size={26} />
            </View>
            <AppText variant="caption" style={styles.moreLabel}>
              See all
            </AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Top brands" subtitle="Authorised CBS distribution" onAction={() => router.push('/brands')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {brands.filter((b) => b.featured).map((brand) => (
            <BrandCard key={brand.id} brand={brand} width={132} />
          ))}
        </ScrollView>
      </View>

      <ProductRail
        title="Bestsellers"
        subtitle="Most reordered by retailers this month"
        products={productsByTag('bestseller').slice(0, 10)}
        onSeeAll={() => router.push({ pathname: '/search', params: { tag: 'bestseller' } })}
      />

      <Pressable
        onPress={() => router.push({ pathname: '/search', params: { tag: 'bulk-deal' } })}
        style={[styles.offer, { backgroundColor: theme.successSoft }]}>
        <View style={styles.flex}>
          <AppText variant="overline" color="success">
            TRADE OFFER
          </AppText>
          <AppText variant="heading">Extra 5% off with BULK5</AppText>
          <AppText variant="caption" color="textSecondary">
            On orders above ₹20,000 · Free delivery above ₹25,000
          </AppText>
        </View>
        <RemoteImage image="potsWall" width={84} radius={Radius.md} />
      </Pressable>

      <ProductRail
        title="Bulk deals"
        subtitle="Deeper price breaks on 5+ and 10+ cartons"
        products={productsByTag('bulk-deal').slice(0, 10)}
        onSeeAll={() => router.push({ pathname: '/search', params: { tag: 'bulk-deal' } })}
      />

      {orderAgain.length > 0 && (
        <ProductRail title="Order again" subtitle="From your last delivered order" products={orderAgain} />
      )}

      <ProductRail
        title="New arrivals"
        subtitle="Fresh stock from our brands"
        products={productsByTag('new')}
        onSeeAll={() => router.push({ pathname: '/search', params: { tag: 'new' } })}
      />

      <DividerTitle title={`ALL PRODUCTS · ${products.length}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three - 4,
  },
  sections: {
    gap: Spacing.five - 4,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  section: {
    gap: Spacing.three,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  moreTile: {
    alignItems: 'center',
    gap: 6,
  },
  moreCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreLabel: {
    fontWeight: '600',
  },
  rail: {
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
  },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  footerTitle: {
    fontSize: 40,
    lineHeight: 44,
    opacity: 0.5,
  },
});
