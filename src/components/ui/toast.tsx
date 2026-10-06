import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Tone = 'success' | 'error' | 'info';
type ToastItem = { id: number; message: string; tone: Tone };

let current: ToastItem | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Fire-and-forget messages, callable from anywhere (screens, stores, the API layer). */
export const toast = {
  show(message: string, tone: Tone = 'info') {
    current = { id: nextId++, message, tone };
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Mount once at the app root. */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const item = useSyncExternalStore(subscribe, () => current);

  useEffect(() => {
    if (!item) return;
    const timer = setTimeout(() => {
      if (current?.id === item.id) {
        current = null;
        emit();
      }
    }, 3200);
    return () => clearTimeout(timer);
  }, [item]);

  if (!item) return null;

  const config = {
    success: { bg: theme.success, icon: Icons.checkCircle },
    error: { bg: theme.danger, icon: Icons.alert },
    info: { bg: theme.text, icon: Icons.info },
  }[item.tone];

  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + Spacing.two }]}>
      <Animated.View
        key={item.id}
        entering={FadeInUp.duration(220)}
        exiting={FadeOutUp.duration(180)}
        accessibilityLiveRegion="polite"
        style={[styles.toast, { backgroundColor: config.bg }]}>
        <Icon name={config.icon} color="#FFFFFF" size={18} />
        <AppText variant="bodyStrong" color={item.tone === 'info' ? theme.background : '#FFFFFF'} style={styles.text}>
          {item.message}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: MaxFormWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 4,
    borderRadius: Radius.md,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
  },
  text: {
    flex: 1,
  },
});
