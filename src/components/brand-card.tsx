import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandMark, brandColor } from '@/components/brand-mark';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Brand } from '@/services/types';

type BrandCardProps = {
  brand: Brand;
  width: number;
};

/** Brand tile: a tinted band with the brand's monogram. */
export function BrandCard({ brand, width }: BrandCardProps) {
  const theme = useTheme();
  const color = brandColor(brand.name);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={brand.name}
      onPress={() => router.push({ pathname: '/brand/[name]', params: { name: brand.name } })}
      style={({ pressed }) => [
        styles.card,
        { width, backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.band, { backgroundColor: color }]}>
        <View style={[styles.circle, styles.circleLarge]} />
        <View style={[styles.circle, styles.circleSmall]} />
      </View>
      <View style={styles.mark}>
        <BrandMark name={brand.name} size={44} />
      </View>
      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {brand.name}
        </AppText>
        <AppText variant="caption" color="textMuted">
          Shop the range
        </AppText>
      </View>
    </Pressable>
  );
}

const BAND = 56;

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  band: {
    height: BAND,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  circleLarge: {
    width: 90,
    height: 90,
    top: -40,
    right: -20,
  },
  circleSmall: {
    width: 50,
    height: 50,
    bottom: -30,
    left: 30,
  },
  mark: {
    position: 'absolute',
    top: BAND - 22,
    left: Spacing.two + 2,
  },
  body: {
    paddingHorizontal: Spacing.two + 2,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two + 2,
  },
});
