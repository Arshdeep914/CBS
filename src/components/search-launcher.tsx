import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FALLBACK_HINTS = ['products', 'brands', 'categories'];

type SearchLauncherProps = {
  /** Words to rotate through, e.g. the store's category names. */
  hints?: string[];
  /** Shows a filter button on the right; without it the bar is search only. */
  onFilterPress?: () => void;
  /** Number of filters in effect, shown as a dot on the filter button. */
  filterCount?: number;
};

/**
 * Search field with a rotating placeholder, like Zomato's home search. Two tap
 * targets side by side: the field opens Search, the filter icon calls
 * `onFilterPress`.
 */
export function SearchLauncher({ hints, onFilterPress, filterCount = 0 }: SearchLauncherProps) {
  const theme = useTheme();
  const words = hints && hints.length > 0 ? hints : FALLBACK_HINTS;
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => i + 1), 2600);
    return () => clearInterval(timer);
  }, []);

  // Slide each new suggestion up into place.
  useEffect(() => {
    progress.set(0);
    progress.set(withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }));
  }, [index, progress]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * 10 }],
  }));

  return (
    <View style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search products"
        onPress={() => router.push('/search')}
        style={styles.searchArea}>
        <Icon name={Icons.search} color={theme.primary} size={20} weight="semibold" />
        <View style={styles.placeholder}>
          <AppText color="textMuted">Search </AppText>
          <Animated.View style={[styles.word, wordStyle]}>
            <AppText color="textMuted" numberOfLines={1}>
              “{words[index % words.length].toLowerCase()}”
            </AppText>
          </Animated.View>
        </View>
      </Pressable>
      {onFilterPress && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={filterCount > 0 ? `Filter products, ${filterCount} applied` : 'Filter products'}
            hitSlop={{ top: 12, bottom: 12, left: 6, right: 12 }}
            onPress={onFilterPress}
            style={({ pressed }) => [styles.filterButton, pressed && { opacity: 0.5 }]}>
            <Icon name={Icons.filter} color={filterCount > 0 ? theme.primary : theme.textSecondary} size={18} />
            {filterCount > 0 && <View style={[styles.filterDot, { backgroundColor: theme.primary }]} />}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
  },
  searchArea: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  placeholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  word: {
    flexShrink: 1,
  },
  divider: {
    width: 1,
    height: 22,
  },
});
