import { StyleSheet, View } from 'react-native';

import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import type { ProductBadge } from '@/services/types';

const BADGES: Record<ProductBadge, { label: string; color: string; icon: IconName }> = {
  bestseller: { label: 'Bestseller', color: '#D9161C', icon: Icons.star },
  deal: { label: 'Deal', color: '#1B7F3B', icon: Icons.percent },
  trending: { label: 'Trending', color: '#E0701B', icon: Icons.flame },
  new: { label: 'New', color: '#6A3FC8', icon: Icons.sparkles },
};

export function TagBadge({ badge }: { badge: ProductBadge }) {
  const config = BADGES[badge];

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Icon name={config.icon} color="#FFFFFF" size={9} weight="bold" />
      <AppText variant="micro" color="#FFFFFF">
        {config.label}
      </AppText>
    </View>
  );
}

/** A "-23%" corner flag, used when a product has no curated badge. */
export function DiscountFlag({ percent }: { percent: number }) {
  return (
    <View style={[styles.badge, { backgroundColor: '#1B7F3B' }]}>
      <AppText variant="micro" color="#FFFFFF">
        {percent}% OFF
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderTopLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignSelf: 'flex-start',
  },
});
