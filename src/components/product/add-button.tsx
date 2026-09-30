import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import type { Product } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { cartActions, useCartQuantity } from '@/store/cart';

type AddButtonProps = {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
};

/**
 * "ADD" button that turns into a quantity stepper. Adds at the product's
 * minimum order quantity and steps by its case pack.
 */
export function AddButton({ product, size = 'md' }: AddButtonProps) {
  const theme = useTheme();
  const quantity = useCartQuantity(product.id);
  const dims = SIZES[size];

  if (product.stock === 'out-of-stock') {
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
        onPress={() => cartActions.add(product)}
        style={({ pressed }) => [
          styles.base,
          dims,
          styles.shadow,
          { backgroundColor: pressed ? theme.primarySoft : theme.surface, borderColor: theme.primary },
        ]}>
        <AppText variant={size === 'sm' ? 'captionStrong' : 'subheading'} color="primary">
          ADD
        </AppText>
        <View style={styles.plus}>
          <Icon name={Icons.plus} color={theme.primary} size={size === 'sm' ? 8 : 10} weight="bold" />
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, styles.stepper, dims, styles.shadow, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        hitSlop={6}
        onPress={() => cartActions.decrement(product)}
        style={styles.stepButton}>
        <Icon name={Icons.minus} color={theme.onPrimary} size={size === 'sm' ? 12 : 14} weight="bold" />
      </Pressable>
      <AppText variant={size === 'sm' ? 'captionStrong' : 'subheading'} color={theme.onPrimary}>
        {quantity}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        hitSlop={6}
        onPress={() => cartActions.increment(product)}
        style={styles.stepButton}>
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
});
