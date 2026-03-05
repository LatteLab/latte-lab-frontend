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
  getCurrentSemesterLabel,
  getUserEventHistory,
  getUserLotteryStats,
  getUserNoShowCount,
  createAuditLogEntry,
  createAuditLogEntries,
  getRegistrationAuditLog as dbGetRegistrationAuditLog,
  deleteLotteryWins,
  createRegistrationWithCapacityCheck,
  claimLotteryDraftSlot,
} from '@/lib/db/event-queries';
import { getUserById } from '@/lib/db/queries';
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
    ? Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString('base64url')
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
      inviteCode = Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString('base64url');
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
    const reg = await createRegistration({
      userId: session.user.id,
      eventId,
      status: 'pending_approval',
    });
    await createAuditLogEntry({
      registrationId: reg.id,
      eventId,
      userId: session.user.id,
      oldStatus: null,
      newStatus: 'pending_approval',
      action: 'registered',
      actorId: null,
      actorType: 'user',
    });
    revalidatePath(`/user/events/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);
    return;
  }

  // FCFS registration — atomic to prevent over-capacity under concurrent load
  const result = await createRegistrationWithCapacityCheck({
    userId: session.user.id,
    eventId,
    capacity: event.capacity,
    waitlistEnabled: event.waitlistEnabled,
  });

  if (!result) throw new Error('Event is full');

  await createAuditLogEntry({
    registrationId: result.reg.id,
    eventId,
    userId: session.user.id,
    oldStatus: null,
    newStatus: result.wasWaitlisted ? 'waitlisted' : 'registered',
    action: 'registered',
    actorId: null,
    actorType: 'user',
  });

  revalidatePath(`/user/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function cancelRegistration(eventId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Get the registration before deleting so we can log it
  const existing = await getUserRegistration(session.user.id, eventId);

  await deleteRegistration(session.user.id, eventId);

  // Audit entry — will be cascade-deleted with the registration, but the waitlist
  // promotion audit below survives since that registration persists
  if (existing) {
    await createAuditLogEntry({
      registrationId: existing.id,
      eventId,
      userId: session.user.id,
      oldStatus: existing.status,
      newStatus: 'cancelled',
      action: 'removed',
      actorId: null,
      actorType: 'user',
    });
  }

  // If waitlist enabled, promote next person
  const event = await getEventById(eventId);
  if (event?.waitlistEnabled && !event.requireApproval) {
    const regs = await getEventRegistrations(eventId);
    const waitlisted = regs.filter(r => r.registration.status === 'waitlisted');
    if (waitlisted.length > 0) {
      const confirmedCount = await getRegistrationCount(eventId, ['registered', 'checked_in']);
      if (confirmedCount < event.capacity) {
        await updateRegistration(waitlisted[0].registration.id, { status: 'registered' });
        await createAuditLogEntry({
          registrationId: waitlisted[0].registration.id,
          eventId,
          userId: waitlisted[0].user.id,
          oldStatus: 'waitlisted',
          newStatus: 'registered',
          action: 'approved',
          actorId: null,
          actorType: 'system',
        });
      }
    }
  }

  revalidatePath(`/user/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}`);
}

/** Weighted random selection — picks `slots` entries from `pool` (mutates pool). */
function weightedSelect<T extends { score: number }>(pool: T[], slots: number): T[] {
  if (slots >= pool.length) {
    const all = pool.splice(0);
    return all;
  }
  const selected: T[] = [];
  for (let i = 0; i < slots; i++) {
    const totalWeight = pool.reduce((sum, e) => sum + e.score, 0);
    let random = Math.random() * totalWeight;
    let pickedIndex = pool.length - 1;
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
  return selected;
}

export async function runLotteryDraft(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || !event.requireApproval) throw new Error('Lottery only available for approval-required events');
  if (event.lotteryStatus === 'finalized') throw new Error('Lottery has already been finalized');

  // Atomically claim the draft slot — prevents two admins from running the lottery simultaneously.
  // claimLotteryDraftSlot does UPDATE ... WHERE lottery_status IS NULL, which is atomic in PostgreSQL.
  const claimed = await claimLotteryDraftSlot(eventId);
  if (!claimed) throw new Error('A lottery draft is already in progress');

  try {
    const regs = await getEventRegistrations(eventId);
    const entrants = regs.filter(r => r.registration.status === 'pending_approval');

    if (entrants.length === 0) {
      // Reset so admins can retry after adding registrations
      await dbUpdateEvent(eventId, { lotteryStatus: null });
      throw new Error('No pending requests');
    }

    const scored = await Promise.all(
      entrants.map(async (entry) => {
        const score = await computePriorityScore(entry.user.id);
        return { ...entry, score };
      })
    );

    const confirmedCount = await getRegistrationCount(eventId, ['registered', 'selected', 'checked_in']);
    const spots = Math.max(0, event.capacity - confirmedCount);
    const pool = [...scored];
    const selected = weightedSelect(pool, spots);

    const selectedIds = new Set(selected.map(s => s.registration.id));

    await Promise.all(
      scored.map(async (entry) => {
        const isSelected = selectedIds.has(entry.registration.id);
        await updateRegistration(entry.registration.id, {
          status: isSelected ? 'draft_selected' : 'draft_rejected',
          lotteryPriorityScore: entry.score,
        });
      })
    );

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/user/events/${eventId}`);

    return {
      selected: selected.map(s => ({ name: s.user.name, email: s.user.email, score: s.score })),
      rejected: pool.map(s => ({ name: s.user.name, email: s.user.email, score: s.score })),
    };
  } catch (error) {
    // Reset lotteryStatus so admins can retry after a transient failure
    await dbUpdateEvent(eventId, { lotteryStatus: null });
    throw error;
  }
}

export async function removeDraftSelected(registrationId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.lotteryStatus !== 'draft') throw new Error('No lottery draft in progress');

  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);
  if (!reg || reg.registration.status !== 'draft_selected') {
    throw new Error('Registration is not draft selected');
  }

  await updateRegistration(registrationId, { status: 'draft_rejected' });
  revalidatePath(`/admin/events/${eventId}`);
}

export async function promoteDraftRejected(registrationId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.lotteryStatus !== 'draft') throw new Error('No lottery draft in progress');

  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);
  if (!reg || reg.registration.status !== 'draft_rejected') {
    throw new Error('Registration is not draft rejected');
  }

  const draftSelectedCount = regs.filter(r => r.registration.status === 'draft_selected').length;
  const confirmedCount = await getRegistrationCount(eventId, ['registered', 'selected', 'checked_in']);
  const openSlots = Math.max(0, event.capacity - confirmedCount - draftSelectedCount);

  if (openSlots <= 0) throw new Error('No open slots available');

  await updateRegistration(registrationId, { status: 'draft_selected' });
  revalidatePath(`/admin/events/${eventId}`);
}

export async function rerollLottery(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.lotteryStatus !== 'draft') throw new Error('No lottery draft in progress');

  const regs = await getEventRegistrations(eventId);
  const draftSelected = regs.filter(r => r.registration.status === 'draft_selected');
  const draftRejected = regs.filter(r => r.registration.status === 'draft_rejected');

  const confirmedCount = await getRegistrationCount(eventId, ['registered', 'selected', 'checked_in']);
  const totalSlots = Math.max(0, event.capacity - confirmedCount);
  const openSlots = totalSlots - draftSelected.length;

  if (openSlots <= 0 || draftRejected.length === 0) {
    return { newlySelected: [], remainingRejected: draftRejected.length, noOpenSlots: true };
  }

  const scored = await Promise.all(
    draftRejected.map(async (entry) => {
      const score = entry.registration.lotteryPriorityScore ?? await computePriorityScore(entry.user.id);
      return { ...entry, score };
    })
  );

  const pool = [...scored];
  const newSelected = weightedSelect(pool, openSlots);

  await Promise.all(
    newSelected.map(async (entry) =>
      updateRegistration(entry.registration.id, { status: 'draft_selected' })
    )
  );

  revalidatePath(`/admin/events/${eventId}`);

  return {
    newlySelected: newSelected.map(s => ({ name: s.user.name, email: s.user.email, score: s.score })),
    remainingRejected: pool.length,
    noOpenSlots: false,
  };
}

export async function finalizeLottery(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.lotteryStatus !== 'draft') throw new Error('No lottery draft in progress');

  const regs = await getEventRegistrations(eventId);
  const draftSelected = regs.filter(r => r.registration.status === 'draft_selected');
  const draftRejected = regs.filter(r => r.registration.status === 'draft_rejected');

  await Promise.all([
    ...draftSelected.map(r => updateRegistration(r.registration.id, { status: 'selected' })),
    ...draftRejected.map(r => updateRegistration(r.registration.id, { status: 'rejected' })),
  ]);

  const semesterLabel = await getCurrentSemesterLabel();
  const historyEntries = [
    ...draftSelected.map(r => ({
      userId: r.user.id,
      eventId,
      outcome: 'won' as const,
      semester: semesterLabel,
    })),
    ...draftRejected.map(r => ({
      userId: r.user.id,
      eventId,
      outcome: 'lost' as const,
      semester: semesterLabel,
    })),
  ];
  await createLotteryHistoryEntries(historyEntries);

  const auditEntries = [
    ...draftSelected.map(r => ({
      registrationId: r.registration.id,
      eventId,
      userId: r.user.id,
      oldStatus: 'draft_selected',
      newStatus: 'selected',
      action: 'lottery_won' as const,
      actorId: null as string | null,
      actorType: 'system',
    })),
    ...draftRejected.map(r => ({
      registrationId: r.registration.id,
      eventId,
      userId: r.user.id,
      oldStatus: 'draft_rejected',
      newStatus: 'rejected',
      action: 'lottery_lost' as const,
      actorId: null as string | null,
      actorType: 'system',
    })),
  ];
  await createAuditLogEntries(auditEntries);

  await dbUpdateEvent(eventId, { lotteryStatus: 'finalized' });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);
}

export async function discardLotteryDraft(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const event = await getEventById(eventId);
  if (!event || event.lotteryStatus !== 'draft') throw new Error('No lottery draft in progress');

  const regs = await getEventRegistrations(eventId);
  const draftEntrants = regs.filter(r =>
    r.registration.status === 'draft_selected' || r.registration.status === 'draft_rejected'
  );

  await Promise.all(
    draftEntrants.map(r =>
      updateRegistration(r.registration.id, {
        status: 'pending_approval',
        lotteryPriorityScore: null,
      })
    )
  );

  await dbUpdateEvent(eventId, { lotteryStatus: null });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);
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

  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);

  await updateRegistration(registrationId, { status: 'checked_in' });
  if (reg) {
    await createAuditLogEntry({
      registrationId,
      eventId,
      userId: reg.user.id,
      oldStatus: reg.registration.status,
      newStatus: 'checked_in',
      action: 'checked_in',
      actorId: session.user.id,
      actorType: 'admin',
    });
  }
  revalidatePath(`/admin/events/${eventId}/checkin`);
}

export async function undoCheckin(registrationId: string, eventId: string, previousStatus: 'registered' | 'selected') {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);

  await updateRegistration(registrationId, { status: previousStatus });
  if (reg) {
    await createAuditLogEntry({
      registrationId,
      eventId,
      userId: reg.user.id,
      oldStatus: 'checked_in',
      newStatus: previousStatus,
      action: 'status_changed',
      actorId: session.user.id,
      actorType: 'admin',
    });
  }
  revalidatePath(`/admin/events/${eventId}/checkin`);
}

export async function closeEvent(eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  // Revoke lottery wins for lottery winners who didn't check in
  const regs = await getEventRegistrations(eventId);
  const noShowLotteryWinners = regs
    .filter(r => r.registration.status === 'selected')
    .map(r => r.user.id);
  await deleteLotteryWins(eventId, noShowLotteryWinners);

  // Audit log entries for all registrations about to be marked no-show
  const willBeNoShow = regs.filter(r =>
    ['registered', 'selected'].includes(r.registration.status)
  );
  if (willBeNoShow.length > 0) {
    await createAuditLogEntries(willBeNoShow.map(r => ({
      registrationId: r.registration.id,
      eventId,
      userId: r.user.id,
      oldStatus: r.registration.status,
      newStatus: 'no_show',
      action: 'no_show' as const,
      actorId: session.user.id,
      actorType: 'admin' as const,
    })));
  }

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

  await createAuditLogEntry({
    registrationId,
    eventId,
    userId: reg.user.id,
    oldStatus: reg.registration.status,
    newStatus: 'removed',
    action: 'removed',
    actorId: session.user.id,
    actorType: 'admin',
  });

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

  const reg = await getPendingRegistration(registrationId, eventId);

  // Check capacity before approving
  const confirmedCount = await getRegistrationCount(eventId, ['registered', 'selected', 'checked_in']);
  if (confirmedCount >= event.capacity) {
    throw new Error('Event is at capacity');
  }

  await updateRegistration(registrationId, { status: 'registered' });
  await createAuditLogEntry({
    registrationId,
    eventId,
    userId: reg.user.id,
    oldStatus: 'pending_approval',
    newStatus: 'registered',
    action: 'approved',
    actorId: session.user.id,
    actorType: 'admin',
  });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);
}

export async function denyRegistration(registrationId: string, eventId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const reg = await getPendingRegistration(registrationId, eventId);
  await updateRegistration(registrationId, { status: 'rejected' });
  await createAuditLogEntry({
    registrationId,
    eventId,
    userId: reg.user.id,
    oldStatus: 'pending_approval',
    newStatus: 'rejected',
    action: 'denied',
    actorId: session.user.id,
    actorType: 'admin',
  });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/user/events/${eventId}`);
}

// `selected` excluded — lottery-only status set via finalizeLottery, not manual admin change
const ALLOWED_STATUS_CHANGES = ['registered', 'waitlisted', 'pending_approval', 'rejected', 'checked_in', 'no_show'] as const;

export async function changeRegistrationStatus(
  registrationId: string,
  eventId: string,
  newStatus: string,
) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  if (!ALLOWED_STATUS_CHANGES.includes(newStatus as typeof ALLOWED_STATUS_CHANGES[number])) {
    throw new Error('Invalid status');
  }

  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const regs = await getEventRegistrations(eventId);
  const reg = regs.find(r => r.registration.id === registrationId);
  if (!reg) throw new Error('Registration not found');

  if (reg.registration.status === newStatus) {
    throw new Error('Registration already has this status');
  }

  // Capacity check when moving to a "going" status
  if (newStatus === 'registered' || newStatus === 'checked_in') {
    const goingStatuses = ['registered', 'selected', 'checked_in'];
    const isAlreadyGoing = goingStatuses.includes(reg.registration.status);
    if (!isAlreadyGoing) {
      const confirmedCount = await getRegistrationCount(eventId, goingStatuses);
      if (confirmedCount >= event.capacity) {
        throw new Error('Event is at capacity');
      }
    }
  }

  // Revoke lottery win if a lottery winner is moved to a non-going status
  const goingStatuses = ['registered', 'selected', 'checked_in'];
  if (reg.registration.status === 'selected' && !goingStatuses.includes(newStatus)) {
    await deleteLotteryWins(eventId, [reg.user.id]);
  }

  await updateRegistration(registrationId, { status: newStatus as typeof ALLOWED_STATUS_CHANGES[number] });
  await createAuditLogEntry({
    registrationId,
    eventId,
    userId: reg.user.id,
    oldStatus: reg.registration.status,
    newStatus: newStatus,
    action: 'status_changed',
    actorId: session.user.id,
    actorType: 'admin',
  });

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

  const newCode = Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString('base64url');
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

export async function getUserDetailForModal(userId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  const user = await getUserById(userId);
  if (!user) return null;

  const semesterLabel = await getCurrentSemesterLabel();
  const [eventHistory, lotteryStats, noShowCount] = await Promise.all([
    getUserEventHistory(userId),
    getUserLotteryStats(userId, semesterLabel),
    getUserNoShowCount(userId),
  ]);

  const checkedInCount = eventHistory.filter(h => h.registration.status === 'checked_in').length;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      major: user.major,
      classYear: user.classYear,
      bio: user.bio,
    },
    stats: {
      noShowCount,
      eventsAttended: checkedInCount,
      semesterLotteryWins: lotteryStats.wins,
      semesterLotteryLosses: lotteryStats.losses,
    },
    eventHistory: eventHistory.map(h => ({
      eventName: h.event.name,
      eventDate: h.event.date,
      status: h.registration.status,
    })),
  };
}

export async function getRegistrationTimeline(registrationId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');

  return dbGetRegistrationAuditLog(registrationId);
}
