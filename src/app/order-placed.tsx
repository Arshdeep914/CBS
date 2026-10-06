import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { HOME_HREF } from '@/lib/routes';

export default function OrderPlacedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { orderNo } = useLocalSearchParams<{ orderNo?: string }>();

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.four }]}>
      <Animated.View entering={FadeInUp.duration(350)} style={styles.content}>
        <Animated.View entering={ZoomIn.delay(150).springify().damping(11)} style={[styles.icon, { backgroundColor: theme.success }]}>
          <Icon name={Icons.check} color="#FFFFFF" size={44} weight="bold" />
        </Animated.View>
        <AppText variant="display" style={styles.center}>
          Order placed!
        </AppText>
        <AppText color="textSecondary" style={styles.center}>
          Thank you for shopping with CBS Kitchenware. We’ll keep you posted as your order moves along.
        </AppText>
        {!!orderNo && (
          <View style={[styles.number, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppText variant="caption" color="textMuted">
              ORDER NUMBER
            </AppText>
            <AppText variant="heading" selectable>
              {orderNo}
            </AppText>
          </View>
        )}
      </Animated.View>
      <View style={styles.actions}>
        <Button title="View my orders" onPress={() => router.replace('/orders')} />
        <Button title="Continue shopping" variant="secondary" onPress={() => router.replace(HOME_HREF)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxFormWidth,
    alignSelf: 'center',
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  number: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.two,
  },
  actions: {
    gap: Spacing.three - 4,
    width: '100%',
    maxWidth: MaxFormWidth,
    alignSelf: 'center',
  },
});
