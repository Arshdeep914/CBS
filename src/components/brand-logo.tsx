import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';

const LOGO_ASPECT_RATIO = 426 / 394;

type BrandLogoProps = {
  /** Width of the logo card in points. */
  size?: number;
};

/**
 * The CBS logo on a white card. The card stays white in dark mode because the
 * logo artwork has black lettering around its edges.
 */
export function BrandLogo({ size = 140 }: BrandLogoProps) {
  const padding = Math.round(size * 0.08);

  return (
    <View style={[styles.card, { width: size, padding, borderRadius: size > 80 ? Radius.xl : Radius.sm }]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: '100%', aspectRatio: LOGO_ASPECT_RATIO }}
        contentFit="contain"
        accessibilityLabel="CBS Kitchenware logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 12px 32px rgba(40, 10, 10, 0.18)',
  },
});
