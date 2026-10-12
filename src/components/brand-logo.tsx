import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useAppConfig } from '@/store/app-config';

const LOCAL_LOGO = require('@/assets/images/logo.png');
const LOCAL_ASPECT_RATIO = 426 / 394;

type BrandLogoProps = {
  /** Width of the logo card in points. */
  size?: number;
};

/**
 * The brand logo on a white card. It comes from the backend's configuration
 * when there is one, otherwise the built-in CBS logo — which is also used if
 * the remote image fails to load. The card stays white in dark mode because
 * the logo artwork has black lettering around its edges.
 */
export function BrandLogo({ size = 140 }: BrandLogoProps) {
  const { config } = useAppConfig();
  const remote = config.logo;
  const [failedUri, setFailedUri] = useState<string | null>(null);
  // learned from the image itself when the configuration doesn't say
  const [measured, setMeasured] = useState<{ uri: string; ratio: number } | null>(null);

  const useRemote = !!remote && failedUri !== remote.uri;
  const aspectRatio = useRemote
    ? (remote.aspectRatio ?? (measured?.uri === remote.uri ? measured.ratio : LOCAL_ASPECT_RATIO))
    : LOCAL_ASPECT_RATIO;
  const padding = Math.round(size * 0.08);

  return (
    <View style={[styles.card, { width: size, padding, borderRadius: size > 80 ? Radius.xl : Radius.sm }]}>
      <Image
        source={useRemote ? { uri: remote.uri } : LOCAL_LOGO}
        style={{ width: '100%', aspectRatio }}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={0}
        accessibilityLabel="Logo"
        onLoad={(event) => {
          const { width, height } = event.source;
          if (useRemote && !remote.aspectRatio && width > 0 && height > 0) {
            setMeasured({ uri: remote.uri, ratio: width / height });
          }
        }}
        onError={() => {
          if (useRemote) setFailedUri(remote.uri);
        }}
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
