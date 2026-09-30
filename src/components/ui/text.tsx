import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong'
  | 'overline'
  | 'micro';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  /** A theme token such as `textSecondary`, or any raw colour. */
  color?: ThemeColor | (string & {});
};

export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  const resolved = color in theme ? theme[color as ThemeColor] : color;

  return <Text {...rest} style={[styles[variant], { color: resolved }, style]} />;
}

const styles = StyleSheet.create({
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.4 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  captionStrong: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1.2 },
  micro: { fontSize: 10, lineHeight: 13, fontWeight: '700' },
});
