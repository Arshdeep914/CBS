import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, Icons } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

type RemoteImageProps = {
  uri: string | null | undefined;
  width: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  dimmed?: boolean;
  /** `contain` keeps the whole product visible — better for catalogue shots on white. */
  fit?: 'cover' | 'contain';
};

/** A remote image with a muted placeholder while it loads (or when there's none). */
export function RemoteImage({ uri, width, height = width, radius = 0, style, dimmed, fit = 'cover' }: RemoteImageProps) {
  const theme = useTheme();

  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: theme.surfaceMuted }, styles.clip, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.fill, dimmed && styles.dimmed]}
          contentFit={fit}
          transition={150}
          recyclingKey={uri}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.empty}>
          <Icon name={Icons.box} color={theme.textMuted} size={Math.min(28, width / 3)} />
        </View>
      )}
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
