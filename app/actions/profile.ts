'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { updateUserProfile } from '@/lib/db/event-queries';
import { updateProfileSchema } from '@/lib/validations/profile';

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const raw = Object.fromEntries(formData);
  const parsed = updateProfileSchema.parse(raw);

  // Convert empty strings to null for database
  const data = Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key, value === '' ? null : value])
  ) as Record<string, string | null>;

  await updateUserProfile(session.user.id, data);

  revalidatePath('/user/settings');
  revalidatePath('/user/directory');
}
