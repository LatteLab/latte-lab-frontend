import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  description: z.string().optional(),
  coverImage: z.string().optional().or(z.literal('')),
  date: z.coerce.date({ error: 'Event date is required' }),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  visibility: z.enum(['private', 'public']).default('private'),
  waitlistEnabled: z.coerce.boolean().default(false),
  requireApproval: z.coerce.boolean().default(false),
});

// Update schema: requireApproval is NOT included (locked at creation)
export const updateEventSchema = createEventSchema.omit({ requireApproval: true }).partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
