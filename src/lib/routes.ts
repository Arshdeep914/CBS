import type { Href } from 'expo-router';

/**
 * The Home tab (`src/app/(tabs)/index.tsx`).
 *
 * Declared once, loosely typed: Expo Router's incremental typed-route generation
 * on Windows sometimes emits this route as "/index" instead of "/", which makes
 * a literal `'/'` fail type-checking even though it works at runtime.
 */
export const HOME_HREF = '/' as unknown as Href;
