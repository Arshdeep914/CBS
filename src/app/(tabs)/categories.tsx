import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CART_BAR_SPACE, CartBar } from '@/components/cart-bar';
import { CategoryTile } from '@/components/home/category-tile';
import { RemoteImage } from '@/components/product/product-image';
import { Icons } from '@/components/ui/icon';
import { HeaderButton, ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { categories, productsByCategory } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';
import { plural } from '@/lib/format';
import { useCartCount } from '@/store/cart';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const itemCount = useCartCount();
  const tileWidth = (Math.min(width, 900) - Spacing.three * 2) / 4;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Categories"
        showBack={false}
        right={<HeaderButton icon={Icons.search} label="Search" onPress={() => router.push('/search')} />}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: itemCount > 0 ? CART_BAR_SPACE : Spacing.four }]}>
        {categories.map((category) => (
          <View key={category.id} style={styles.section}>
            <Pressable
              onPress={() => router.push({ pathname: '/category/[id]', params: { id: category.id } })}
              style={[styles.banner, { backgroundColor: category.tint }]}>
              <View style={styles.flex}>
                <AppText variant="heading" color="#1B1A19">
                  {category.name}
                </AppText>
                <AppText variant="caption" color="#6B655E">
                  {category.tagline} · {plural(productsByCategory(category.id).length, 'product')}
                </AppText>
              </View>
              <RemoteImage image={category.image} width={64} radius={Radius.md} />
            </Pressable>
            <View style={styles.grid}>
              {category.subcategories.map((sub) => (
                <CategoryTile
                  key={sub.id}
                  label={sub.name}
                  image={sub.image}
                  tint={category.tint}
                  width={tileWidth}
                  onPress={() =>
                    router.push({ pathname: '/category/[id]', params: { id: category.id, sub: sub.id } })
                  }
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <CartBar aboveTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    padding: Spacing.three - 4,
    paddingLeft: Spacing.three,
    borderRadius: Radius.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
