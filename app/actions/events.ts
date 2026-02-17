'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import {
  createEvent as dbCreateEvent,
  updateEvent as dbUpdateEvent,
  getEventById,
  createRegistration,
  deleteRegistration,
  getUserRegistration,
  getRegistrationCount,
  getEventRegistrations,
  computePriorityScore,
  createLotteryHistoryEntries,
  updateRegistration,
  bulkMarkNoShow,
} from '@/lib/db/event-queries';
import { createEventSchema, updateEventSchema } from '@/lib/validations/events';

export async function createEventAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const raw = Object.fromEntries(formData);
  const parsed = createEventSchema.parse({
    ...raw,
    capacity: Number(raw.capacity),
  });

  const event = await dbCreateEvent({
    ...parsed,
    coverImage: parsed.coverImage || null,
    description: parsed.description || null,
    location: parsed.location || null,
    endDate: parsed.endDate || null,
    lotteryDeadline: parsed.lotteryDeadline || null,
    createdBy: session.user.id,
  });

  revalidatePath('/admin/events');
  revalidatePath('/user/events');
  return event;
}

export async function updateEventAction(eventId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const raw = Object.fromEntries(formData);
  const parsed = updateEventSchema.parse({
    ...raw,
    capacity: raw.capacity ? Number(raw.capacity) : undefined,
  });

  const event = await dbUpdateEvent(eventId, {
    ...parsed,
    coverImage: parsed.coverImage || null,
    description: parsed.description || null,
    location: parsed.location || null,
    endDate: parsed.endDate || null,
    lotteryDeadline: parsed.lotteryDeadline || null,
  });

  revalidatePath('/admin/events');
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath('/user/events');
  return event;
}

export async function registerForEvent(eventId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.status === 'draft' || event.status === 'completed') {
    throw new Error('Event not available for registration');
  }

  const existing = await getUserRegistration(session.user.id, eventId);
  if (existing) throw new Error('Already registered');

  if (event.type === 'lottery') {
    if (event.lotteryDeadline && new Date() > event.lotteryDeadline) {
      throw new Error('Lottery deadline has passed');
    }
    await createRegistration({
      userId: session.user.id,
      eventId,
      status: 'lottery_entered',
    });
  } else {
    // Waitlist type
    const confirmedCount = await getRegistrationCount(eventId, ['registered', 'checked_in']);
    const status = confirmedCount < event.capacity ? 'registered' : 'waitlisted';
    await createRegistration({
      userId: session.user.id,
      eventId,
      status,
    });
  }

  revalidatePath(`/user/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function cancelRegistration(eventId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await deleteRegistration(session.user.id, eventId);

  // If waitlist event, promote next person
  const event = await getEventById(eventId);
  if (event?.type === 'waitlist') {
    const regs = await getEventRegistrations(eventId);
    const waitlisted = regs.filter(r => r.registration.status === 'waitlisted');
    if (waitlisted.length > 0) {
      const confirmedCount = await getRegistrationCount(eventId, ['registered', 'checked_in']);
      if (confirmedCount < event.capacity) {
        await updateRegistration(waitlisted[0].registration.id, { status: 'registered' });
      }
    }
  }

  revalidatePath(`/user/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function runLottery(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.type !== 'lottery') throw new Error('Not a lottery event');

  const regs = await getEventRegistrations(eventId);
  const entrants = regs.filter(r => r.registration.status === 'lottery_entered');

  if (entrants.length === 0) throw new Error('No lottery entrants');

  // Compute priority scores
  const scored = await Promise.all(
    entrants.map(async (entry) => {
      const score = await computePriorityScore(entry.user.id);
      return { ...entry, score: Math.max(score, 0.1) }; // Floor at 0.1
    })
  );

  // Weighted random selection
  const spots = event.capacity;
  const selected: typeof scored = [];
  const pool = [...scored];

  for (let i = 0; i < Math.min(spots, pool.length); i++) {
    const totalWeight = pool.reduce((sum, e) => sum + e.score, 0);
    let random = Math.random() * totalWeight;
    let pickedIndex = 0;
    for (let j = 0; j < pool.length; j++) {
      random -= pool[j].score;
      if (random <= 0) {
        pickedIndex = j;
        break;
      }
    }
    selected.push(pool[pickedIndex]);
    pool.splice(pickedIndex, 1);
  }

  const selectedIds = new Set(selected.map(s => s.registration.id));

  // Update statuses and snapshot scores
  const updates = entrants.map(async (entry) => {
    const isSelected = selectedIds.has(entry.registration.id);
    const entryScore = scored.find(s => s.registration.id === entry.registration.id)!.score;
    await updateRegistration(entry.registration.id, {
      status: isSelected ? 'selected' : 'rejected',
      lotteryPriorityScore: entryScore,
    });
  });
  await Promise.all(updates);

  // Write lottery history
  const historyEntries = entrants.map(entry => ({
    userId: entry.user.id,
    eventId,
    outcome: selectedIds.has(entry.registration.id) ? 'won' as const : 'lost' as const,
  }));
  await createLotteryHistoryEntries(historyEntries);

  // Close lottery
  await dbUpdateEvent(eventId, { status: 'closed' });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);

  return {
    selected: selected.map(s => ({ name: s.user.name, email: s.user.email, score: s.score })),
    rejected: pool.map(s => ({ name: s.user.name, email: s.user.email, score: s.score })),
  };
}

export async function checkinAttendee(registrationId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  await updateRegistration(registrationId, { status: 'checked_in' });
  revalidatePath(`/admin/events/${eventId}/checkin`);
}

export async function undoCheckin(registrationId: string, eventId: string, previousStatus: 'registered' | 'selected') {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  await updateRegistration(registrationId, { status: previousStatus });
  revalidatePath(`/admin/events/${eventId}/checkin`);
}

export async function closeEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  await bulkMarkNoShow(eventId);
  await dbUpdateEvent(eventId, { status: 'completed' });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath('/admin/events');
  revalidatePath('/admin');
}

export async function removeRegistration(registrationId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  // Get the registration first
  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);
  if (!reg) throw new Error('Registration not found');

  await deleteRegistration(reg.user.id, eventId);
  revalidatePath(`/admin/events/${eventId}`);
}
