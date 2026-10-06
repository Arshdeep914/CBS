import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { HOME_HREF } from '@/lib/routes';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Hide the back button on top-level tab screens. */
  showBack?: boolean;
  right?: ReactNode;
  /** Draw a hairline under the header. */
  bordered?: boolean;
  /** Show a small "Updating…" spinner beside the title while the page re-fetches. */
  updating?: boolean;
};

export function ScreenHeader({ title, subtitle, showBack = true, right, bordered = true, updating = false }: ScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + Spacing.two,
          backgroundColor: theme.background,
          borderBottomColor: bordered ? theme.border : 'transparent',
        },
      ]}>
      {showBack && (
        <HeaderButton
          icon={Icons.back}
          label="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(HOME_HREF))}
        />
      )}
      <View style={styles.titles}>
        <View style={styles.titleRow}>
          <AppText variant={showBack ? 'subheading' : 'title'} numberOfLines={1} style={styles.shrink}>
            {title}
          </AppText>
          {updating && <UpdatingHint />}
        </View>
        {subtitle && (
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        )}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

/** Inline spinner + "Updating…", for re-fetches that keep the old data on screen. */
export function UpdatingHint() {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Updating"
      style={[styles.updating, { backgroundColor: theme.primarySoft }]}>
      <ActivityIndicator size="small" color={theme.primary} style={styles.spinner} />
      <AppText variant="micro" color="primary">
        Updating…
      </AppText>
    </View>
  );
}

type HeaderButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  badge?: number;
};

export function HeaderButton({ icon, label, onPress, badge }: HeaderButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && { opacity: 0.6 },
      ]}>
      <Icon name={icon} color={theme.text} size={18} weight="semibold" />
      {!!badge && (
        <View style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
          <AppText variant="micro" color={theme.onPrimary}>
            {badge > 9 ? '9+' : badge}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three - 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titles: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  shrink: {
    flexShrink: 1,
  },
  updating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 999,
  },
  spinner: {
    transform: [{ scale: 0.7 }],
    height: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
