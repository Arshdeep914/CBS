import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel = 'See all', onAction }: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.titles}>
        <AppText variant="heading">{title}</AppText>
        {subtitle && (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        )}
      </View>
      {onAction && (
        <Pressable onPress={onAction} hitSlop={8} style={styles.action} accessibilityRole="button">
          <AppText variant="captionStrong" color="primary">
            {actionLabel}
          </AppText>
          <Icon name={Icons.chevronRight} color={theme.primary} size={12} weight="bold" />
        </Pressable>
      )}
    </View>
  );
}

/** Zomato-style centred divider title, e.g. "── EXPLORE ──". */
export function DividerTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={styles.divider}>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
      <AppText variant="overline" color="textMuted">
        {title}
      </AppText>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
