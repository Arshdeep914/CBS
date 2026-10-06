/**
 * Typed access to the EXPO_PUBLIC_* values in `.env`.
 *
 * Expo inlines these at build time, and only for static `process.env.EXPO_PUBLIC_X`
 * reads — so each one is referenced literally below, never through a variable key.
 */

function clean(value: string | undefined) {
  // tolerate values pasted with quotes or stray spaces
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

function flag(value: string | undefined, fallback: boolean) {
  const v = clean(value).toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return fallback;
}

const apiUrl = clean(process.env.EXPO_PUBLIC_API_URL).replace(/\/+$/, '');
const useDemoProducts = flag(process.env.EXPO_PUBLIC_USE_DEMO_PRODUCTS, false);

export const Env = {
  /** Backend base URL, without a trailing slash. */
  apiUrl,
  /** Value for the `Origin` header the backend authorises requests by. */
  apiOrigin: clean(process.env.EXPO_PUBLIC_API_ORIGIN) || 'http://localhost',
  /**
   * Products (catalogue, cart, wishlist, order placement) come from the
   * built-in demo catalogue instead of the API. Forced on when no API URL is set.
   */
  useDemoProducts: useDemoProducts || !apiUrl,
  /** No API URL at all: sign-in and addresses fall back to demo stubs too. */
  offline: !apiUrl,
  razorpayKeyId: clean(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID),
  platformFee: Number(clean(process.env.EXPO_PUBLIC_PLATFORM_FEE)) || 0,
} as const;

if (Env.offline) {
  console.warn('[env] EXPO_PUBLIC_API_URL is empty — running fully offline on demo data.');
}
