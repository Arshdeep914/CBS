import axios, { AxiosError, isAxiosError, isCancel as isAxiosCancel, type AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

import { ENDPOINTS } from '@/api/endpoints';
import { MESSAGE_CODE, type ApiEnvelope } from '@/api/types';
import { Env } from '@/config/env';
import { getSession } from '@/lib/session-storage';

/* ------------------------------------------------------------------ */
/*  errors                                                             */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  readonly messageCode: number;
  readonly status: number;

  constructor(message: string, messageCode = 0, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.messageCode = messageCode;
    this.status = status;
  }
}

/** A readable message for any error the API layer can throw. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (err instanceof ApiError) return err.message;
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (typeof data?.message === 'string' && data.message) return data.message;
    if (err.response?.status === 401) return 'Your session has expired. Please sign in again.';
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
      return 'Network error — please check your connection.';
    }
    // any other HTTP failure: axios's own text ("Request failed with status code 400") means nothing to a shopper
    if (err.response) return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** True when a request was aborted on purpose (screen closed, query changed). */
export function isCancel(err: unknown) {
  return isAxiosCancel(err) || (err instanceof Error && err.name === 'AbortError');
}

/* ------------------------------------------------------------------ */
/*  session expiry                                                     */
/* ------------------------------------------------------------------ */

const expiryListeners = new Set<() => void>();

/** Called when the backend rejects the signed-in user's token (HTTP 401). */
export function onSessionExpired(listener: () => void) {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
}

/* ------------------------------------------------------------------ */
/*  instance                                                           */
/* ------------------------------------------------------------------ */

export const api = axios.create({
  baseURL: `${Env.apiUrl}/`,
  timeout: 20_000,
  // lets the native cookie jar carry any cookies the backend sets
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

/**
 * The backend authorises every request by its `Origin` header and answers 401
 * to anything not on its allow-list. Browsers set Origin themselves; a native
 * app sends none, so it's added here on every call. The value comes from
 * EXPO_PUBLIC_API_ORIGIN (`http://localhost` = dev client).
 */
api.interceptors.request.use((config) => {
  // Browsers forbid scripts from setting Origin (they send the page's own), so
  // on web the page must itself be served from an allowed origin.
  if (Env.apiOrigin && Platform.OS !== 'web') config.headers.set('Origin', Env.apiOrigin);
  return config;
});

/** Signed-in requests carry the JWT plus the backend's own `X-AUTH` token. */
api.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.jwt) config.headers.set('Authorization', `Bearer ${session.jwt}`);
  if (session?.pksoftToken) config.headers.set('X-AUTH', session.pksoftToken);
  return config;
});

/*
 * Writes carry a CSRF token from `verify-cs`. It's a one-time token ("ott"),
 * so each burst of writes fetches a fresh one; simultaneous writes share a
 * single in-flight fetch instead of each firing their own.
 */
const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete']);
let csrfRequest: Promise<string> | null = null;

function getCsrfToken() {
  if (!csrfRequest) {
    csrfRequest = axios
      .get<{ ott?: string }>(`${Env.apiUrl}/${ENDPOINTS.CUSTOMER.VERIFY_CSRF}`, {
        withCredentials: true,
        headers: Env.apiOrigin && Platform.OS !== 'web' ? { Origin: Env.apiOrigin } : undefined,
        timeout: 10_000,
      })
      .then((res) => res.data?.ott ?? '')
      .finally(() => {
        // let a burst of writes reuse the token, then refetch
        setTimeout(() => {
          csrfRequest = null;
        }, 100);
      });
  }
  return csrfRequest;
}

api.interceptors.request.use(async (config) => {
  if (WRITE_METHODS.has((config.method ?? '').toLowerCase())) {
    try {
      const token = await getCsrfToken();
      if (token) config.headers.set('X-CSRF-TOKEN', token);
    } catch {
      // the backend currently accepts writes without one, so a failed
      // handshake shouldn't take the request down with it
      csrfRequest = null;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) csrfRequest = null;
    // a 401 while signed in means the token is no longer accepted
    if (status === 401 && getSession()) expiryListeners.forEach((listener) => listener());
    return Promise.reject(error);
  },
);

/* ------------------------------------------------------------------ */
/*  envelope helpers                                                   */
/* ------------------------------------------------------------------ */

type UnwrapOptions = {
  /** Message codes to accept besides 100 (e.g. 101 "no record" = empty page). */
  accept?: number[];
  fallbackMessage?: string;
};

/**
 * Runs a request and returns `data`, throwing an ApiError when the envelope
 * reports failure. The backend signals real outcomes through `messageCode`.
 */
export async function request<T>(config: AxiosRequestConfig, options: UnwrapOptions = {}): Promise<T> {
  const response = await api.request<ApiEnvelope<T>>(config);
  const envelope = response.data;
  const accepted: number[] = [MESSAGE_CODE.SUCCESS, ...(options.accept ?? [])];

  if (!envelope || !accepted.includes(envelope.messageCode)) {
    throw new ApiError(
      envelope?.message || options.fallbackMessage || 'Request failed.',
      envelope?.messageCode ?? 0,
      envelope?.status ?? response.status,
    );
  }
  return envelope.data;
}

/** Hands back the whole envelope, for callers that branch on `messageCode`. */
export async function requestEnvelope<T>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  const response = await api.request<ApiEnvelope<T>>(config);
  return response.data;
}

export function get<T>(url: string, config: AxiosRequestConfig = {}, options?: UnwrapOptions) {
  return request<T>({ ...config, method: 'get', url }, options);
}

export function post<T>(url: string, data?: unknown, config: AxiosRequestConfig = {}, options?: UnwrapOptions) {
  return request<T>({ ...config, method: 'post', url, data }, options);
}

/* ------------------------------------------------------------------ */
/*  images                                                             */
/* ------------------------------------------------------------------ */

const apiHost = (() => {
  try {
    return new URL(Env.apiUrl).host;
  } catch {
    return '';
  }
})();

/**
 * Turns an image path from the API into a loadable URL. The backend returns
 * `http://` links to its own host, which Android blocks in release builds, so
 * those are upgraded to `https://` (verified to serve the same files). File
 * names can contain spaces, so the URL is encoded too.
 */
export function resolveImageUrl(url?: string | null): string | null {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return null;
  if (/^(data|blob|file):/i.test(trimmed)) return trimmed;

  let absolute = /^https?:/i.test(trimmed)
    ? trimmed
    : `${Env.apiUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;

  if (apiHost && absolute.toLowerCase().startsWith(`http://${apiHost.toLowerCase()}`)) {
    absolute = `https://${absolute.slice('http://'.length)}`;
  }
  // encodeURI leaves already-valid characters alone; decode first so `%20` isn't double-encoded
  try {
    return encodeURI(decodeURI(absolute));
  } catch {
    return encodeURI(absolute);
  }
}
