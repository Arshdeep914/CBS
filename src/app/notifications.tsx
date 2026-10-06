import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  CHANNELS,
  getPermission,
  notificationsSupported,
  requestPermission,
  scheduleLocalNotification,
  type LocalNotification,
  type PermissionState,
} from '@/lib/notifications';
import { pushActions, usePushToken, type PushState } from '@/lib/push-token';
import { latestCachedOrder } from '@/store/orders';

const DELAY_SECONDS = 5;

type Sample = LocalNotification & { key: string; label: string; icon: IconName };

/** Built on tap, so the order sample can point at a real order when one is loaded. */
function samples(): Sample[] {
  const order = latestCachedOrder();
  return [
    {
      key: 'order',
      label: 'Order update',
      icon: Icons.truck,
      channel: CHANNELS.orders,
      title: 'Your order has shipped 🚚',
      body: order
        ? `Order #${order.number} is on its way. Tap to track it.`
        : 'Your order is on its way. Tap to track it.',
      target: order ? { screen: 'order', id: order.id } : { screen: 'orders' },
    },
    {
      key: 'offer',
      label: 'Offer',
      icon: Icons.percent,
      channel: CHANNELS.offers,
      title: 'Festive sale is live 🎉',
      body: 'Up to 40% off on cookware and appliances. Tap to shop now.',
      target: { screen: 'categories' },
    },
    {
      key: 'cart',
      label: 'Cart reminder',
      icon: Icons.cart,
      channel: CHANNELS.offers,
      title: 'Still thinking it over? 🛒',
      body: 'The items in your cart are waiting. Complete your order before they sell out.',
      target: { screen: 'cart' },
    },
    {
      key: 'wishlist',
      label: 'Back in stock',
      icon: Icons.heart,
      channel: CHANNELS.offers,
      title: 'Back in stock ❤️',
      body: 'Something on your wishlist is available again. Tap to see it.',
      target: { screen: 'wishlist' },
    },
  ];
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const push = usePushToken();
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [asking, setAsking] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // re-check on every visit: the user may have changed it in system settings
  useFocusEffect(
    useCallback(() => {
      getPermission()
        .then((state) => {
          setPermission(state);
          if (state === 'granted') void pushActions.register({ prompt: false });
        })
        .catch(() => setPermission('undetermined'));
    }, []),
  );

  async function allow() {
    setAsking(true);
    try {
      const state = await requestPermission();
      setPermission(state);
      if (state === 'granted') void pushActions.register({ prompt: false });
    } catch (err) {
      toast.show(errorMessage(err, 'Couldn’t ask for permission.'), 'error');
    } finally {
      setAsking(false);
    }
  }

  async function send(sample: Sample) {
    setSending(sample.key);
    try {
      await scheduleLocalNotification(sample, DELAY_SECONDS);
      setPermission('granted');
      toast.show(`Arriving in ${DELAY_SECONDS} seconds — try leaving the app.`, 'success');
    } catch (err) {
      setPermission(await getPermission().catch(() => permission));
      toast.show(errorMessage(err, 'Couldn’t schedule the notification.'), 'error');
    } finally {
      setSending(null);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Notifications" />
      <ScrollView contentContainerStyle={styles.content}>
        <PermissionCard state={permission} asking={asking} onAllow={allow} />
        <PushTokenCard state={push} />

        {notificationsSupported && (
          <View style={styles.section}>
            <AppText variant="overline" color="textMuted" style={styles.sectionTitle}>
              TRY A NOTIFICATION
            </AppText>
            <AppText color="textSecondary" style={styles.sectionTitle}>
              Tap a sample, then go to your home screen or lock the phone. It arrives in {DELAY_SECONDS} seconds — tap it
              to check it opens the right page.
            </AppText>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {samples().map((sample, index) => (
                <Pressable
                  key={sample.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Send a sample ${sample.label} notification`}
                  disabled={sending !== null}
                  onPress={() => send(sample)}
                  style={({ pressed }) => [
                    styles.sample,
                    index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                    pressed && { backgroundColor: theme.surfaceMuted },
                  ]}>
                  <View style={[styles.sampleIcon, { backgroundColor: theme.primarySoft }]}>
                    <Icon name={sample.icon} color={theme.primary} size={18} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="captionStrong" color="textMuted">
                      {sample.label.toUpperCase()}
                    </AppText>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {sample.title}
                    </AppText>
                    <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                      {sample.body}
                    </AppText>
                  </View>
                  {sending === sample.key ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <AppText variant="captionStrong" color="primary">
                      SEND
                    </AppText>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={[styles.note, { backgroundColor: theme.surfaceMuted }]}>
          <Icon name={Icons.info} color={theme.textSecondary} size={18} />
          <AppText variant="caption" color="textSecondary" style={styles.flex}>
            These samples are created on this phone to preview how notifications look and where they lead. Real
            notifications from our server (order updates, offers) need the full app build and will arrive the same way.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

function PermissionCard({ state, asking, onAllow }: { state: PermissionState | null; asking: boolean; onAllow: () => void }) {
  const theme = useTheme();

  if (state === null) {
    return (
      <View style={[styles.card, styles.permission, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const config = {
    granted: { icon: Icons.checkCircle, fg: theme.success, bg: theme.successSoft, title: 'Notifications are on', text: 'You’ll hear from us about your orders and offers.' },
    undetermined: { icon: Icons.bell, fg: theme.primary, bg: theme.primarySoft, title: 'Turn on notifications', text: 'Get order updates and offers on this phone.' },
    denied: { icon: Icons.alert, fg: theme.warning, bg: theme.warningSoft, title: 'Notifications are off', text: 'They’re blocked for CBS Kitchenware. Turn them on in your phone’s settings.' },
    unsupported: { icon: Icons.info, fg: theme.textSecondary, bg: theme.surfaceMuted, title: 'Not available here', text: 'Notifications work in the Android and iPhone app, not in the browser.' },
  }[state];

  return (
    <View style={[styles.card, styles.permission, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.permissionRow}>
        <View style={[styles.permissionIcon, { backgroundColor: config.bg }]}>
          <Icon name={config.icon} color={config.fg} size={22} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{config.title}</AppText>
          <AppText variant="caption" color="textSecondary">
            {config.text}
          </AppText>
        </View>
      </View>
      {state === 'undetermined' && <Button title="Allow notifications" icon={Icons.bell} onPress={onAllow} loading={asking} />}
      {state === 'denied' && (
        <Button title="Open settings" icon={Icons.system} variant="secondary" onPress={() => Linking.openSettings()} />
      )}
    </View>
  );
}

/** This phone's push address — for testing real push before the backend is ready. */
function PushTokenCard({ state }: { state: PushState }) {
  const theme = useTheme();
  // web: the permission card already says notifications aren't available; denied: it offers settings
  if (state.status === 'idle' || state.status === 'denied') return null;
  if (state.status === 'unavailable' && state.reason === 'web') return null;

  const box = [styles.card, styles.permission, { backgroundColor: theme.surface, borderColor: theme.border }];
  const heading = (
    <AppText variant="overline" color="textMuted">
      PUSH TOKEN
    </AppText>
  );

  if (state.status === 'unavailable') {
    const text = {
      'expo-go': 'Real push notifications need the development build of the app — Expo Go can’t receive them. The samples below still work here.',
      simulator: 'The iOS Simulator can’t receive push notifications. Use a real iPhone.',
      'no-project-id': 'The EAS project id is missing from app.json, so no push token can be created.',
      web: 'Push notifications work in the Android and iPhone app, not in the browser.',
    }[state.reason];
    return (
      <View style={box}>
        {heading}
        <View style={styles.tokenRow}>
          <Icon name={Icons.info} color={theme.textSecondary} size={18} />
          <AppText variant="caption" color="textSecondary" style={styles.flex}>
            {text}
          </AppText>
        </View>
      </View>
    );
  }

  if (state.status === 'loading') {
    return (
      <View style={box}>
        {heading}
        <View style={styles.tokenRow}>
          <ActivityIndicator size="small" color={theme.primary} />
          <AppText variant="caption" color="textSecondary">
            Getting this phone’s push address…
          </AppText>
        </View>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={box}>
        {heading}
        <AppText variant="caption" color="danger">
          {state.message}
        </AppText>
        <Button title="Try again" icon={Icons.refresh} variant="secondary" onPress={() => void pushActions.register({ prompt: false })} />
      </View>
    );
  }

  return (
    <View style={box}>
      {heading}
      <View style={[styles.tokenBox, { backgroundColor: theme.surfaceMuted }]}>
        <AppText variant="caption" selectable style={styles.mono}>
          {state.token}
        </AppText>
      </View>
      <View style={styles.tokenRow}>
        <Icon name={state.synced ? Icons.checkCircle : Icons.info} color={state.synced ? theme.success : theme.textSecondary} size={16} />
        <AppText variant="caption" color="textSecondary" style={styles.flex}>
          {state.synced
            ? 'Registered with our server — you’ll get order updates on this phone.'
            : 'Not sent to our server yet (turned off until the backend is ready). Share it and paste it at expo.dev/notifications to send yourself a test.'}
        </AppText>
      </View>
      <Button title="Share token" icon={Icons.share} variant="secondary" onPress={() => Share.share({ message: state.token })} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  permission: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  permissionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
  },
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.three - 2,
  },
  sampleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tokenBox: {
    padding: Spacing.two + 2,
    borderRadius: Radius.md,
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  note: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three - 4,
    borderRadius: Radius.md,
  },
});
