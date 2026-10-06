import * as SplashScreen from 'expo-splash-screen';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { onSessionExpired } from '@/api/client';
import { toast } from '@/components/ui/toast';
import { clearSession, loadSession, saveSession } from '@/lib/session-storage';
import { shop } from '@/services';
import type { UserProfile } from '@/services/types';
import { addressActions } from '@/store/addresses';
import { cartActions } from '@/store/cart';
import { clearOrderCache } from '@/store/orders';
import { wishlistActions } from '@/store/wishlist';

SplashScreen.preventAutoHideAsync().catch(() => {});

export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

type SessionContextValue = {
  status: SessionStatus;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

/** The signed-in user's server-side state, fetched in the background. */
function loadAccountData() {
  cartActions.refresh().catch(() => {});
  wishlistActions.refresh().catch(() => {});
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Restores the saved session at launch (the splash screen stays up meanwhile),
 * and owns sign-in / sign-out. The cart and wishlist follow the session: they
 * load on sign-in and are wiped on sign-out.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setStatus(session ? 'signed-in' : 'signed-out');
      if (session) loadAccountData();
      SplashScreen.hideAsync().catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    await clearSession();
    cartActions.reset();
    wishlistActions.reset();
    addressActions.reset();
    clearOrderCache();
    setUser(null);
    setStatus('signed-out');
  }

  // the backend rejected our token mid-session
  useEffect(
    () =>
      onSessionExpired(() => {
        toast.show('Your session has expired. Please sign in again.', 'error');
        void signOut();
      }),
    [],
  );

  async function signIn(email: string, password: string) {
    const result = await shop.auth.signIn(email, password);
    await saveSession({ jwt: result.jwt, pksoftToken: result.pksoftToken, user: result.user });
    setUser(result.user);
    setStatus('signed-in');
    loadAccountData();
  }

  return <SessionContext value={{ status, user, signIn, signOut }}>{children}</SessionContext>;
}

export function useSession() {
  const context = use(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
