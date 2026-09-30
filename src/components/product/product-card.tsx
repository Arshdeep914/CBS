import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddButton } from '@/components/product/add-button';
import { Price } from '@/components/product/price';
import { RemoteImage } from '@/components/product/product-image';
import { RatingBadge } from '@/components/product/rating-badge';
import { primaryTag, TagBadge } from '@/components/product/tag-badge';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { getBrand, type Product } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';

type ProductCardProps = {
  product: Product;
  /** Card width in points. */
  width: number;
};

export function ProductCard({ product, width }: ProductCardProps) {
  const theme = useTheme();
  const brand = getBrand(product.brandId);
  const tag = primaryTag(product.tags);
  const soldOut = product.stock === 'out-of-stock';

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
        <RemoteImage image={product.images[0]} width={width} height={width} dimmed={soldOut} />
        {tag && (
          <View style={styles.tag}>
            <TagBadge tag={tag} />
          </View>
        )}
        {product.stock === 'low-stock' && (
          <View style={[styles.stockNote, { backgroundColor: theme.warningSoft }]}>
            <AppText variant="micro" color="warning">
              Few cartons left
            </AppText>
          </View>
        )}
        <View style={styles.add}>
          <AddButton product={product} size="sm" />
        </View>
      </View>

      <View style={styles.body}>
        <AppText variant="micro" color="textMuted" numberOfLines={1}>
          {brand?.name.toUpperCase()}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={2} style={styles.name}>
          {product.name}
        </AppText>
        <View style={styles.meta}>
          <RatingBadge rating={product.rating} count={product.ratingCount} />
        </View>
        <AppText variant="caption" color="textSecondary">
          MOQ {product.moq} {product.unit}
        </AppText>
        <Price product={product} />
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
  stockNote: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  add: {
    position: 'absolute',
    right: 8,
    bottom: -14,
  },
  body: {
    padding: Spacing.two + 2,
    paddingTop: Spacing.three,
    gap: 3,
  },
  name: {
    minHeight: 40,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
