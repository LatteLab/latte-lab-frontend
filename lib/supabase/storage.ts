import { supabase } from './client';

export async function uploadEventCover(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('event-covers')
    .upload(fileName, file);

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from('event-covers')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteEventCover(url: string): Promise<void> {
  const path = url.split('/event-covers/').pop();
  if (!path) return;

  await supabase.storage.from('event-covers').remove([path]);
}

export async function uploadProfileImage(userId: string, blob: Blob): Promise<string> {
  const fileName = `${userId}-${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage
    .from('profile-images')
    .upload(fileName, blob, {
      contentType: 'image/webp',
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(fileName);

  // Append cache-buster so the browser doesn't serve stale image
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteProfileImage(url: string): Promise<void> {
  const path = url.split('/profile-images/').pop()?.split('?')[0];
  if (!path) return;
  await supabase.storage.from('profile-images').remove([path]);
}
