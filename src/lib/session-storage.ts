import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * The signed-in session, kept in the device keychain / keystore via
 * expo-secure-store and mirrored in memory so the API client can read it
 * synchronously on every request.
 */
export type StoredUser = {
  /** The backend's user code — the `uid` sent on cart, order and address calls. */
  code: string;
  name: string;
  /** The login name, which is the customer's email. */
  email: string;
};

export type Session = {
  jwt: string;
  pksoftToken: string;
  user: StoredUser;
};

const KEY = 'cbs.session';

let current: Session | null = null;

// expo-secure-store has no web implementation; fall back to localStorage there
// so the web preview still works.
const storage = {
  get: () =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.getItem(KEY) ?? null)
      : SecureStore.getItemAsync(KEY),
  set: (value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.setItem(KEY, value))
      : SecureStore.setItemAsync(KEY, value),
  remove: () =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.removeItem(KEY))
      : SecureStore.deleteItemAsync(KEY),
};

/** Reads the saved session once at startup. */
export async function loadSession() {
  try {
    const raw = await storage.get();
    current = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    current = null;
  }
  return current;
}

export async function saveSession(session: Session) {
  current = session;
  await storage.set(JSON.stringify(session));
}

export async function clearSession() {
  current = null;
  await storage.remove();
}

/** The in-memory session, for synchronous reads in the API layer. */
export function getSession() {
  return current;
}

/** The current user's code, used as `uid` in request bodies. */
export function currentUid() {
  return current?.user.code ?? '';
}
