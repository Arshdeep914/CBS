import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';

const PALETTE = ['#D9161C', '#4A5561', '#E0701B', '#2E2A27', '#1F5FA8', '#0F8A7E', '#9A6B3F', '#3B7DD8', '#6A3FC8', '#B5487A'];

/** A stable colour per brand name, since the API has no brand logos. */
export function brandColor(name: string) {
  let hash = 0;
  for (const char of name.toLowerCase()) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function brandMonogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

type BrandMarkProps = {
  name: string;
  size?: number;
};

/** Monogram stand-in for a brand logo. */
export function BrandMark({ name, size = 56 }: BrandMarkProps) {
  const monogram = brandMonogram(name);
  const fontSize = size * (monogram.length > 1 ? 0.34 : 0.42);

  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: brandColor(name) },
      ]}>
      <AppText
        variant="heading"
        color="#FFFFFF"
        style={{ fontSize, lineHeight: fontSize * 1.15, fontWeight: '900', letterSpacing: 0.5 }}>
        {monogram}
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
