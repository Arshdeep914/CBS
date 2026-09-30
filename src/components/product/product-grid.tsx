import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { ProductCard } from '@/components/product/product-card';
import { Spacing } from '@/constants/theme';
import type { Product } from '@/data/catalog';

const DEFAULT_GAP = Spacing.three - 4;

/** Column count and card width for a product grid of the given width. */
export function useGridLayout(width?: number, padding: number = Spacing.three, gap: number = DEFAULT_GAP) {
  const window = useWindowDimensions();
  const available = (width ?? Math.min(window.width, 900)) - padding * 2;
  const columns = available > 600 ? 3 : 2;
  const cardWidth = Math.floor((available - gap * (columns - 1)) / columns);
  return { columns, cardWidth, padding, gap };
}

/** Splits products into rows for a grid. */
export function toRows(products: Product[], columns: number) {
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += columns) rows.push(products.slice(i, i + columns));
  return rows;
}

type ProductGridRowProps = {
  products: Product[];
  cardWidth: number;
  padding: number;
  gap: number;
};

export function ProductGridRow({ products, cardWidth, padding, gap }: ProductGridRowProps) {
  return (
    <View style={[styles.row, { gap, paddingHorizontal: padding, paddingBottom: gap + 4 }]}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} width={cardWidth} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
