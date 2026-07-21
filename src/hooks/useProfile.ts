import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Gender } from '../utils/calculations';

export type Profile = {
  user_id: string;
  height: number | null;
  birth_date: string | null;
  gender: Gender | null;
  equipment_preference: string | null;
};

export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [session?.user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveProfile = useCallback(
    async (fields: Omit<Profile, 'user_id'>) => {
      if (!session?.user) return { error: new Error('Not signed in') };
      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: session.user.id, ...fields });
      if (!error) await refresh();
      return { error };
    },
    [session?.user, refresh],
  );

  return { profile, loading, refresh, saveProfile };
}
