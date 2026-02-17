import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  description: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  date: z.coerce.date({ error: 'Event date is required' }),
  endDate: z.coerce.date().optional(),
  location: z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  type: z.enum(['waitlist', 'lottery']),
  lotteryDeadline: z.coerce.date().optional(),
  status: z.enum(['draft', 'open']).default('draft'),
}).refine(
  (data) => {
    if (data.type === 'lottery' && !data.lotteryDeadline) {
      return false;
    }
    return true;
  },
  { message: 'Lottery deadline is required for lottery events', path: ['lotteryDeadline'] }
);

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
