import { Image } from 'expo-image';
import { PixelRatio, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { imageUrl, type ImageKey } from '@/data/images';
import { useTheme } from '@/hooks/use-theme';

type RemoteImageProps = {
  image: ImageKey;
  /** Rendered width in points; used to request a right-sized image. */
  width: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  dimmed?: boolean;
};

// 2x is visually indistinguishable at these sizes and roughly halves download weight on 3x phones.
const scale = Math.min(PixelRatio.get(), 2);

export function RemoteImage({ image, width, height = width, radius = 0, style, dimmed }: RemoteImageProps) {
  const theme = useTheme();

  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: theme.surfaceMuted }, styles.clip, style]}>
      <Image
        source={imageUrl(image, Math.round(width * scale), Math.round(height * scale))}
        style={[styles.fill, dimmed && styles.dimmed]}
        contentFit="cover"
        transition={150}
        recyclingKey={image}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  dimmed: {
    opacity: 0.45,
  },
});
