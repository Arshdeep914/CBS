import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
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

/** Gentle pulse shared by every placeholder shape. */
function Pulse({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.set(withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [pulse, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** A single grey placeholder block. */
export function Block({ width, height, radius = 6 }: { width: DimensionValue; height: number; radius?: number }) {
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

/** Rows of placeholder cards — first load of a grid, or the next page loading. */
export function ProductGridSkeleton({ columns, cardWidth, padding, gap, rows = 1 }: GridSkeletonProps) {
  return (
    <Pulse style={{ paddingHorizontal: padding, gap: gap + 4, paddingBottom: gap + 4 }}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {Array.from({ length: columns }, (_, c) => (
            <CardSkeleton key={c} width={cardWidth} />
          ))}
        </View>
      ))}
    </Pulse>
  );
}

/** A horizontal row of cards, optionally with a section-title placeholder. */
export function RailSkeleton({ cardWidth = 152, showTitle = true }: { cardWidth?: number; showTitle?: boolean }) {
  return (
    <Pulse style={styles.rail}>
      {showTitle && (
        <View style={styles.railTitle}>
          <Block width={150} height={18} />
          <Block width={210} height={11} />
        </View>
      )}
      <View style={[styles.row, styles.railCards]}>
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} width={cardWidth} />
        ))}
      </View>
    </Pulse>
  );
}

/** Round category tiles. */
export function TileGridSkeleton({ count = 8, tileWidth }: { count?: number; tileWidth: number }) {
  const size = Math.min(tileWidth - 8, 76);
  return (
    <Pulse style={styles.tiles}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.tile, { width: tileWidth }]}>
          <Block width={size} height={size} radius={size / 2} />
          <Block width={size * 0.8} height={10} />
        </View>
      ))}
    </Pulse>
  );
}

/** Placeholders shaped like search-result ProductRows. */
export function ProductRowSkeleton({ count = 2 }: { count?: number }) {
  const theme = useTheme();
  return (
    <Pulse>
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
    </Pulse>
  );
}

/** Generic stacked cards — orders, addresses, cart lines. */
export function CardListSkeleton({ count = 3, height = 140 }: { count?: number; height?: number }) {
  const theme = useTheme();
  return (
    <Pulse style={styles.cardList}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.listCard, { height, backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Block width="45%" height={16} />
          <Block width="30%" height={11} />
          <View style={styles.row}>
            <Block width={52} height={52} radius={Radius.sm} />
            <View style={{ width: Spacing.two }} />
            <Block width={52} height={52} radius={Radius.sm} />
          </View>
        </View>
      ))}
    </Pulse>
  );
}

/** Product page: gallery, title, price block. */
export function ProductDetailSkeleton({ width }: { width: number }) {
  return (
    <Pulse>
      <Block width={width} height={Math.round(width * 0.92)} radius={0} />
      <View style={styles.detailBody}>
        <Block width={110} height={14} />
        <Block width="90%" height={22} />
        <Block width="60%" height={22} />
        <Block width={140} height={14} />
        <View style={{ height: Spacing.two }} />
        <Block width="100%" height={120} radius={Radius.lg} />
        <Block width="100%" height={60} radius={Radius.md} />
      </View>
    </Pulse>
  );
}

/** Shown once every page has loaded. */
export function EndOfList({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.end}>
      <View style={[styles.endLine, { backgroundColor: theme.border }]} />
      <AppText variant="caption" color="textMuted">
        {label}
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
  rail: {
    gap: Spacing.three - 4,
  },
  railTitle: {
    gap: 6,
    paddingHorizontal: Spacing.three,
  },
  railCards: {
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    overflow: 'hidden',
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  tile: {
    alignItems: 'center',
    gap: 8,
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
  cardList: {
    gap: Spacing.three - 4,
  },
  listCard: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two + 2,
  },
  detailBody: {
    padding: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.two + 2,
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
