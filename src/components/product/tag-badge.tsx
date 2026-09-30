import { StyleSheet, View } from 'react-native';

import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import type { ProductTag } from '@/data/catalog';

const TAGS: Record<ProductTag, { label: string; color: string; icon: IconName }> = {
  bestseller: { label: 'Bestseller', color: '#D9161C', icon: Icons.star },
  'bulk-deal': { label: 'Bulk deal', color: '#1B7F3B', icon: Icons.percent },
  trending: { label: 'Trending', color: '#E0701B', icon: Icons.flame },
  new: { label: 'New', color: '#6A3FC8', icon: Icons.sparkles },
};

/** Priority order when a product has several tags and only one fits. */
const PRIORITY: ProductTag[] = ['bulk-deal', 'bestseller', 'trending', 'new'];

export function primaryTag(tags: ProductTag[]) {
  return PRIORITY.find((tag) => tags.includes(tag));
}

export function TagBadge({ tag }: { tag: ProductTag }) {
  const config = TAGS[tag];

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Icon name={config.icon} color="#FFFFFF" size={9} weight="bold" />
      <AppText variant="micro" color="#FFFFFF">
        {config.label}
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
