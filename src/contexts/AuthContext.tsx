import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
  /** True when a signed-in session was lost (token expired / refresh failed). */
  sessionExpired: boolean;
  dismissExpired: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  initializing: true,
  sessionExpired: false,
  dismissExpired: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        // A SIGNED_OUT with no fresh session means the token expired and could
        // not be refreshed (there's no manual logout in the app). Flag it so we
        // can tell the user why they're back at the login screen.
        if (event === 'SIGNED_OUT') setSessionExpired(true);
        if (event === 'SIGNED_IN') setSessionExpired(false);
        // Supabase fires a token refresh whenever the app returns from the
        // background. That keeps the SAME user, so we hold the existing session
        // object reference stable — otherwise every data hook would refetch and
        // wipe any in-progress form input. Only update on a real user change.
        setSession(prev => {
          const sameUser = (prev?.user?.id ?? null) === (nextSession?.user?.id ?? null);
          return sameUser ? prev : nextSession;
        });
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ session, initializing, sessionExpired, dismissExpired: () => setSessionExpired(false) }),
    [session, initializing, sessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
