import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { discountPercent, type Product } from '@/data/catalog';
import { formatINR } from '@/lib/format';

type PriceProps = {
  product: Product;
  size?: 'sm' | 'lg';
};

/** Wholesale price, struck-through MRP and margin percentage. */
export function Price({ product, size = 'sm' }: PriceProps) {
  const off = discountPercent(product);

  return (
    <View style={styles.row}>
      <AppText variant={size === 'lg' ? 'title' : 'subheading'}>{formatINR(product.price)}</AppText>
      <AppText
        variant={size === 'lg' ? 'body' : 'caption'}
        color="textMuted"
        style={styles.strike}>
        {formatINR(product.mrp)}
      </AppText>
      {off > 0 && (
        <AppText variant={size === 'lg' ? 'bodyStrong' : 'captionStrong'} color="success">
          {off}% off
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: 6,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
});
