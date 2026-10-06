import type { ReactElement } from 'react';
import { FlatList, RefreshControl } from 'react-native';

import { ProductGridRow, toRows, useGridLayout } from '@/components/product/product-grid';
import { EndOfList, ProductGridSkeleton } from '@/components/product/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Icons } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ProductSummary } from '@/services/types';

type PagedList = {
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  refresh: () => void;
};

type PagedProductGridProps = {
  list: PagedList;
  /** Products to show — the loaded pages after any on-device sort/filter. */
  products: ProductSummary[];
  /** Total loaded before on-device filtering, to tell "empty" from "filtered out". */
  loadedCount: number;
  width?: number;
  padding?: number;
  gap?: number;
  /** Scrolls away at the top (e.g. a brand intro). */
  intro?: ReactElement;
  /** Sticks to the top while scrolling (e.g. the filter bar). */
  stickyHeader?: ReactElement;
  bottomPadding?: number;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
};

type Item =
  | { kind: 'intro'; key: string }
  | { kind: 'header'; key: string }
  | { kind: 'status'; key: string }
  | { kind: 'row'; key: string; products: ProductSummary[] };

/**
 * A product grid fed by server pages: the next page loads as you near the
 * bottom, with skeleton cards on first load and while more arrive.
 */
export function PagedProductGrid({
  list,
  products,
  loadedCount,
  width,
  padding = Spacing.three,
  gap = Spacing.three - 4,
  intro,
  stickyHeader,
  bottomPadding = Spacing.five,
  onClearFilters,
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'No products are listed here right now.',
}: PagedProductGridProps) {
  const theme = useTheme();
  const layout = useGridLayout(width, padding, gap);

  const items: Item[] = [
    ...(intro ? [{ kind: 'intro' as const, key: 'intro' }] : []),
    ...(stickyHeader ? [{ kind: 'header' as const, key: 'header' }] : []),
    ...(products.length === 0 ? [{ kind: 'status' as const, key: 'status' }] : []),
    ...toRows(products, layout.columns).map((row) => ({ kind: 'row' as const, key: row[0].id, products: row })),
  ];
  const stickyIndex = stickyHeader ? (intro ? 1 : 0) : -1;

  function status() {
    if (list.loading) return null; // the footer shows the skeleton
    if (list.error) return <ErrorState message={list.error} onRetry={list.retry} />;
    if (loadedCount > 0 && onClearFilters) {
      return (
        <EmptyState
          icon={Icons.filter}
          title="No products match"
          message="Try removing a filter to see more."
          action={{ label: 'Clear filters', onPress: onClearFilters }}
        />
      );
    }
    return <EmptyState icon={Icons.box} title={emptyTitle} message={emptyMessage} />;
  }

  function footer() {
    if (list.loading) return <ProductGridSkeleton {...layout} rows={3} />;
    if (list.error && loadedCount > 0) return <ErrorState compact message={list.error} onRetry={list.retry} />;
    if (list.loadingMore || list.hasMore) {
      return products.length > 0 ? <ProductGridSkeleton {...layout} rows={list.loadingMore ? 2 : 1} /> : null;
    }
    if (products.length > 0) return <EndOfList label={`That’s everything · ${products.length} products`} />;
    return null;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => {
        switch (item.kind) {
          case 'intro':
            return intro ?? null;
          case 'header':
            return stickyHeader ?? null;
          case 'status':
            return status();
          case 'row':
            return (
              <ProductGridRow products={item.products} cardWidth={layout.cardWidth} padding={layout.padding} gap={layout.gap} />
            );
        }
      }}
      stickyHeaderIndices={stickyIndex >= 0 ? [stickyIndex] : undefined}
      ListFooterComponent={footer()}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.6}
      initialNumToRender={6}
      windowSize={7}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} colors={[theme.primary]} />
      }
      contentContainerStyle={{ paddingBottom: bottomPadding }}
    />
  );
}
