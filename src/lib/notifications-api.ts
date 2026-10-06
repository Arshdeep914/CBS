/**
 * The parts of `expo-notifications` the app uses, imported file by file.
 *
 * Why not `import * as Notifications from 'expo-notifications'`: the package's
 * index loads `DevicePushTokenAutoRegistration.fx`, which registers a push-token
 * listener the moment it's imported — and in Expo Go on Android (SDK 53+) that
 * throws, crashing the whole app even though local notifications are supported
 * there. None of the files below lead to that module (checked by walking their
 * imports).
 *
 * Stage 2 (real push, development build) can import the push-token functions
 * (`getExpoPushTokenAsync`, `addPushTokenListener`) from the package as normal —
 * they only ever run in a development or store build.
 */
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponseAsync,
  DEFAULT_ACTION_IDENTIFIER,
  getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { SchedulableTriggerInputTypes, type NotificationResponse } from 'expo-notifications/build/Notifications.types';
export { IosAuthorizationStatus, type NotificationPermissionsStatus } from 'expo-notifications/build/NotificationPermissions.types';
