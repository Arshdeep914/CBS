import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { discountPercent } from '@/lib/filters';
import { formatINR } from '@/lib/format';

type PriceProps = {
  price: number;
  mrp: number | null;
  size?: 'sm' | 'lg';
};

/** Selling price, struck-through MRP and discount — MRP only when it's higher. */
export function Price({ price, mrp, size = 'sm' }: PriceProps) {
  const off = discountPercent({ price, mrp });

  return (
    <View style={styles.row}>
      <AppText variant={size === 'lg' ? 'display' : 'subheading'}>{formatINR(price)}</AppText>
      {off > 0 && mrp && (
        <>
          <AppText variant={size === 'lg' ? 'body' : 'caption'} color="textMuted" style={styles.strike}>
            {formatINR(mrp)}
          </AppText>
          <AppText variant={size === 'lg' ? 'bodyStrong' : 'captionStrong'} color="success">
            {off}% off
          </AppText>
        </>
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
