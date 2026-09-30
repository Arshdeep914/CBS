import { Pressable, StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/product/product-image';
import { AppText } from '@/components/ui/text';
import type { ImageKey } from '@/data/images';

type CategoryTileProps = {
  label: string;
  image: ImageKey;
  tint: string;
  width: number;
  onPress: () => void;
};

/** Round photo tile with a label, used for categories and subcategories. */
export function CategoryTile({ label, image, tint, width, onPress }: CategoryTileProps) {
  const size = Math.min(width - 8, 76);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.pressed]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}>
        <RemoteImage image={image} width={size - 8} radius={(size - 8) / 2} />
      </View>
      <AppText variant="caption" numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
