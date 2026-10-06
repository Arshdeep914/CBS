import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { errorMessage } from '@/api/client';
import { Env } from '@/config/env';
import { getPermission, notificationsSupported, requestPermission } from '@/lib/notifications';
import { shop } from '@/services';

/**
 * Notifications, stage 2: this phone's Expo push token — the "address" the
 * backend sends notifications to.
 *
 * - After sign-in (and on every launch while signed in) the app asks for
 *   permission once, gets the token, logs it, and — when
 *   EXPO_PUBLIC_PUSH_TOKEN_SYNC=true — registers it with the backend.
 * - On sign-out the token is removed from the backend first, so a shared phone
 *   stops getting the previous customer's notifications.
 *
 * Expo Go can't receive push notifications (SDK 53+), so all of this is
 * skipped there; the token functions are only even *loaded* outside Expo Go,
 * because loading them in Expo Go on Android throws (see notifications-api.ts).
 */

export type PushState =
  | { status: 'idle' }
  | { status: 'unavailable'; reason: 'web' | 'expo-go' | 'simulator' | 'no-project-id' }
  | { status: 'denied' }
  | { status: 'loading' }
  | { status: 'ready'; token: string; synced: boolean }
  | { status: 'error'; message: string };

let state: PushState = { status: 'idle' };
const listeners = new Set<() => void>();

function setState(next: PushState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePushToken() {
  return useSyncExternalStore(subscribe, () => state);
}

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function fetchToken(id: string) {
  // loaded on demand: importing it pulls in a module that throws in Expo Go on Android
  const { getExpoPushTokenAsync } = await import('expo-notifications/build/getExpoPushTokenAsync');
  const { data } = await getExpoPushTokenAsync({ projectId: id });
  return data;
}

let inFlight: Promise<void> | null = null;
let tokenListener: { remove: () => void } | null = null;

async function syncWithBackend(token: string) {
  if (!Env.pushTokenSync) {
    console.log('[push] backend sync is off (EXPO_PUBLIC_PUSH_TOKEN_SYNC=false) — token not sent to the server');
    return false;
  }
  try {
    await shop.push.register({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceName: Device.modelName ?? null,
      appVersion: Constants.expoConfig?.version ?? null,
    });
    return true;
  } catch (err) {
    // the token still works for direct tests; registration retries on next launch
    console.warn('[push] could not register the token with the backend:', errorMessage(err));
    return false;
  }
}

async function run(prompt: boolean) {
  if (!notificationsSupported) return setState({ status: 'unavailable', reason: 'web' });
  if (isRunningInExpoGo()) {
    console.log('[push] Expo Go cannot receive push notifications — use the development build to get a push token');
    return setState({ status: 'unavailable', reason: 'expo-go' });
  }
  if (!Device.isDevice && Platform.OS === 'ios') return setState({ status: 'unavailable', reason: 'simulator' });
  const id = projectId();
  if (!id) return setState({ status: 'unavailable', reason: 'no-project-id' });

  const permission = prompt ? await requestPermission() : await getPermission();
  if (permission !== 'granted') return setState({ status: 'denied' });

  if (state.status !== 'ready') setState({ status: 'loading' });
  try {
    const token = await fetchToken(id);
    console.log(`[push] Expo push token: ${token}`);
    setState({ status: 'ready', token, synced: false });
    const synced = await syncWithBackend(token);
    if (state.status === 'ready' && state.token === token) setState({ status: 'ready', token, synced });

    // Google/Apple can rotate the device token while the app runs; re-register when they do
    if (!tokenListener) {
      const { addPushTokenListener } = await import('expo-notifications/build/TokenEmitter');
      tokenListener = addPushTokenListener(() => {
        void pushActions.register({ prompt: false });
      });
    }
  } catch (err) {
    console.warn('[push] could not get a push token:', errorMessage(err));
    setState({ status: 'error', message: errorMessage(err, 'Couldn’t get a push token.') });
  }
}

export const pushActions = {
  /**
   * Gets the token and registers it. `prompt: true` shows the system permission
   * dialog if the customer hasn't answered it yet (used right after sign-in).
   */
  register({ prompt }: { prompt: boolean }) {
    if (!inFlight) {
      inFlight = run(prompt).finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  },

  /** Sign-out: tell the backend to stop sending to this phone. Never throws. */
  async unregister() {
    const current = state;
    tokenListener?.remove();
    tokenListener = null;
    setState({ status: 'idle' });
    if (current.status !== 'ready' || !Env.pushTokenSync) return;
    try {
      await shop.push.remove(current.token);
    } catch (err) {
      console.warn('[push] could not remove the token from the backend:', errorMessage(err));
    }
  },
};
