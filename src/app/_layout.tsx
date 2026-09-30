import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { OrdersProvider } from '@/store/orders';
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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
        <SessionProvider>
          <OrdersProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </OrdersProvider>
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/** Routes are gated by session status; Expo Router redirects automatically when it changes. */
function RootNavigator() {
  const { status } = useSession();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signed-out'}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'pending'}>
        <Stack.Screen name="pending" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack.Protected>

      <Stack.Protected guard={status === 'approved'}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="search" options={{ animation: 'fade' }} />
        <Stack.Screen name="category/[id]" />
        <Stack.Screen name="brand/[id]" />
        <Stack.Screen name="brands" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="cart" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="order/[id]" />
      </Stack.Protected>
    </Stack>
  );
}
