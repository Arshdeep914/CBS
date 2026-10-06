import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { CANCELLED_CODES, RETURNED_CODE } from '@/store/orders';

export function OrderStatusPill({ statusCode, label }: { statusCode: number; label: string }) {
  const theme = useTheme();
  const tone =
    statusCode === 6
      ? { bg: theme.successSoft, fg: theme.success }
      : CANCELLED_CODES.has(statusCode) || statusCode === RETURNED_CODE
        ? { bg: theme.surfaceMuted, fg: theme.textSecondary }
        : { bg: theme.warningSoft, fg: theme.warning };

  return (
    <View style={[styles.pill, { backgroundColor: tone.bg }]}>
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <AppText variant="captionStrong" color={tone.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
