import { isAxiosError, isCancel, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';

import { Env } from '@/config/env';

/**
 * API request/response logging, switched on by EXPO_PUBLIC_LOGS=true.
 *
 * Each call prints a one-line "→" when it's sent, then a full block when it
 * finishes: method, full URL, status, time taken, the backend's messageCode,
 * request headers and body, and the response. Output goes to the terminal
 * running `npx expo start` (or the browser console on web).
 *
 * Passwords are hidden and tokens shortened, so logs are safe to paste.
 */

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    logMeta?: { id: number; start: number };
  }
}

/** Longer bodies are cut off so one big product list doesn't flood the terminal. */
const MAX_CHARS = 20_000;

let nextId = 1;

function shorten(value: string) {
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : '•••';
}

/** Copies a body/response with secrets masked. */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, v]) => {
      if (/password|secret/i.test(key)) return [key, '••••••'];
      if (/token|jwt/i.test(key) && typeof v === 'string' && v) return [key, shorten(v)];
      return [key, redact(v, depth + 1)];
    }),
  );
}

function headersOf(config: InternalAxiosRequestConfig) {
  const headers = { ...(config.headers?.toJSON?.() ?? {}) } as Record<string, unknown>;
  for (const key of Object.keys(headers)) {
    if (/^(authorization|x-auth)$/i.test(key) && typeof headers[key] === 'string') {
      headers[key] = shorten(headers[key] as string);
    }
  }
  // browsers forbid scripts from setting Origin, so on web it isn't in the config
  if (Platform.OS === 'web' && !headers.Origin) headers.Origin = '(set by the browser to the page origin)';
  return headers;
}

/** By the time a response arrives axios has turned the body into a JSON string. */
function bodyOf(config: InternalAxiosRequestConfig) {
  let data = config.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // not JSON; print as-is
    }
  }
  return data;
}

function pretty(value: unknown) {
  if (value === undefined) return '(none)';
  const text = typeof value === 'string' ? value : JSON.stringify(redact(value), null, 2);
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n… (${text.length - MAX_CHARS} more characters)` : text;
}

function indent(text: string) {
  return text.replace(/\n/g, '\n    ');
}

function finish(
  instance: AxiosInstance,
  config: InternalAxiosRequestConfig,
  response: AxiosResponse | undefined,
  failure?: { code?: string; message: string },
) {
  const meta = config.logMeta;
  const tag = `[API #${meta?.id ?? '?'}]`;
  const ms = meta ? `${Date.now() - meta.start} ms` : '';
  const method = (config.method ?? 'get').toUpperCase();
  const url = instance.getUri(config);
  const envelope = response?.data as { messageCode?: number; message?: string } | undefined;
  const code =
    envelope && typeof envelope === 'object' && 'messageCode' in envelope
      ? `  messageCode ${envelope.messageCode}${envelope.message ? ` "${envelope.message}"` : ''}`
      : '';
  const ok = response && response.status < 400 && !failure;
  const status = response ? `${response.status}` : `FAILED (${failure?.code ?? 'no response'})`;

  // HTTP 200 can still carry a backend rejection; anything but messageCode 100 gets a ⚠
  const rejected = typeof envelope?.messageCode === 'number' && envelope.messageCode !== 100;
  const mark = !ok ? '✗' : rejected ? '⚠' : '✓';
  const lines = [
    `${tag} ${mark} ${status} ${method} ${url}  (${ms})${code}`,
    `  ▸ Request headers: ${indent(pretty(headersOf(config)))}`,
  ];
  if (method !== 'GET') lines.push(`  ▸ Request body: ${indent(pretty(bodyOf(config)))}`);
  if (failure && !response) lines.push(`  ▸ Error: ${failure.message}`);
  if (response) lines.push(`  ▸ Response: ${indent(pretty(response.data))}`);

  (ok ? console.log : console.warn)(lines.join('\n'));
}

/** Adds the logging interceptors to `instance` when EXPO_PUBLIC_LOGS is on. Attach it before other interceptors. */
export function attachApiLogger(instance: AxiosInstance) {
  if (!Env.logs) return;

  // request interceptors run last-added-first, so attached first this sees the final headers
  instance.interceptors.request.use((config) => {
    const id = nextId++;
    config.logMeta = { id, start: Date.now() };
    console.log(`[API #${id}] → ${(config.method ?? 'get').toUpperCase()} ${instance.getUri(config)}`);
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      finish(instance, response.config, response);
      return response;
    },
    (error: unknown) => {
      if (isCancel(error)) {
        const id = (error as { config?: InternalAxiosRequestConfig }).config?.logMeta?.id ?? '?';
        console.log(`[API #${id}] cancelled (screen closed or input changed)`);
      } else if (isAxiosError(error) && error.config) {
        finish(instance, error.config, error.response, { code: error.code, message: error.message });
      }
      return Promise.reject(error);
    },
  );
}
