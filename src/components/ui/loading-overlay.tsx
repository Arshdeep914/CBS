import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadingOverlayProps = {
  /** null hides the overlay. */
  message: string | null;
};

/** Blocks the screen during steps that must not be interrupted, like placing an order. */
export function LoadingOverlay({ message }: LoadingOverlayProps) {
  const theme = useTheme();

  return (
    <Modal visible={message !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <AppText variant="bodyStrong" style={styles.center}>
            {message}
          </AppText>
          <AppText variant="caption" color="textMuted" style={styles.center}>
            Please don’t close the app.
          </AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.five,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.five,
    borderRadius: Radius.xl,
  },
  center: {
    textAlign: 'center',
  },
});
