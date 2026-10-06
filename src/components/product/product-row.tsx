import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddButton } from '@/components/product/add-button';
import { Price } from '@/components/product/price';
import { RemoteImage } from '@/components/product/product-image';
import { RatingBadge } from '@/components/product/rating-badge';
import { TagBadge } from '@/components/product/tag-badge';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ProductSummary } from '@/services/types';

const IMAGE_SIZE = 116;

/** Zomato dish-style list row: details on the left, photo with ADD button on the right. */
export function ProductRow({ product }: { product: ProductSummary }) {
  const theme = useTheme();

  return (
    // No button role here: the row contains the ADD button, and nested buttons are invalid on web.
    <Pressable
      accessibilityLabel={product.name}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.border }, pressed && styles.pressed]}>
      <View style={styles.info}>
        {product.badge && <TagBadge badge={product.badge} />}
        {product.brand && (
          <AppText variant="micro" color="textMuted">
            {product.brand.toUpperCase()}
          </AppText>
        )}
        <AppText variant="subheading" numberOfLines={2}>
          {product.name}
        </AppText>
        {product.rating > 0 && <RatingBadge rating={product.rating} />}
        <Price price={product.price} mrp={product.mrp} />
        {product.isOutOfStock && (
          <AppText variant="caption" color="danger">
            Currently out of stock
          </AppText>
        )}
      </View>
      <View style={styles.media}>
        <RemoteImage uri={product.image} width={IMAGE_SIZE} radius={Radius.md} dimmed={product.isOutOfStock} />
        <View style={styles.add}>
          <AddButton product={product} size="sm" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.85,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  media: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  add: {
    position: 'absolute',
    bottom: -14,
    alignSelf: 'center',
  },
});
