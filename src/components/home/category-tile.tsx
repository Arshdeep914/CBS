import { Pressable, StyleSheet, View } from 'react-native';

import { RemoteImage } from '@/components/product/product-image';
import { AppText } from '@/components/ui/text';

type CategoryTileProps = {
  label: string;
  uri: string | null;
  tint: string;
  width: number;
  onPress: () => void;
};

/** Soft pastel backgrounds that cycle across category tiles. */
export const TILE_TINTS = ['#FDECEA', '#EAF2FB', '#EAF6EE', '#FFF4E0', '#EFEAFB', '#FBEFE6', '#E8F5F6'];

/** Round photo tile with a label. */
export function CategoryTile({ label, uri, tint, width, onPress }: CategoryTileProps) {
  const size = Math.min(width - 8, 76);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.pressed]}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}>
        <RemoteImage uri={uri} width={size - 8} radius={(size - 8) / 2} fit="cover" />
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
