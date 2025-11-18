'use server';

import { addAdminEmail as dbAddAdminEmail, removeAdminEmail as dbRemoveAdminEmail } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import type { AdminWhitelist } from '@/lib/db';

export async function addAdminEmail(email: string): Promise<AdminWhitelist> {
  const cleanEmail = email.trim();
  const result = await dbAddAdminEmail(cleanEmail);
  revalidatePath('/admin');
  return result;
}

export async function removeAdminEmail(id: string): Promise<void> {
  await dbRemoveAdminEmail(id);
  revalidatePath('/admin');
}
