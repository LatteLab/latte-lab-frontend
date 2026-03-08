'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { getUserById } from '@/lib/db/queries';
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

  // Convert empty strings to null for string fields
  const data = Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key, value === '' ? null : value])
  ) as Record<string, string | boolean | null>;

  // Prevent clearing fields that already have values
  const current = await getUserById(session.user.id);
  if (current) {
    const protectedFields = ['major', 'classYear', 'phone', 'interests', 'bio', 'location'] as const;
    for (const field of protectedFields) {
      if (current[field] && (data[field] === null || data[field] === undefined)) {
        data[field] = current[field];
      }
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
