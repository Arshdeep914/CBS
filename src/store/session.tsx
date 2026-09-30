import { createContext, use, useState, type ReactNode } from 'react';

export type SessionStatus = 'signed-out' | 'pending' | 'approved';

type SessionState = {
  status: SessionStatus;
  email?: string;
  requestedAt?: string;
};

type SessionContextValue = SessionState & {
  submitSignIn: (email: string) => void;
  approve: () => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Demo session. Any credentials are accepted and the admin "approves" the
 * device automatically — see `src/app/pending.tsx`.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'signed-out' });

  const value: SessionContextValue = {
    ...session,
    submitSignIn: (email) =>
      setSession({ status: 'pending', email, requestedAt: new Date().toISOString() }),
    approve: () => setSession((current) => ({ ...current, status: 'approved' })),
    signOut: () => setSession({ status: 'signed-out' }),
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const context = use(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
