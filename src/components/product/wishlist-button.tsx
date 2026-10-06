import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { Icon, Icons } from '@/components/ui/icon';
import { toast } from '@/components/ui/toast';
import { useTheme } from '@/hooks/use-theme';
import type { ProductSummary } from '@/services/types';
import { wishlistActions, useWishlisted, useWishlistPending } from '@/store/wishlist';

type WishlistButtonProps = {
  product: ProductSummary;
  /** Diameter in points. */
  size?: number;
};

/** Round heart toggle backed by the server wishlist, with its own spinner. */
export function WishlistButton({ product, size = 32 }: WishlistButtonProps) {
  const theme = useTheme();
  const saved = useWishlisted(product.id);
  const pending = useWishlistPending(product.id);

  async function toggle() {
    try {
      const nowSaved = await wishlistActions.toggle(product);
      toast.show(nowSaved ? 'Saved to your wishlist' : 'Removed from your wishlist', 'success');
    } catch (err) {
      toast.show(errorMessage(err, "Couldn't update your wishlist."), 'error');
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      accessibilityState={{ selected: saved, busy: pending }}
      disabled={pending}
      hitSlop={6}
      onPress={toggle}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      {pending ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : (
        <HeartIcon filled={saved} color={saved ? theme.primary : theme.textSecondary} size={Math.round(size * 0.5)} />
      )}
    </Pressable>
  );
}

/**
 * Heart that really fills in. On Android and web the icon font (Material
 * Symbols, outlined style) draws `favorite` as an outline just like
 * `favorite_border`, so the filled state is drawn from shapes instead: a
 * diamond plus two circles. iOS has a real `heart.fill` symbol.
 */
export function HeartIcon({ filled, color, size }: { filled: boolean; color: string; size: number }) {
  if (!filled || Platform.OS === 'ios') {
    return <Icon name={filled ? Icons.heartFill : Icons.heart} color={color} size={size} />;
  }
  // the font's glyphs sit inside ~84% of their box; match that so both states line up
  const s = size * 0.84;
  const diagonal = s * 0.8284;
  const side = diagonal / Math.SQRT2;
  const r = side / 2;
  const cx = size / 2;
  const cy = size / 2 + s * 0.043;
  const lobeY = cy - diagonal / 4;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
      <View
        style={[
          styles.shape,
          { width: side, height: side, left: cx - r, top: cy - r, backgroundColor: color, transform: [{ rotate: '45deg' }] },
        ]}
      />
      <View style={[styles.shape, { width: side, height: side, borderRadius: r, left: cx - diagonal / 4 - r, top: lobeY - r, backgroundColor: color }]} />
      <View style={[styles.shape, { width: side, height: side, borderRadius: r, left: cx + diagonal / 4 - r, top: lobeY - r, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shape: {
    position: 'absolute',
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
});
