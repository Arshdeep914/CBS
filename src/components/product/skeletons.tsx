import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Gentle pulse shared by all placeholder shapes. */
function usePulse() {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.set(withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [pulse, reduceMotion]);

  return useAnimatedStyle(() => ({ opacity: pulse.get() }));
}

function Block({ width, height, radius = 6 }: { width: number | `${number}%`; height: number; radius?: number }) {
  const theme = useTheme();
  return <View style={{ width, height, borderRadius: radius, backgroundColor: theme.surfaceMuted }} />;
}

/** Placeholder with the same footprint as a grid ProductCard. */
function CardSkeleton({ width }: { width: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { width, backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Block width={width} height={width} radius={0} />
      <View style={styles.cardBody}>
        <Block width="40%" height={9} />
        <Block width="90%" height={13} />
        <Block width="65%" height={13} />
        <Block width="35%" height={12} />
        <Block width="55%" height={16} />
      </View>
    </View>
  );
}

type GridSkeletonProps = {
  columns: number;
  cardWidth: number;
  padding: number;
  gap: number;
  rows?: number;
};

/** One or more rows of placeholder cards, shown while the next page loads. */
export function ProductGridSkeleton({ columns, cardWidth, padding, gap, rows = 1 }: GridSkeletonProps) {
  const pulseStyle = usePulse();
  return (
    <Animated.View style={[{ paddingHorizontal: padding, gap: gap + 4, paddingBottom: gap + 4 }, pulseStyle]}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {Array.from({ length: columns }, (_, c) => (
            <CardSkeleton key={c} width={cardWidth} />
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

/** Placeholders shaped like search-result ProductRows. */
export function ProductRowSkeleton({ count = 2 }: { count?: number }) {
  const theme = useTheme();
  const pulseStyle = usePulse();
  return (
    <Animated.View style={pulseStyle}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.listRow, { borderBottomColor: theme.border }]}>
          <View style={styles.listInfo}>
            <Block width="30%" height={9} />
            <Block width="85%" height={15} />
            <Block width="60%" height={15} />
            <Block width="45%" height={16} />
          </View>
          <Block width={116} height={116} radius={Radius.md} />
        </View>
      ))}
    </Animated.View>
  );
}

/** Shown once every page has loaded. */
export function EndOfList({ total }: { total: number }) {
  const theme = useTheme();
  return (
    <View style={styles.end}>
      <View style={[styles.endLine, { backgroundColor: theme.border }]} />
      <AppText variant="caption" color="textMuted">
        You’ve seen all {total} products
      </AppText>
      <View style={[styles.endLine, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardBody: {
    padding: Spacing.two + 2,
    paddingTop: Spacing.three,
    gap: 7,
  },
  listRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listInfo: {
    flex: 1,
    gap: 8,
    paddingTop: 4,
  },
  end: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  endLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
