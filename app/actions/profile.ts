'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { updateUserProfile } from '@/lib/db/event-queries';
import { updateProfileSchema, updateProfileImageSchema } from '@/lib/validations/profile';

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Coerce checkboxes: present = true, absent = false
  const raw = {
    ...Object.fromEntries(formData),
    isVisibleInDirectory: formData.has('isVisibleInDirectory'),
    hidePhone: formData.has('hidePhone'),
  };
  const parsed = updateProfileSchema.parse(raw);

  // Convert empty strings to null for string fields, preserve booleans as-is
  const data: Parameters<typeof updateUserProfile>[1] = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === 'boolean') {
      (data as Record<string, unknown>)[key] = value;
    } else {
      (data as Record<string, unknown>)[key] = value === '' ? null : value;
    }
  }

  await updateUserProfile(session.user.id, data);

  revalidatePath('/user/settings');
  revalidatePath('/user/directory');
}

export async function updateProfileImage(imageUrl: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  updateProfileImageSchema.parse({ imageUrl });

  await updateUserProfile(session.user.id, { image: imageUrl });

  revalidatePath('/user/settings');
  revalidatePath('/user/directory');
}

export async function removeProfileImage() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await updateUserProfile(session.user.id, { image: null });

  revalidatePath('/user/settings');
  revalidatePath('/user/directory');
}
