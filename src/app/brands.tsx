import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BrandCard } from '@/components/brand-card';
import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Spacing } from '@/constants/theme';
import { brands } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';

export default function BrandsScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const available = Math.min(width, 900) - Spacing.three * 2;
  const columns = available > 600 ? 4 : 2;
  const gap = Spacing.three - 4;
  const cardWidth = Math.floor((available - gap * (columns - 1)) / columns);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="All brands" subtitle={`${brands.length} brands distributed by CBS`} />
      <ScrollView contentContainerStyle={[styles.grid, { gap, paddingBottom: CART_BAR_SPACE }]}>
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} width={cardWidth} />
        ))}
      </ScrollView>
      <CartBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.three,
  },
});
