import { router } from 'expo-router';
import { type ReactElement } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandCard } from '@/components/brand-card';
import { BrandLogo } from '@/components/brand-logo';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { BannerCarousel } from '@/components/home/banner-carousel';
import { CategoryTile, TILE_TINTS } from '@/components/home/category-tile';
import { ProductRail } from '@/components/home/product-rail';
import { RailSkeleton, TileGridSkeleton } from '@/components/product/skeletons';
import { SearchLauncher } from '@/components/search-launcher';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon, Icons } from '@/components/ui/icon';
import { HeaderButton } from '@/components/ui/screen-header';
import { DividerTitle, SectionHeader } from '@/components/ui/section-header';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { shop } from '@/services';
import { useCartCount } from '@/store/cart';
import { useSession } from '@/store/session';

type HomeItem = { key: 'header' | 'search' | 'discover' | 'sections' | 'footer' };

const ITEMS: HomeItem[] = [{ key: 'header' }, { key: 'search' }, { key: 'discover' }, { key: 'sections' }, { key: 'footer' }];

// the search bar sticks to the top while scrolling
const STICKY_INDEXES = [1];

/** Categories shown on home before "See all". */
const HOME_CATEGORY_LIMIT = 7;

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

  const categories = useAsync(() => shop.catalog.categories(), []);
  const brands = useAsync(() => shop.catalog.brands(), []);
  const sections = useAsync((signal) => shop.catalog.home(signal), []);

  function refreshAll() {
    sections.refresh();
    if (categories.error) categories.reload();
    if (brands.error) brands.reload();
  }

  function renderItem({ item }: { item: HomeItem }): ReactElement | null {
    switch (item.key) {
      case 'header':
        return <HomeHeader cartCount={itemCount} />;
      case 'search':
        return (
          <View style={[styles.searchWrap, { backgroundColor: theme.background }]}>
            <SearchLauncher hints={categories.data?.map((c) => c.name)} />
          </View>
        );
      case 'discover':
        return (
          <View style={styles.sections}>
            <BannerCarousel />
            <CategoriesBlock state={categories} contentWidth={contentWidth} />
            <BrandsBlock state={brands} />
          </View>
        );
      case 'sections':
        if (sections.loading) {
          return (
            <View style={styles.sections}>
              <RailSkeleton />
              <RailSkeleton />
            </View>
          );
        }
        if (sections.error) return <ErrorState message={sections.error} onRetry={sections.reload} />;
        if (!sections.data?.length) {
          return (
            <EmptyState icon={Icons.box} title="No products yet" message="New products will show up here soon." />
          );
        }
        return (
          <View style={styles.sections}>
            {sections.data.map((section) => (
              <ProductRail
                key={section.code}
                title={section.title}
                products={section.products}
                onSeeAll={() =>
                  router.push({ pathname: '/search', params: { section: section.code, title: section.title } })
                }
              />
            ))}
          </View>
        );
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
    // The top inset lives outside the list so the sticky search bar stops below the status bar.
    <View style={[styles.flex, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <FlatList
        data={ITEMS}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        // re-render rows when any of the three data sources changes
        extraData={[categories.data, categories.loading, categories.error, brands.data, brands.loading, sections.data, sections.loading, sections.error, itemCount]}
        stickyHeaderIndices={STICKY_INDEXES}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={sections.refreshing} onRefresh={refreshAll} tintColor={theme.primary} colors={[theme.primary]} />
        }
        contentContainerStyle={{ paddingBottom: itemCount > 0 ? CART_BAR_SPACE : Spacing.four }}
      />
      <CartBar aboveTabBar />
    </View>
  );
}

function HomeHeader({ cartCount }: { cartCount: number }) {
  const theme = useTheme();
  const { user } = useSession();
  const firstName = user?.name.trim().split(/\s+/)[0];
  const initials = (user?.name || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.header}>
      <BrandLogo size={44} />
      <View style={styles.flex}>
        <AppText variant="caption" color="textSecondary">
          {greeting()}
          {firstName ? `, ${firstName}` : ''}
        </AppText>
        <AppText variant="subheading" numberOfLines={1}>
          CBS Kitchenware
        </AppText>
      </View>
      <HeaderButton icon={Icons.cart} label="Cart" badge={cartCount} onPress={() => router.push('/cart')} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Account"
        onPress={() => router.navigate('/account')}
        style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
        <AppText variant="captionStrong" color="primary">
          {initials}
        </AppText>
      </Pressable>
    </View>
  );
}

type AsyncList<T> = { data: T[] | undefined; loading: boolean; error: string | null; reload: () => void };

function CategoriesBlock({
  state,
  contentWidth,
}: {
  state: AsyncList<{ code: string; name: string; image: string | null }>;
  contentWidth: number;
}) {
  const theme = useTheme();
  const tileWidth = (contentWidth - Spacing.three * 2) / 4;
  const list = state.data ?? [];
  const shown = list.length > HOME_CATEGORY_LIMIT + 1 ? list.slice(0, HOME_CATEGORY_LIMIT) : list;

  return (
    <View style={styles.section}>
      <DividerTitle title="WHAT ARE YOU LOOKING FOR?" />
      {state.loading ? (
        <TileGridSkeleton tileWidth={tileWidth} count={8} />
      ) : state.error ? (
        <ErrorState compact message={state.error} onRetry={state.reload} />
      ) : (
        <View style={styles.categoryGrid}>
          {shown.map((category, index) => (
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
          {shown.length < list.length && (
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
          )}
        </View>
      )}
    </View>
  );
}

function BrandsBlock({ state }: { state: AsyncList<{ name: string }> }) {
  // brands are a nice-to-have on home: hide quietly when unavailable
  if (state.error || (!state.loading && !state.data?.length)) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Top brands" subtitle="Shop by your favourite makers" onAction={() => router.push('/brands')} />
      {state.loading ? (
        <RailSkeleton cardWidth={132} showTitle={false} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {state.data!.slice(0, 12).map((brand) => (
            <BrandCard key={brand.name} brand={brand} width={132} />
          ))}
        </ScrollView>
      )}
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
    paddingBottom: Spacing.four,
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
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  footerTitle: {
    fontSize: 40,
    lineHeight: 44,
    opacity: 0.5,
  },
});
