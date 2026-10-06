import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RemoteImage } from '@/components/product/product-image';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatINR, plural } from '@/lib/format';
import { cartTotals, useCartState } from '@/store/cart';

/** Height reserved at the bottom of scroll views so content isn't hidden behind the bar. */
export const CART_BAR_SPACE = 88;

type CartBarProps = {
  /** Set inside tab screens, where the tab bar already handles the safe area. */
  aboveTabBar?: boolean;
};

/** Floating "View cart" bar, shown whenever the cart has items. */
export function CartBar({ aboveTabBar = false }: CartBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { lines } = useCartState();

  if (lines.length === 0) return null;
  const totals = cartTotals(lines);

  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={[styles.wrap, { bottom: aboveTabBar ? Spacing.three - 4 : insets.bottom + Spacing.three - 4 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="View cart"
        onPress={() => router.push('/cart')}
        style={({ pressed }) => [styles.bar, { backgroundColor: pressed ? theme.primaryPressed : theme.primary }]}>
        <View style={styles.thumbs}>
          {lines.slice(0, 3).map((line, index) => (
            <View key={line.id} style={[styles.thumb, { marginLeft: index === 0 ? 0 : -14, borderColor: theme.primary }]}>
              <RemoteImage uri={line.image} width={34} radius={17} />
            </View>
          ))}
        </View>
        <View style={styles.text}>
          <AppText variant="bodyStrong" color={theme.onPrimary}>
            View cart
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.85)">
            {plural(totals.itemCount, 'item')} · {formatINR(totals.subtotal)}
          </AppText>
        </View>
        <Icon name={Icons.chevronRight} color={theme.onPrimary} size={16} weight="bold" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: MaxFormWidth,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
    boxShadow: '0 8px 24px rgba(160, 10, 15, 0.35)',
  },
  thumbs: {
    flexDirection: 'row',
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
