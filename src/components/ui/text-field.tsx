import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  icon: IconName;
  error?: string;
  ref?: Ref<TextInput>;
};

export function TextField({
  label,
  icon,
  error,
  secureTextEntry,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;
  const iconColor = error ? theme.danger : focused ? theme.primary : theme.textMuted;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>

      <View
        style={[
          styles.field,
          { backgroundColor: theme.surface, borderColor },
          focused && styles.fieldFocused,
        ]}>
        <Icon name={icon} color={iconColor} size={18} />
        <TextInput
          {...rest}
          accessibilityLabel={label}
          secureTextEntry={secureTextEntry && hidden}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.primary}
          style={[styles.input, { color: theme.text }, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={12}
            onPress={() => setHidden((value) => !value)}>
            <Icon name={hidden ? Icons.eye : Icons.eyeOff} color={theme.textSecondary} size={18} />
          </Pressable>
        )}
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Icon name={Icons.alert} color={theme.danger} size={14} />
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
  },
  fieldFocused: {
    borderWidth: 2,
    paddingHorizontal: Spacing.three - 0.5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    // The field draws its own focus border; hide the browser outline on web.
    outlineWidth: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
  },
});
