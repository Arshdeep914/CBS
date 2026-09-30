import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { RemoteImage } from '@/components/product/product-image';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { productsByBrand, type Brand } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { plural } from '@/lib/format';

type BrandCardProps = {
  brand: Brand;
  width: number;
};

/** Brand tile: cover photo with the brand mark overlapping it. */
export function BrandCard({ brand, width }: BrandCardProps) {
  const theme = useTheme();
  const count = productsByBrand(brand.id).length;
  const coverHeight = Math.round(width * 0.55);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={brand.name}
      onPress={() => router.push({ pathname: '/brand/[id]', params: { id: brand.id } })}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <RemoteImage image={brand.cover} width={width} height={coverHeight} />
      <View style={[styles.mark, { top: coverHeight - 22 }]}>
        <BrandMark brand={brand} size={44} />
      </View>
      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {brand.name}
        </AppText>
        <AppText variant="caption" color="textMuted" numberOfLines={1}>
          {plural(count, 'product')}
        </AppText>
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
  mark: {
    position: 'absolute',
    left: Spacing.two + 2,
  },
  body: {
    paddingHorizontal: Spacing.two + 2,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two + 2,
  },
});
