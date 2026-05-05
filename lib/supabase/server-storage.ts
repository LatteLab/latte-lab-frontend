import 'server-only';

import { getSupabaseAdminClient } from './admin';
import {
  ALLOWED_IMAGE_TYPES,
  EVENT_PHOTO_LIMITS,
  EVENT_PHOTOS_BUCKET,
  imageExtensionForType,
  validateImageMagicBytes,
} from './image-utils';

export async function uploadEventPhotoObject(
  eventId: string,
  file: File,
): Promise<{ path: string; publicUrl: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Only ${EVENT_PHOTO_LIMITS.allowedExtensionsLabel} images are allowed`);
  }
  if (file.size > EVENT_PHOTO_LIMITS.maxSizeBytes) {
    throw new Error(`Image must be under ${EVENT_PHOTO_LIMITS.maxSizeLabel}`);
  }

  validateImageMagicBytes(new Uint8Array(await file.arrayBuffer()));

  const path = `events/${eventId}/${crypto.randomUUID()}.${imageExtensionForType(file.type)}`;
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(EVENT_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(EVENT_PHOTOS_BUCKET)
    .getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

export async function deleteEventPhotoObject(path: string): Promise<void> {
  if (!path) return;

  const { error } = await getSupabaseAdminClient()
    .storage
    .from(EVENT_PHOTOS_BUCKET)
    .remove([path]);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}
