import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { request, resolveImageUrl } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiAppConfig } from '@/api/types';
import { Env } from '@/config/env';

/**
 * Remote app configuration from the backend's `/configuration` API: currently
 * the logo shown inside the app (login, Home header, Account footer).
 *
 * At launch the splash screen waits for it — at most START_BUDGET_MS in total,
 * including downloading a new logo. Then, in order of preference:
 *   1. the fresh answer (also saved on the phone),
 *   2. the last answer saved on the phone,
 *   3. the built-in defaults below (today's logo).
 * An answer that arrives after the budget is saved for the next launch rather
 * than changing the screens under the user.
 *
 * Can't be changed from here: the app icon, the splash screen and the
 * notification icon — those are part of the installed build.
 */

export type AppConfig = {
  /** Remote logo; null = the built-in CBS logo. */
  logo: { uri: string; aspectRatio: number | null } | null;
};

export const DEFAULT_CONFIG: AppConfig = {
  logo: null,
};

export type ConfigSource = 'remote' | 'saved' | 'default';

type State = { ready: boolean; config: AppConfig; source: ConfigSource };

const START_BUDGET_MS = 3000;
const STORAGE_KEY = 'cbs.app-config';

let state: State = { ready: false, config: DEFAULT_CONFIG, source: 'default' };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAppConfig() {
  return useSyncExternalStore(subscribe, () => state);
}

/* ------------------------------------------------------------------ */
/*  parsing — anything unexpected falls back, never crashes            */
/* ------------------------------------------------------------------ */

function parseLogo(raw: ApiAppConfig['logo']): AppConfig['logo'] {
  const url = typeof raw === 'string' ? raw : raw?.url;
  const uri = resolveImageUrl(url);
  if (!uri) return null;
  const width = typeof raw === 'object' && raw ? Number(raw.width) : NaN;
  const height = typeof raw === 'object' && raw ? Number(raw.height) : NaN;
  return { uri, aspectRatio: width > 0 && height > 0 ? width / height : null };
}

function parseConfig(data: ApiAppConfig | null | undefined): AppConfig | null {
  if (!data || typeof data !== 'object') return null;
  return { logo: parseLogo(data.logo ?? data.logoUrl) };
}

/* ------------------------------------------------------------------ */
/*  saved copy (SecureStore on the phone, localStorage on web)          */
/* ------------------------------------------------------------------ */

const storage = {
  get: () =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.getItem(STORAGE_KEY) ?? null)
      : SecureStore.getItemAsync(STORAGE_KEY),
  set: (value: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.setItem(STORAGE_KEY, value))
      : SecureStore.setItemAsync(STORAGE_KEY, value),
};

async function readSaved(): Promise<AppConfig | null> {
  try {
    const raw = await storage.get();
    if (!raw) return null;
    const saved = JSON.parse(raw) as AppConfig;
    return { logo: saved.logo?.uri ? saved.logo : null };
  } catch {
    return null;
  }
}

function save(config: AppConfig) {
  storage.set(JSON.stringify(config)).catch(() => {});
}

/* ------------------------------------------------------------------ */
/*  launch                                                             */
/* ------------------------------------------------------------------ */

async function fetchRemote(): Promise<AppConfig | null> {
  const data = await request<ApiAppConfig>({ method: 'get', url: ENDPOINTS.APP.CONFIGURATION, timeout: 15_000 });
  return parseConfig(data);
}

/** Resolves with `fallback` if `promise` hasn't settled by `deadline` (or fails). */
function withDeadline<T>(promise: Promise<T>, deadline: number, fallback: T): Promise<T> {
  const wait = Math.max(0, deadline - Date.now());
  return Promise.race([promise.catch(() => fallback), new Promise<T>((resolve) => setTimeout(() => resolve(fallback), wait))]);
}

/** Downloads the logo into the image cache so it appears instantly; false if it can't be loaded. */
async function prefetchLogo(config: AppConfig, deadline: number) {
  if (!config.logo) return true;
  return withDeadline(Image.prefetch(config.logo.uri, 'memory-disk'), deadline, false);
}

let started = false;

/** Called once at launch, while the splash screen is showing. */
export async function loadAppConfig() {
  if (started) return;
  started = true;
  const deadline = Date.now() + START_BUDGET_MS;

  const savedPromise = readSaved();
  if (Env.offline) {
    const saved = await savedPromise;
    return setState({ ready: true, config: saved ?? DEFAULT_CONFIG, source: saved ? 'saved' : 'default' });
  }

  const remotePromise = fetchRemote();
  // a late answer still counts — for the next launch
  remotePromise.then((config) => config && save(config)).catch(() => {});

  let remote = await withDeadline(remotePromise, deadline, null);
  if (remote && !(await prefetchLogo(remote, deadline))) {
    // the new logo couldn't be downloaded in time: keep the rest, use the built-in logo for now
    remote = { ...remote, logo: null };
  }
  if (remote) return setState({ ready: true, config: remote, source: 'remote' });

  const saved = await savedPromise;
  setState({ ready: true, config: saved ?? DEFAULT_CONFIG, source: saved ? 'saved' : 'default' });
}
