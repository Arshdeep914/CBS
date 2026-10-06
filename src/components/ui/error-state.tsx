import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  /** Smaller inline version for a section inside a screen. */
  compact?: boolean;
};

/** "Couldn't load" with a retry button — never a silent empty state. */
export function ErrorState({ message, onRetry, compact }: ErrorStateProps) {
  const theme = useTheme();

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name={Icons.alert} color={theme.danger} size={18} />
        <AppText variant="caption" color="textSecondary" style={styles.flex} numberOfLines={2}>
          {message}
        </AppText>
        <AppText variant="captionStrong" color="primary" onPress={onRetry} suppressHighlighting>
          RETRY
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
        <Icon name={Icons.alert} color={theme.primary} size={30} />
      </View>
      <AppText variant="heading" style={styles.center}>
        Couldn’t load this
      </AppText>
      <AppText color="textSecondary" style={styles.center}>
        {message}
      </AppText>
      <View style={styles.action}>
        <Button title="Try again" icon={Icons.refresh} variant="secondary" onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.six,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: Spacing.three,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    marginHorizontal: Spacing.three,
    padding: Spacing.three - 2,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
