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

const IMAGE_SIZE = 116;

/** Zomato dish-style list row: details on the left, photo with ADD button on the right. */
export function ProductRow({ product }: { product: Product }) {
  const theme = useTheme();
  const brand = getBrand(product.brandId);
  const tag = primaryTag(product.tags);

  return (
    // No button role here: the card contains the ADD button, and nested buttons are invalid on web.
    <Pressable
      accessibilityLabel={product.name}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.border }, pressed && styles.pressed]}>
      <View style={styles.info}>
        {tag && <TagBadge tag={tag} />}
        <AppText variant="micro" color="textMuted">
          {brand?.name.toUpperCase()}
        </AppText>
        <AppText variant="subheading" numberOfLines={2}>
          {product.name}
        </AppText>
        <RatingBadge rating={product.rating} count={product.ratingCount} />
        <Price product={product} />
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          MOQ {product.moq} {product.unit} · {product.highlights[0]}
        </AppText>
      </View>
      <View style={styles.media}>
        <RemoteImage
          image={product.images[0]}
          width={IMAGE_SIZE}
          radius={Radius.md}
          dimmed={product.stock === 'out-of-stock'}
        />
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
