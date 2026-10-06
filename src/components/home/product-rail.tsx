import { FlatList, StyleSheet, View } from 'react-native';

import { ProductCard } from '@/components/product/product-card';
import { SectionHeader } from '@/components/ui/section-header';
import { Spacing } from '@/constants/theme';
import type { ProductSummary } from '@/services/types';

type ProductRailProps = {
  title: string;
  subtitle?: string;
  products: ProductSummary[];
  onSeeAll?: () => void;
};

const CARD_WIDTH = 152;
const GAP = Spacing.three - 4;

/** Horizontal, virtualised row of product cards with a section title. */
export function ProductRail({ title, subtitle, products, onSeeAll }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <View style={styles.root}>
      <SectionHeader title={title} subtitle={subtitle} onAction={onSeeAll} />
      <FlatList
        horizontal
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} width={CARD_WIDTH} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + GAP,
          offset: Spacing.three + (CARD_WIDTH + GAP) * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.three - 4,
  },
  track: {
    gap: GAP,
    paddingHorizontal: Spacing.three,
  },
});
