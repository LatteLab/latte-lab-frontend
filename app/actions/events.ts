'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import {
  createEvent as dbCreateEvent,
  updateEvent as dbUpdateEvent,
  deleteEvent as dbDeleteEvent,
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
  getEventByInviteCode,
  createEventAccess,
  hasEventAccess,
} from '@/lib/db/event-queries';
import { createEventSchema, updateEventSchema } from '@/lib/validations/events';

export async function createEventAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const raw = Object.fromEntries(formData);
  const parsed = createEventSchema.parse({
    ...raw,
    capacity: Number(raw.capacity),
    requireApproval: raw.requireApproval === 'true',
    waitlistEnabled: raw.waitlistEnabled === 'true',
  });

  // Auto-generate invite code for private events
  const inviteCode = parsed.visibility === 'private'
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : null;

  const event = await dbCreateEvent({
    ...parsed,
    coverImage: parsed.coverImage || null,
    description: parsed.description || null,
    location: parsed.location || null,
    endDate: parsed.endDate || null,
    inviteCode,
    status: 'open',
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
    waitlistEnabled: raw.waitlistEnabled !== undefined ? raw.waitlistEnabled === 'true' : undefined,
  });

  // Handle invite code when visibility changes
  let inviteCode: string | null | undefined;
  if (parsed.visibility === 'private') {
    const existing = await getEventById(eventId);
    if (!existing?.inviteCode) {
      inviteCode = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    }
  } else if (parsed.visibility === 'public') {
    // Keep invite code even when going public (existing links still work)
  }

  const event = await dbUpdateEvent(eventId, {
    ...parsed,
    coverImage: parsed.coverImage || null,
    description: parsed.description || null,
    location: parsed.location || null,
    endDate: parsed.endDate || null,
    ...(inviteCode !== undefined && { inviteCode }),
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
  if (!event || event.status !== 'open') {
    throw new Error('Event not available for registration');
  }

  // For private events, verify user has access
  if (event.visibility === 'private') {
    const access = await hasEventAccess(session.user.id, eventId);
    if (!access) throw new Error('You do not have access to this event');
  }

  const existing = await getUserRegistration(session.user.id, eventId);
  if (existing) throw new Error('Already registered');

  // Require approval — always pending_approval
  if (event.requireApproval) {
    await createRegistration({
      userId: session.user.id,
      eventId,
      status: 'pending_approval',
    });
    revalidatePath(`/user/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);
    return;
  }

  // FCFS registration
  const confirmedCount = await getRegistrationCount(eventId, ['registered', 'checked_in']);

  if (confirmedCount < event.capacity) {
    await createRegistration({
      userId: session.user.id,
      eventId,
      status: 'registered',
    });
  } else if (event.waitlistEnabled) {
    await createRegistration({
      userId: session.user.id,
      eventId,
      status: 'waitlisted',
    });
  } else {
    throw new Error('Event is full');
  }

  revalidatePath(`/user/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function cancelRegistration(eventId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  await deleteRegistration(session.user.id, eventId);

  // If waitlist enabled, promote next person
  const event = await getEventById(eventId);
  if (event?.waitlistEnabled && !event.requireApproval) {
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
  if (!event || !event.requireApproval) throw new Error('Lottery only available for approval-required events');

  const regs = await getEventRegistrations(eventId);
  const entrants = regs.filter(r => r.registration.status === 'pending_approval');

  if (entrants.length === 0) throw new Error('No pending requests');

  // Compute priority scores
  const scored = await Promise.all(
    entrants.map(async (entry) => {
      const score = await computePriorityScore(entry.user.id);
      return { ...entry, score: Math.max(score, 0.1) };
    })
  );

  // Weighted random selection
  const confirmedCount = await getRegistrationCount(eventId, ['registered', 'selected', 'checked_in']);
  const spots = Math.max(0, event.capacity - confirmedCount);
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

  // Close registration after lottery
  await dbUpdateEvent(eventId, { status: 'closed' });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);

  return {
    selected: selected.map(s => ({ name: s.user.name, email: s.user.email, score: s.score })),
    rejected: pool.map(s => ({ name: s.user.name, email: s.user.email, score: s.score })),
  };
}

export async function closeRegistration(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.status !== 'open') throw new Error('Event is not open');

  await dbUpdateEvent(eventId, { status: 'closed' });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath('/admin/events');
  revalidatePath(`/user/events/${eventId}`);
  revalidatePath('/user/events');
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

  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);
  if (!reg) throw new Error('Registration not found');

  await deleteRegistration(reg.user.id, eventId);
  revalidatePath(`/admin/events/${eventId}`);
}

async function getPendingRegistration(registrationId: string, eventId: string) {
  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);
  if (!reg) throw new Error('Registration not found');
  if (reg.registration.status !== 'pending_approval') {
    throw new Error('Registration is not pending approval');
  }
  return reg;
}

export async function approveRegistration(registrationId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  await getPendingRegistration(registrationId, eventId);

  // Check capacity before approving
  const confirmedCount = await getRegistrationCount(eventId, ['registered', 'selected', 'checked_in']);
  if (confirmedCount >= event.capacity) {
    throw new Error('Event is at capacity');
  }

  await updateRegistration(registrationId, { status: 'registered' });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);
}

export async function denyRegistration(registrationId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  await getPendingRegistration(registrationId, eventId);
  await updateRegistration(registrationId, { status: 'rejected' });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);
}

export async function accessEventByInviteCode(code: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const event = await getEventByInviteCode(code);
  if (!event) throw new Error('Invalid invite code');

  await createEventAccess(session.user.id, event.id);
  return event.id;
}

export async function regenerateInviteCode(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.visibility !== 'private') {
    throw new Error('Can only regenerate invite codes for private events');
  }

  const newCode = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  await dbUpdateEvent(eventId, { inviteCode: newCode });

  revalidatePath(`/admin/events/${eventId}`);
  return newCode;
}

export async function deleteEventAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  await dbDeleteEvent(eventId);

  revalidatePath('/admin/events');
  revalidatePath('/user/events');
}
