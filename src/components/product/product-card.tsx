import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddButton } from '@/components/product/add-button';
import { Price } from '@/components/product/price';
import { RemoteImage } from '@/components/product/product-image';
import { RatingBadge } from '@/components/product/rating-badge';
import { DiscountFlag, TagBadge } from '@/components/product/tag-badge';
import { WishlistButton } from '@/components/product/wishlist-button';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { discountPercent } from '@/lib/filters';
import type { ProductSummary } from '@/services/types';

type ProductCardProps = {
  product: ProductSummary;
  /** Card width in points. */
  width: number;
};

export function ProductCard({ product, width }: ProductCardProps) {
  const theme = useTheme();
  const off = discountPercent(product);

  return (
    // No button role here: the card contains the ADD button, and nested buttons are invalid on web.
    <Pressable
      accessibilityLabel={product.name}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View>
        <RemoteImage uri={product.image} width={width} height={width} dimmed={product.isOutOfStock} />
        <View style={styles.tag}>
          {product.badge ? <TagBadge badge={product.badge} /> : off >= 5 ? <DiscountFlag percent={off} /> : null}
        </View>
        <View style={styles.heart}>
          <WishlistButton product={product} size={30} />
        </View>
        <View style={styles.add}>
          <AddButton product={product} size="sm" />
        </View>
      </View>

      <View style={styles.body}>
        {product.brand && (
          <AppText variant="micro" color="textMuted" numberOfLines={1}>
            {product.brand.toUpperCase()}
          </AppText>
        )}
        <AppText variant="bodyStrong" numberOfLines={2} style={styles.name}>
          {product.name}
        </AppText>
        {product.rating > 0 && <RatingBadge rating={product.rating} />}
        <Price price={product.price} mrp={product.mrp} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  tag: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heart: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  add: {
    position: 'absolute',
    right: 8,
    bottom: -14,
  },
  body: {
    padding: Spacing.two + 2,
    paddingTop: Spacing.three,
    gap: 4,
  },
  name: {
    minHeight: 40,
  },
});
