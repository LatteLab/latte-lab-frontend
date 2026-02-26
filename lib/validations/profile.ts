import { z } from 'zod';

export const updateProfileSchema = z.object({
  major: z.string().max(100).optional().or(z.literal('')),
  classYear: z.string().max(10).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  interests: z.string().optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
});

export const updateProfileImageSchema = z.object({
  imageUrl: z.string().url().refine(
    (url) => url.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    'Image URL must be from Supabase storage'
  ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
