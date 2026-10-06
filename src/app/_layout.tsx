import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { configureNotifications, listenForTaps } from '@/lib/notifications';
import { SessionProvider, useSession } from '@/store/session';

const LightNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.surface,
    border: Colors.light.border,
    text: Colors.light.text,
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    border: Colors.dark.border,
    text: Colors.dark.text,
  },
};

// foreground banners and Android channels, before any notification can arrive
void configureNotifications();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
        <SessionProvider>
          <StatusBar style="auto" />
          <RootNavigator />
          <ToastHost />
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Sign-in first: every shopping screen sits behind the session. Expo Router
 * redirects automatically when the status changes. While the saved session is
 * being restored the splash screen stays up, so nothing renders here.
 */
function RootNavigator() {
  const { status } = useSession();
  if (status === 'loading') return null;

  return (
    <>
      {status === 'signed-in' && <NotificationTaps />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === 'signed-out'}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={status === 'signed-in'}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="brand/[name]" />
          <Stack.Screen name="brands" />
          <Stack.Screen name="product/[id]" />
          <Stack.Screen name="cart" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="wishlist" />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="order-placed" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="addresses" />
          <Stack.Screen name="address-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="notifications" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

/** Opens the screen a tapped notification points at, once navigation is ready. */
function NotificationTaps() {
  const ready = !!useRootNavigationState()?.key;
  useEffect(() => (ready ? listenForTaps() : undefined), [ready]);
  return null;
}
