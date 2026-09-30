import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import type { Brand } from '@/data/catalog';

type BrandMarkProps = {
  brand: Brand;
  size?: number;
};

/** Monogram stand-in for a brand logo. */
export function BrandMark({ brand, size = 56 }: BrandMarkProps) {
  const fontSize = size * (brand.monogram.length > 2 ? 0.26 : brand.monogram.length > 1 ? 0.32 : 0.42);

  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: brand.color },
      ]}>
      <AppText
        variant="heading"
        color="#FFFFFF"
        style={{ fontSize, lineHeight: fontSize * 1.15, fontWeight: '900', letterSpacing: 0.5 }}>
        {brand.monogram}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
});
