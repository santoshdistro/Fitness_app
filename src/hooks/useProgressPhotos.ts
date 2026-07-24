import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { fileToDownscaledBlob } from '../utils/image';
import type { ProgressPhoto } from '../types/database';

const BUCKET = 'progress-photos';

export type ProgressPhotoWithUrl = ProgressPhoto & { url: string | null };

export function useProgressPhotos() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [photos, setPhotos] = useState<ProgressPhotoWithUrl[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('taken_on', { ascending: true })
      .order('created_at', { ascending: true });

    const rows = (data as ProgressPhoto[]) ?? [];
    let withUrls: ProgressPhotoWithUrl[] = rows.map(r => ({ ...r, url: null }));
    if (rows.length > 0) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(rows.map(r => r.storage_path), 3600);
      const urlByPath = new Map((signed ?? []).map(s => [s.path, s.signedUrl]));
      withUrls = rows.map(r => ({ ...r, url: urlByPath.get(r.storage_path) ?? null }));
    }
    setPhotos(withUrls);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPhoto = useCallback(
    async (file: File, meta: { takenOn: string; weightKg?: number | null; note?: string }) => {
      if (!userId) return { error: new Error('Not signed in') };
      const blob = await fileToDownscaledBlob(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (uploadError) return { error: uploadError };

      const { error: insertError } = await supabase.from('progress_photos').insert({
        user_id: userId,
        storage_path: path,
        taken_on: meta.takenOn,
        weight_kg: meta.weightKg ?? null,
        note: meta.note?.trim() || null,
      });
      if (insertError) {
        // Roll back the orphaned upload so storage stays in sync with the table.
        await supabase.storage.from(BUCKET).remove([path]);
        return { error: insertError };
      }
      await refresh();
      return { error: null };
    },
    [userId, refresh],
  );

  const removePhoto = useCallback(
    async (photo: ProgressPhoto) => {
      await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      const { error } = await supabase.from('progress_photos').delete().eq('id', photo.id);
      if (!error) await refresh();
      return { error };
    },
    [refresh],
  );

  return { photos, loading, refresh, addPhoto, removePhoto };
}
