import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { trendingSearches } from '@/data/catalog';
import { useTheme } from '@/hooks/use-theme';

/** Tappable search field with a rotating placeholder, like Zomato's home search. */
export function SearchLauncher() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(1);

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % trendingSearches.length), 2600);
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
    <Pressable
      accessibilityRole="search"
      accessibilityLabel="Search products"
      onPress={() => router.push('/search')}
      style={[styles.field, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Icon name={Icons.search} color={theme.primary} size={20} weight="semibold" />
      <View style={styles.placeholder}>
        <AppText color="textMuted">Search </AppText>
        <Animated.View style={[styles.word, wordStyle]}>
          <AppText color="textMuted" numberOfLines={1}>
            “{trendingSearches[index].toLowerCase()}”
          </AppText>
        </Animated.View>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      <Icon name={Icons.filter} color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06)',
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
