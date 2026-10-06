import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ProductSummary } from '@/services/types';
import { cartActions, useCartPending, useCartQuantity } from '@/store/cart';

type AddButtonProps = {
  product: Pick<ProductSummary, 'id' | 'variationCode' | 'isOutOfStock' | 'name'>;
  size?: 'sm' | 'md' | 'lg';
  /** Upper bound for the stepper, when stock is known. */
  max?: number | null;
};

/**
 * "ADD" button that turns into a quantity stepper backed by the server cart.
 * Shows a spinner while its own request is in flight; other buttons stay live.
 */
export function AddButton({ product, size = 'md', max }: AddButtonProps) {
  const theme = useTheme();
  const quantity = useCartQuantity(product.id);
  const pending = useCartPending(product.id);
  const dims = SIZES[size];
  const textVariant = size === 'sm' ? 'captionStrong' : 'subheading';

  const run = (action: () => Promise<unknown>, fallback: string) =>
    action().catch((err) => toast.show(errorMessage(err, fallback), 'error'));

  if (product.isOutOfStock && quantity === 0) {
    return (
      <View style={[styles.base, dims, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <AppText variant="micro" color="textMuted">
          SOLD OUT
        </AppText>
      </View>
    );
  }

  if (quantity === 0) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name} to cart`}
        accessibilityState={{ busy: pending }}
        disabled={pending}
        onPress={() => run(() => cartActions.add(product), "Couldn't add that to your cart.")}
        style={({ pressed }) => [
          styles.base,
          dims,
          styles.shadow,
          { backgroundColor: pressed ? theme.primarySoft : theme.surface, borderColor: theme.primary },
        ]}>
        {pending ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <>
            <AppText variant={textVariant} color="primary">
              ADD
            </AppText>
            <View style={styles.plus}>
              <Icon name={Icons.plus} color={theme.primary} size={size === 'sm' ? 8 : 10} weight="bold" />
            </View>
          </>
        )}
      </Pressable>
    );
  }

  const atMax = max != null && max > 0 && quantity >= max;

  return (
    <View
      style={[styles.base, styles.stepper, dims, styles.shadow, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        hitSlop={6}
        disabled={pending}
        onPress={() => run(() => cartActions.setQty(product.id, quantity - 1), "Couldn't update the quantity.")}
        style={styles.stepButton}>
        <Icon name={quantity === 1 ? Icons.trash : Icons.minus} color={theme.onPrimary} size={size === 'sm' ? 12 : 14} weight="bold" />
      </Pressable>
      {pending ? (
        <ActivityIndicator size="small" color={theme.onPrimary} />
      ) : (
        <AppText variant={textVariant} color={theme.onPrimary}>
          {quantity}
        </AppText>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        hitSlop={6}
        disabled={pending || atMax}
        onPress={() => run(() => cartActions.setQty(product.id, quantity + 1), "Couldn't update the quantity.")}
        style={[styles.stepButton, atMax && styles.disabled]}>
        <Icon name={Icons.plus} color={theme.onPrimary} size={size === 'sm' ? 12 : 14} weight="bold" />
      </Pressable>
    </View>
  );
}

const SIZES = {
  sm: { width: 76, height: 32 },
  md: { width: 96, height: 38 },
  lg: { width: 128, height: 48 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  shadow: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  plus: {
    position: 'absolute',
    top: 2,
    right: 4,
  },
  stepper: {
    justifyContent: 'space-between',
  },
  stepButton: {
    height: '100%',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
