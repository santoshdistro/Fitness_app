import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { ExerciseSet, WorkoutLog } from '../types/database';

export function useRecentWorkouts(limit: number) {
  const { session } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setWorkouts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('session_timestamp', { ascending: false })
      .limit(limit);
    setWorkouts((data as WorkoutLog[]) ?? []);
    setLoading(false);
  }, [session?.user, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveWorkout = useCallback(
    async (routineName: string, exerciseData: ExerciseSet[]) => {
      if (!session?.user) return { error: new Error('Not signed in') };
      const { error } = await supabase.from('workout_logs').insert({
        user_id: session.user.id,
        routine_name: routineName || null,
        exercise_data: exerciseData,
      });
      if (!error) await refresh();
      return { error };
    },
    [session?.user, refresh],
  );

  const deleteWorkout = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('workout_logs').delete().eq('id', id);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { workouts, loading, refresh, saveWorkout, deleteWorkout };
}
