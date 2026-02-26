import { z } from 'zod';

const eventBaseSchema = z.object({
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

const endDateAfterStart = {
  check: (data: { date?: Date; endDate?: Date }) =>
    !data.endDate || !data.date || data.endDate > data.date,
  message: 'End date must be after start date',
  path: ['endDate'] as string[],
};

export const createEventSchema = eventBaseSchema.refine(
  endDateAfterStart.check,
  { message: endDateAfterStart.message, path: endDateAfterStart.path },
);

// Update schema: requireApproval is NOT included (locked at creation)
export const updateEventSchema = eventBaseSchema
  .omit({ requireApproval: true })
  .partial()
  .refine(endDateAfterStart.check, {
    message: endDateAfterStart.message,
    path: endDateAfterStart.path,
  });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
