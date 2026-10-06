import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

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
        <Icon
          name={saved ? Icons.heartFill : Icons.heart}
          color={saved ? theme.primary : theme.textSecondary}
          size={Math.round(size * 0.5)}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
