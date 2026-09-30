import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { FilterBar } from '@/components/filters/filter-bar';
import { CategoryTile } from '@/components/home/category-tile';
import { ProductRow } from '@/components/product/product-row';
import { EndOfList, ProductRowSkeleton } from '@/components/product/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import {
  brands,
  categories,
  productsByTag,
  trendingSearches,
  type ProductTag,
} from '@/data/catalog';
import { usePagedList } from '@/hooks/use-paged-list';
import { useTheme } from '@/hooks/use-theme';
import { applyFilters, brandsIn, EMPTY_FILTERS, searchProducts, type Filters } from '@/lib/filters';
import { plural } from '@/lib/format';
import { useCartCount } from '@/store/cart';

const TAG_TITLES: Record<ProductTag, string> = {
  bestseller: 'Bestsellers',
  'bulk-deal': 'Bulk deals',
  new: 'New arrivals',
  trending: 'Trending now',
};

// Kept for the session so recent searches survive leaving the screen.
let recentSearches: string[] = ['Steel handi', 'Knife set'];

function rememberSearch(term: string) {
  const clean = term.trim();
  if (!clean) return;
  recentSearches = [clean, ...recentSearches.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
}

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tag?: ProductTag; q?: string }>();
  const itemCount = useCartCount();

  const [query, setQuery] = useState(params.q ?? '');
  const [tag, setTag] = useState<ProductTag | undefined>(params.tag);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [recent, setRecent] = useState(recentSearches);

  const trimmed = query.trim();
  const base = trimmed ? searchProducts(trimmed) : tag ? productsByTag(tag) : [];
  const results = applyFilters([...base], filters);
  const showResults = trimmed.length > 0 || tag !== undefined;
  const page = usePagedList(results, `${trimmed}|${tag ?? ''}|${JSON.stringify(filters)}`);

  const lower = trimmed.toLowerCase();
  const brandMatches = lower.length > 1 ? brands.filter((b) => b.name.toLowerCase().includes(lower)) : [];
  const categoryMatches =
    lower.length > 1
      ? categories.flatMap((c) => [
          ...(c.name.toLowerCase().includes(lower) ? [{ category: c, sub: undefined }] : []),
          ...c.subcategories
            .filter((s) => s.name.toLowerCase().includes(lower))
            .map((s) => ({ category: c, sub: s })),
        ])
      : [];

  function runSearch(term: string) {
    setQuery(term);
    setTag(undefined);
    rememberSearch(term);
    setRecent(recentSearches);
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two, borderBottomColor: theme.border }]}>
        <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()}>
            <Icon name={Icons.back} color={theme.text} size={18} weight="semibold" />
          </Pressable>
          <TextInput
            autoFocus={!params.tag}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (text) setTag(undefined);
            }}
            onSubmitEditing={() => runSearch(query)}
            placeholder={tag ? `Search in ${TAG_TITLES[tag].toLowerCase()}` : 'Search products, brands, categories'}
            placeholderTextColor={theme.textMuted}
            selectionColor={theme.primary}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.input, { color: theme.text }]}
          />
          {query.length > 0 ? (
            <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}>
              <View style={[styles.clear, { backgroundColor: theme.surfaceMuted }]}>
                <Icon name={Icons.close} color={theme.textSecondary} size={10} weight="bold" />
              </View>
            </Pressable>
          ) : (
            <Icon name={Icons.search} color={theme.primary} size={18} weight="semibold" />
          )}
        </View>
      </View>

      {showResults ? (
        <FlatList
          data={page.visible}
          onEndReached={page.loadMore}
          onEndReachedThreshold={0.6}
          initialNumToRender={6}
          windowSize={7}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: itemCount > 0 ? CART_BAR_SPACE + Spacing.three : Spacing.five }}
          ListHeaderComponent={
            <View>
              {(brandMatches.length > 0 || categoryMatches.length > 0) && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchRow}>
                  {brandMatches.map((brand) => (
                    <Pressable
                      key={brand.id}
                      onPress={() => router.push({ pathname: '/brand/[id]', params: { id: brand.id } })}
                      style={[styles.match, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <BrandMark brand={brand} size={28} />
                      <View>
                        <AppText variant="captionStrong">{brand.name}</AppText>
                        <AppText variant="micro" color="textMuted">BRAND</AppText>
                      </View>
                    </Pressable>
                  ))}
                  {categoryMatches.map(({ category, sub }) => (
                    <Pressable
                      key={`${category.id}-${sub?.id ?? 'all'}`}
                      onPress={() =>
                        router.push({
                          pathname: '/category/[id]',
                          params: sub ? { id: category.id, sub: sub.id } : { id: category.id },
                        })
                      }
                      style={[styles.match, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={[styles.matchIcon, { backgroundColor: category.tint }]}>
                        <Icon name={Icons.categories} color="#6B655E" size={14} />
                      </View>
                      <View>
                        <AppText variant="captionStrong">{sub?.name ?? category.name}</AppText>
                        <AppText variant="micro" color="textMuted">CATEGORY</AppText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <FilterBar filters={filters} onChange={setFilters} brands={brandsIn(base)} />
              <View style={styles.resultsHeading}>
                <AppText variant="subheading">
                  {tag && !trimmed ? TAG_TITLES[tag] : `Results for “${trimmed}”`}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {plural(results.length, 'product')}
                </AppText>
              </View>
            </View>
          }
          renderItem={({ item }) => <ProductRow product={item} />}
          ListFooterComponent={
            page.hasMore ? <ProductRowSkeleton /> : results.length > 0 ? <EndOfList total={results.length} /> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={Icons.search}
              title="No matches"
              message={
                base.length > 0
                  ? 'Your filters hid every result. Try clearing them.'
                  : 'Check the spelling or try a broader term like “cooker” or “bottle”.'
              }
              action={base.length > 0 ? { label: 'Clear filters', onPress: () => setFilters(EMPTY_FILTERS) } : undefined}
            />
          }
        />
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.discover}>
          {recent.length > 0 && (
            <View style={styles.block}>
              <SectionHeader
                title="Recent searches"
                actionLabel="Clear"
                onAction={() => {
                  recentSearches = [];
                  setRecent([]);
                }}
              />
              <View style={styles.wrap}>
                {recent.map((term) => (
                  <Pressable
                    key={term}
                    onPress={() => runSearch(term)}
                    style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Icon name={Icons.history} color={theme.textMuted} size={14} />
                    <AppText variant="caption">{term}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={styles.block}>
            <SectionHeader title="Trending in wholesale" />
            <View style={styles.wrap}>
              {trendingSearches.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => runSearch(term)}
                  style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Icon name={Icons.trending} color={theme.primary} size={14} />
                  <AppText variant="caption">{term}</AppText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <SectionHeader title="Browse categories" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {categories.map((category) => (
                <CategoryTile
                  key={category.id}
                  label={category.name}
                  image={category.image}
                  tint={category.tint}
                  width={84}
                  onPress={() => router.push({ pathname: '/category/[id]', params: { id: category.id } })}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.block}>
            <SectionHeader title="Popular brands" onAction={() => router.push('/brands')} />
            <View style={styles.wrap}>
              {brands.map((brand) => (
                <Pressable
                  key={brand.id}
                  onPress={() => router.push({ pathname: '/brand/[id]', params: { id: brand.id } })}
                  style={[styles.brandPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <BrandMark brand={brand} size={24} />
                  <AppText variant="captionStrong">{brand.name}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three - 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  field: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    // The field draws its own focus border; hide the browser outline on web.
    outlineWidth: 0,
  },
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three - 4,
  },
  match: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: Spacing.three - 4,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  matchIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  discover: {
    paddingVertical: Spacing.four,
    gap: Spacing.five - 4,
    paddingBottom: CART_BAR_SPACE,
  },
  block: {
    gap: Spacing.three - 4,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: 5,
    paddingRight: Spacing.three - 4,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
