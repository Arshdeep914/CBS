import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  icon?: IconName;
  /** Shows a dropdown chevron, for chips that open a sheet. */
  dropdown?: boolean;
  count?: number;
  /** Show a small × when selected, for filters that can be toggled off. */
  removable?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected = false, icon, dropdown, count, removable, onPress }: ChipProps) {
  const theme = useTheme();
  const foreground = selected ? theme.primary : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && { opacity: 0.7 },
      ]}>
      {icon && <Icon name={icon} color={foreground} size={14} weight="semibold" />}
      <AppText variant="captionStrong" color={foreground}>
        {label}
      </AppText>
      {!!count && (
        <View style={[styles.count, { backgroundColor: theme.primary }]}>
          <AppText variant="micro" color={theme.onPrimary}>
            {count}
          </AppText>
        </View>
      )}
      {dropdown && <Icon name={Icons.chevronDown} color={foreground} size={12} weight="bold" />}
      {selected && removable && (
        <Icon name={Icons.close} color={foreground} size={11} weight="bold" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.three - 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  count: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
