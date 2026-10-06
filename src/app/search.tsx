import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { FilterBar } from '@/components/filters/filter-bar';
import { CategoryTile, TILE_TINTS } from '@/components/home/category-tile';
import { PagedProductGrid } from '@/components/product/paged-grid';
import { ProductRow } from '@/components/product/product-row';
import { EndOfList, ProductRowSkeleton } from '@/components/product/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icon, Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useInfiniteList } from '@/hooks/use-infinite-list';
import { useTheme } from '@/hooks/use-theme';
import { applyLocalFilters, EMPTY_FILTERS, type Filters } from '@/lib/filters';
import { shop } from '@/services';
import { useCartCount } from '@/store/cart';

// Kept for the session so recent searches survive leaving the screen.
let recentSearches: string[] = [];

function remember(term: string) {
  const clean = term.trim();
  if (!clean) return;
  recentSearches = [clean, ...recentSearches.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ section?: string; title?: string; q?: string }>();
  // "See all" from a home section lists that section instead of searching
  if (params.section) return <SectionList code={params.section} title={params.title ?? 'Products'} />;
  return <SearchView initialQuery={params.q ?? ''} />;
}

/* ------------------------------------------------------------------ */
/*  section listing                                                    */
/* ------------------------------------------------------------------ */

function SectionList({ code, title }: { code: string; title: string }) {
  const theme = useTheme();
  const itemCount = useCartCount();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const list = useInfiniteList((page, signal) => shop.catalog.sectionProducts(code, page, signal), code);
  const visible = applyLocalFilters([...list.items], filters);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title={title} subtitle={list.loading ? 'Loading…' : `${list.items.length}${list.hasMore ? '+' : ''} products`} />
      <PagedProductGrid
        list={list}
        products={visible}
        loadedCount={list.items.length}
        // this endpoint has no server filters: sort and quick toggles only
        stickyHeader={
          <View style={{ backgroundColor: theme.background }}>
            <FilterBar filters={filters} onChange={setFilters} groups={[]} showPrice={false} sticky />
          </View>
        }
        onClearFilters={() => setFilters(EMPTY_FILTERS)}
        bottomPadding={itemCount > 0 ? CART_BAR_SPACE + Spacing.four : Spacing.five}
      />
      <CartBar />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  search                                                             */
/* ------------------------------------------------------------------ */

function SearchView({ initialQuery }: { initialQuery: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const itemCount = useCartCount();

  const [query, setQuery] = useState(initialQuery);
  /** The term results are shown for; typing again switches back to suggestions. */
  const [submitted, setSubmitted] = useState(initialQuery);
  const [recent, setRecent] = useState(recentSearches);

  const typing = query.trim() !== submitted.trim() && query.trim().length > 0;
  const debounced = useDebounced(query.trim(), 300);
  const suggestions = useAsync(
    (signal) => (typing && debounced.length > 1 ? shop.catalog.suggestions(debounced, signal) : Promise.resolve([])),
    [typing, debounced],
  );

  function run(term: string) {
    const clean = term.trim();
    if (!clean) return;
    setQuery(clean);
    setSubmitted(clean);
    remember(clean);
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
            autoFocus={!initialQuery}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (!text.trim()) setSubmitted('');
            }}
            onSubmitEditing={() => run(query)}
            placeholder="Search products and brands"
            placeholderTextColor={theme.textMuted}
            selectionColor={theme.primary}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.input, { color: theme.text }]}
          />
          {suggestions.loading && typing && debounced.length > 1 ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              hitSlop={10}
              onPress={() => {
                setQuery('');
                setSubmitted('');
              }}>
              <View style={[styles.clear, { backgroundColor: theme.surfaceMuted }]}>
                <Icon name={Icons.close} color={theme.textSecondary} size={10} weight="bold" />
              </View>
            </Pressable>
          ) : (
            <Icon name={Icons.search} color={theme.primary} size={18} weight="semibold" />
          )}
        </View>
      </View>

      {typing ? (
        <Suggestions
          query={query.trim()}
          items={suggestions.data ?? []}
          loading={suggestions.loading && debounced.length > 1}
          onSearch={() => run(query)}
        />
      ) : submitted ? (
        <Results query={submitted} bottomPadding={itemCount > 0 ? CART_BAR_SPACE + Spacing.three : Spacing.five} />
      ) : (
        <Discover
          recent={recent}
          onPick={run}
          onClearRecent={() => {
            recentSearches = [];
            setRecent([]);
          }}
        />
      )}
      <CartBar />
    </View>
  );
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function Suggestions({
  query,
  items,
  loading,
  onSearch,
}: {
  query: string;
  items: { id: string; name: string }[];
  loading: boolean;
  onSearch: () => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView keyboardShouldPersistTaps="handled">
      <Pressable onPress={onSearch} style={[styles.suggestion, { borderBottomColor: theme.border }]}>
        <Icon name={Icons.search} color={theme.primary} size={16} />
        <AppText variant="bodyStrong" style={styles.flex}>
          Search for “{query}”
        </AppText>
        <Icon name={Icons.chevronRight} color={theme.textMuted} size={12} />
      </Pressable>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
          style={({ pressed }) => [
            styles.suggestion,
            { borderBottomColor: theme.border },
            pressed && { backgroundColor: theme.surfaceMuted },
          ]}>
          <Icon name={Icons.box} color={theme.textMuted} size={16} />
          <AppText numberOfLines={2} style={styles.flex}>
            {item.name}
          </AppText>
        </Pressable>
      ))}
      {!loading && items.length === 0 && query.length > 1 && (
        <AppText variant="caption" color="textMuted" style={styles.hint}>
          No quick matches — press search to look through everything.
        </AppText>
      )}
    </ScrollView>
  );
}

function Results({ query, bottomPadding }: { query: string; bottomPadding: number }) {
  const theme = useTheme();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const list = useInfiniteList((page, signal) => shop.catalog.search(query, page, signal), query);
  const visible = applyLocalFilters([...list.items], filters);

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ProductRow product={item} />}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.6}
      initialNumToRender={6}
      windowSize={7}
      refreshControl={
        <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} colors={[theme.primary]} />
      }
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      ListHeaderComponent={
        <View>
          <FilterBar filters={filters} onChange={setFilters} groups={[]} showPrice={false} />
          <View style={styles.resultsHeading}>
            <AppText variant="subheading">Results for “{query}”</AppText>
            {!list.loading && (
              <AppText variant="caption" color="textMuted">
                {list.items.length}
                {list.hasMore ? '+' : ''} found
              </AppText>
            )}
          </View>
        </View>
      }
      ListEmptyComponent={
        list.loading ? null : list.error ? (
          <ErrorState message={list.error} onRetry={list.retry} />
        ) : list.items.length > 0 ? (
          <EmptyState
            icon={Icons.filter}
            title="No products match"
            message="Your filters hid every result."
            action={{ label: 'Clear filters', onPress: () => setFilters(EMPTY_FILTERS) }}
          />
        ) : (
          <EmptyState icon={Icons.search} title="No matches" message="Check the spelling or try a broader word." />
        )
      }
      ListFooterComponent={
        list.loading ? (
          <ProductRowSkeleton count={4} />
        ) : list.error && list.items.length > 0 ? (
          <ErrorState compact message={list.error} onRetry={list.retry} />
        ) : list.loadingMore || (list.hasMore && visible.length > 0) ? (
          <ProductRowSkeleton count={list.loadingMore ? 2 : 1} />
        ) : visible.length > 0 ? (
          <EndOfList label="That’s everything we found" />
        ) : null
      }
    />
  );
}

function Discover({ recent, onPick, onClearRecent }: { recent: string[]; onPick: (term: string) => void; onClearRecent: () => void }) {
  const theme = useTheme();
  const categories = useAsync(() => shop.catalog.categories(), []);
  const brands = useAsync(() => shop.catalog.brands(), []);

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.discover}>
      {recent.length > 0 && (
        <View style={styles.block}>
          <SectionHeader title="Recent searches" actionLabel="Clear" onAction={onClearRecent} />
          <View style={styles.wrap}>
            {recent.map((term) => (
              <Pressable
                key={term}
                onPress={() => onPick(term)}
                style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Icon name={Icons.history} color={theme.textMuted} size={14} />
                <AppText variant="caption">{term}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {(categories.data?.length ?? 0) > 0 && (
        <View style={styles.block}>
          <SectionHeader title="Browse categories" onAction={() => router.navigate('/categories')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {categories.data!.map((category, index) => (
              <CategoryTile
                key={category.code}
                label={category.name}
                uri={category.image}
                tint={TILE_TINTS[index % TILE_TINTS.length]}
                width={84}
                onPress={() =>
                  router.push({ pathname: '/category/[id]', params: { id: category.code, name: category.name } })
                }
              />
            ))}
          </ScrollView>
        </View>
      )}

      {(brands.data?.length ?? 0) > 0 && (
        <View style={styles.block}>
          <SectionHeader title="Popular brands" onAction={() => router.push('/brands')} />
          <View style={styles.wrap}>
            {brands.data!.slice(0, 16).map((brand) => (
              <Pressable
                key={brand.name}
                onPress={() => router.push({ pathname: '/brand/[name]', params: { name: brand.name } })}
                style={[styles.brandPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <BrandMark name={brand.name} size={24} />
                <AppText variant="captionStrong">{brand.name}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {(categories.loading || brands.loading) && <ProductRowSkeleton count={2} />}
      {categories.error && <ErrorState compact message={categories.error} onRetry={categories.reload} />}
    </ScrollView>
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
    // the field draws its own focus border; hide the browser outline on web
    outlineWidth: 0,
  },
  clear: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hint: {
    padding: Spacing.three,
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
