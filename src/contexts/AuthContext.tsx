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
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  initializing: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitializing(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
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

  const value = useMemo(() => ({ session, initializing }), [session, initializing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
