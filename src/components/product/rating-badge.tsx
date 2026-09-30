import { StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { formatCount } from '@/lib/format';

type RatingBadgeProps = {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
};

/** Zomato-style green rating pill. */
export function RatingBadge({ rating, count, size = 'sm' }: RatingBadgeProps) {
  const color = rating >= 4.5 ? '#1B7F3B' : rating >= 4 ? '#2E9B4F' : '#C38A00';

  return (
    <View style={styles.row}>
      <View style={[styles.pill, size === 'md' && styles.pillMd, { backgroundColor: color }]}>
        <AppText variant={size === 'md' ? 'captionStrong' : 'micro'} color="#FFFFFF">
          {rating.toFixed(1)}
        </AppText>
        <Icon name={Icons.star} color="#FFFFFF" size={size === 'md' ? 11 : 8} />
      </View>
      {count !== undefined && (
        <AppText variant={size === 'md' ? 'caption' : 'micro'} color="textMuted">
          ({formatCount(count)})
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  pillMd: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    gap: 3,
  },
});
