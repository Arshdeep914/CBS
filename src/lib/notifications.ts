import { router, type Href } from 'expo-router';
import { Platform } from 'react-native';

// not the package index — see notifications-api.ts for why
import * as Notifications from '@/lib/notifications-api';
import { HOME_HREF } from '@/lib/routes';

/**
 * Notifications, stage 1: everything on the phone's side — permission, Android
 * channels, how a notification looks, and where tapping it goes — tested with
 * *local* notifications, which work in Expo Go.
 *
 * Stage 2 (real push from the backend) only adds getting the push token and
 * sending it to the server; the backend's push `data` uses the same
 * `NotificationTarget` shape, so tapping a real push opens screens through the
 * same `openTarget` below.
 *
 * Not available on web.
 */

export const notificationsSupported = Platform.OS !== 'web';

/** Android channels: users can mute offers in system settings and still get order updates. */
export const CHANNELS = {
  orders: 'orders',
  offers: 'offers',
} as const;

/** What a notification opens when tapped. Sent as the notification's `data`. */
export type NotificationTarget =
  | { screen: 'order'; id: string }
  | { screen: 'orders' }
  | { screen: 'product'; id: string }
  | { screen: 'category'; id: string; name?: string }
  | { screen: 'categories' }
  | { screen: 'cart' }
  | { screen: 'wishlist' }
  | { screen: 'home' };

/* ------------------------------------------------------------------ */
/*  setup                                                              */
/* ------------------------------------------------------------------ */

let configured = false;

/** Call once at startup: how notifications behave while the app is open, plus Android channels. */
export async function configureNotifications() {
  if (!notificationsSupported || configured) return;
  configured = true;

  // with the app in the foreground, still show the banner (default is to stay silent)
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync(CHANNELS.orders, {
        name: 'Order updates',
        description: 'Confirmation, shipping and delivery of your orders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#D9161C',
        showBadge: true,
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.offers, {
        name: 'Offers & new arrivals',
        description: 'Sales, discounts and new products',
        importance: Notifications.AndroidImportance.DEFAULT,
        showBadge: false,
      }),
    ]).catch(() => {});
  }
}

/* ------------------------------------------------------------------ */
/*  permission                                                         */
/* ------------------------------------------------------------------ */

export type PermissionState = 'granted' | 'undetermined' | 'denied' | 'unsupported';

function toState(result: Notifications.NotificationPermissionsStatus): PermissionState {
  if (result.granted) return 'granted';
  // iOS "provisional" delivers quietly, which still counts as allowed
  if (result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return result.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  return toState(await Notifications.getPermissionsAsync());
}

/** Shows the system "Allow notifications?" prompt when it still can. */
export async function requestPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  // Android 13+ only shows the prompt once a channel exists
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return toState(current);
  return toState(await Notifications.requestPermissionsAsync());
}

/* ------------------------------------------------------------------ */
/*  local notifications (stage 1 testing)                              */
/* ------------------------------------------------------------------ */

export type LocalNotification = {
  title: string;
  body: string;
  target: NotificationTarget;
  channel: (typeof CHANNELS)[keyof typeof CHANNELS];
};

/** Shows `notification` after `seconds`, so there's time to leave the app and see it arrive. */
export async function scheduleLocalNotification({ title, body, target, channel }: LocalNotification, seconds = 5) {
  if (!notificationsSupported) throw new Error('Notifications aren’t available on web.');
  if ((await requestPermission()) !== 'granted') {
    throw new Error('Notifications are turned off for CBS Kitchenware. Allow them in your phone’s settings.');
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: target,
      sound: 'default',
      color: '#D9161C',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: channel,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  taps                                                               */
/* ------------------------------------------------------------------ */

function isTarget(data: unknown): data is NotificationTarget {
  return !!data && typeof data === 'object' && typeof (data as { screen?: unknown }).screen === 'string';
}

/** Opens the screen a notification points at. Unknown or missing targets open Home. */
export function openTarget(data: unknown) {
  if (!isTarget(data)) {
    router.navigate(HOME_HREF);
    return;
  }
  const target = data;
  let href: Href;
  switch (target.screen) {
    case 'order':
      href = { pathname: '/order/[id]', params: { id: target.id } };
      break;
    case 'orders':
      href = '/orders';
      break;
    case 'product':
      href = { pathname: '/product/[id]', params: { id: target.id } };
      break;
    case 'category':
      href = { pathname: '/category/[id]', params: { id: target.id, name: target.name ?? '' } };
      break;
    case 'categories':
      href = '/categories';
      break;
    case 'cart':
      href = '/cart';
      break;
    case 'wishlist':
      href = '/wishlist';
      break;
    default:
      href = HOME_HREF;
  }
  router.push(href);
}

/**
 * Opens the target of a tapped notification — both while the app is running and
 * when the tap launched the app from closed. Returns an unsubscribe function.
 * Mount only while signed in (every target is behind sign-in).
 */
export function listenForTaps() {
  if (!notificationsSupported) return () => {};

  const handle = (response: Notifications.NotificationResponse | null) => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    openTarget(response.notification.request.content.data);
    // don't open it again next launch
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  };

  // a tap that launched the app from closed
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  return () => subscription.remove();
}
