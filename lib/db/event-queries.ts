import { db } from './index';
import { events, eventRegistrations, eventAccess, lotteryHistory, users } from './schema';
import { eq, and, desc, gte, lt, ne, count, inArray } from 'drizzle-orm';
import type { Event, NewEvent, EventRegistration } from './schema';

// ============================================================================
// Event Queries
// ============================================================================

export async function getEvents(filter?: 'upcoming' | 'past') {
  const now = new Date();
  const query = db.select().from(events);

  if (filter === 'upcoming') {
    return query.where(gte(events.date, now)).orderBy(events.date);
  }
  if (filter === 'past') {
    return query.where(lt(events.date, now)).orderBy(desc(events.date));
  }
  return query.orderBy(desc(events.date));
}

export async function getPublishedEvents(filter?: 'upcoming' | 'past') {
  const now = new Date();
  const baseConditions = [
    ne(events.status, 'draft'),
    ne(events.type, 'invite_only'),
  ];

  if (filter === 'upcoming') {
    baseConditions.push(gte(events.date, now));
  } else if (filter === 'past') {
    baseConditions.push(lt(events.date, now));
  }

  const orderDir = filter === 'past' ? desc(events.date) : events.date;

  return db.select().from(events)
    .where(and(...baseConditions))
    .orderBy(orderDir);
}

export async function getEventById(id: string): Promise<Event | null> {
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return event || null;
}

export async function createEvent(data: NewEvent): Promise<Event> {
  const [event] = await db.insert(events).values(data).returning();
  return event;
}

export async function updateEvent(id: string, data: Partial<NewEvent>): Promise<Event> {
  const [event] = await db.update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  return event;
}

// ============================================================================
// Event Access Queries (for invite-only events)
// ============================================================================

export async function createEventAccess(userId: string, eventId: string) {
  const [access] = await db.insert(eventAccess)
    .values({ userId, eventId })
    .onConflictDoNothing()
    .returning();
  return access;
}

export async function hasEventAccess(userId: string, eventId: string): Promise<boolean> {
  const [row] = await db.select({ id: eventAccess.id })
    .from(eventAccess)
    .where(and(
      eq(eventAccess.userId, userId),
      eq(eventAccess.eventId, eventId)
    ))
    .limit(1);
  return !!row;
}

export async function getEventByInviteCode(code: string): Promise<Event | null> {
  const [event] = await db.select().from(events)
    .where(and(
      eq(events.inviteCode, code),
      eq(events.type, 'invite_only')
    ))
    .limit(1);
  return event || null;
}

export async function getUserAccessedEventIds(userId: string): Promise<string[]> {
  const rows = await db.select({ eventId: eventAccess.eventId })
    .from(eventAccess)
    .where(eq(eventAccess.userId, userId));
  return rows.map(r => r.eventId);
}

// ============================================================================
// Registration Queries
// ============================================================================

export async function getEventRegistrations(eventId: string) {
  return db.select({
    registration: eventRegistrations,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    },
  })
    .from(eventRegistrations)
    .innerJoin(users, eq(eventRegistrations.userId, users.id))
    .where(eq(eventRegistrations.eventId, eventId))
    .orderBy(eventRegistrations.createdAt);
}

export async function getRegistrationCount(eventId: string, statuses?: string[]) {
  const conditions = [eq(eventRegistrations.eventId, eventId)];
  if (statuses && statuses.length > 0) {
    conditions.push(
      inArray(eventRegistrations.status, statuses as EventRegistration['status'][])
    );
  }
  const [result] = await db.select({ count: count() })
    .from(eventRegistrations)
    .where(and(...conditions));
  return result?.count ?? 0;
}

export async function getUserRegistration(userId: string, eventId: string) {
  const [reg] = await db.select()
    .from(eventRegistrations)
    .where(and(
      eq(eventRegistrations.userId, userId),
      eq(eventRegistrations.eventId, eventId)
    ))
    .limit(1);
  return reg || null;
}

export async function createRegistration(data: { userId: string; eventId: string; status: EventRegistration['status'] }) {
  const [reg] = await db.insert(eventRegistrations)
    .values(data)
    .returning();
  return reg;
}

export async function updateRegistration(id: string, data: Partial<EventRegistration>) {
  const [reg] = await db.update(eventRegistrations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(eventRegistrations.id, id))
    .returning();
  return reg;
}

export async function deleteRegistration(userId: string, eventId: string) {
  await db.delete(eventRegistrations)
    .where(and(
      eq(eventRegistrations.userId, userId),
      eq(eventRegistrations.eventId, eventId)
    ));
}

// ============================================================================
// Lottery Queries
// ============================================================================

export async function getLotteryHistory(userId: string) {
  return db.select().from(lotteryHistory)
    .where(eq(lotteryHistory.userId, userId))
    .orderBy(desc(lotteryHistory.createdAt));
}

export async function getUserNoShowCount(userId: string): Promise<number> {
  const [result] = await db.select({ count: count() })
    .from(eventRegistrations)
    .where(and(
      eq(eventRegistrations.userId, userId),
      eq(eventRegistrations.status, 'no_show')
    ));
  return result?.count ?? 0;
}

export async function getUserLotteryStats(userId: string) {
  const history = await db.select({
    outcome: lotteryHistory.outcome,
    count: count(),
  })
    .from(lotteryHistory)
    .where(eq(lotteryHistory.userId, userId))
    .groupBy(lotteryHistory.outcome);

  const wins = history.find(h => h.outcome === 'won')?.count ?? 0;
  const losses = history.find(h => h.outcome === 'lost')?.count ?? 0;
  return { wins, losses };
}

export async function computePriorityScore(userId: string): Promise<number> {
  const [stats, noShowCount] = await Promise.all([
    getUserLotteryStats(userId),
    getUserNoShowCount(userId),
  ]);
  return 1.0 + (stats.losses * 0.5) - (noShowCount * 1.5);
}

export async function createLotteryHistoryEntries(entries: { userId: string; eventId: string; outcome: 'won' | 'lost' }[]) {
  if (entries.length === 0) return;
  await db.insert(lotteryHistory).values(entries);
}

// ============================================================================
// User Timeline Queries
// ============================================================================

export async function getUserEvents(userId: string, filter?: 'upcoming' | 'past') {
  const now = new Date();

  const conditions = [
    eq(eventRegistrations.userId, userId),
    ne(events.status, 'draft'),
  ];

  if (filter === 'upcoming') {
    conditions.push(gte(events.date, now));
  } else if (filter === 'past') {
    conditions.push(lt(events.date, now));
  }

  // Subquery: count confirmed registrations per event
  const confirmedCounts = db
    .select({
      eventId: eventRegistrations.eventId,
      count: count().as('confirmed_count'),
    })
    .from(eventRegistrations)
    .where(
      inArray(eventRegistrations.status, ['registered', 'selected', 'checked_in'])
    )
    .groupBy(eventRegistrations.eventId)
    .as('confirmed_counts');

  // Registered events
  const registeredRows = await db
    .select({
      event: events,
      registrationStatus: eventRegistrations.status,
      registeredCount: confirmedCounts.count,
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .leftJoin(confirmedCounts, eq(events.id, confirmedCounts.eventId))
    .where(and(...conditions))
    .orderBy(filter === 'past' ? desc(events.date) : events.date);

  // Accessed invite-only events (where user has access but no registration)
  const accessConditions = [
    eq(eventAccess.userId, userId),
    eq(events.type, 'invite_only'),
    ne(events.status, 'draft'),
  ];

  if (filter === 'upcoming') {
    accessConditions.push(gte(events.date, now));
  } else if (filter === 'past') {
    accessConditions.push(lt(events.date, now));
  }

  const accessedRows = await db
    .select({
      event: events,
      registeredCount: confirmedCounts.count,
    })
    .from(eventAccess)
    .innerJoin(events, eq(eventAccess.eventId, events.id))
    .leftJoin(confirmedCounts, eq(events.id, confirmedCounts.eventId))
    .where(and(...accessConditions));

  // Merge: accessed events that aren't already in registered list
  const registeredEventIds = new Set(registeredRows.map(r => r.event.id));
  const accessOnly = accessedRows
    .filter(r => !registeredEventIds.has(r.event.id))
    .map(r => ({
      event: r.event,
      registrationStatus: null as string | null,
      registeredCount: r.registeredCount ?? 0,
    }));

  const all = [...registeredRows, ...accessOnly];
  all.sort((a, b) => {
    const dateA = new Date(a.event.date).getTime();
    const dateB = new Date(b.event.date).getTime();
    return filter === 'past' ? dateB - dateA : dateA - dateB;
  });

  return all.map((row) => ({
    event: row.event,
    registrationStatus: row.registrationStatus,
    registeredCount: row.registeredCount ?? 0,
  }));
}

// ============================================================================
// Check-in Queries
// ============================================================================

export async function getCheckinAttendees(eventId: string) {
  return db.select({
    registration: eventRegistrations,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    },
  })
    .from(eventRegistrations)
    .innerJoin(users, eq(eventRegistrations.userId, users.id))
    .where(and(
      eq(eventRegistrations.eventId, eventId),
      inArray(eventRegistrations.status, ['registered', 'selected', 'checked_in'])
    ))
    .orderBy(users.name);
}

export async function bulkMarkNoShow(eventId: string) {
  await db.update(eventRegistrations)
    .set({ status: 'no_show', updatedAt: new Date() })
    .where(and(
      eq(eventRegistrations.eventId, eventId),
      inArray(eventRegistrations.status, ['registered', 'selected'])
    ));
}

// ============================================================================
// Member Profile Queries
// ============================================================================

export async function updateUserProfile(userId: string, data: {
  major?: string | null;
  classYear?: string | null;
  phone?: string | null;
  interests?: string | null;
  bio?: string | null;
  location?: string | null;
  semesterStatus?: string | null;
}) {
  const [user] = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
}

export async function getAllMembers() {
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    image: users.image,
    major: users.major,
    classYear: users.classYear,
    phone: users.phone,
    interests: users.interests,
    bio: users.bio,
    location: users.location,
    semesterStatus: users.semesterStatus,
  })
    .from(users)
    .orderBy(users.name);
}

// ============================================================================
// Analytics Queries
// ============================================================================

export async function getEventStats() {
  const allEvents = await db.select().from(events)
    .where(eq(events.status, 'completed'));

  const totalEvents = allEvents.length;

  if (totalEvents === 0) {
    return { totalEvents: 0, avgAttendanceRate: 0, noShowRate: 0 };
  }

  const eventIds = allEvents.map(e => e.id);
  const allRegs = await db.select({
    status: eventRegistrations.status,
    count: count(),
  })
    .from(eventRegistrations)
    .where(inArray(eventRegistrations.eventId, eventIds))
    .groupBy(eventRegistrations.status);

  const checkedIn = allRegs.find(r => r.status === 'checked_in')?.count ?? 0;
  const noShows = allRegs.find(r => r.status === 'no_show')?.count ?? 0;
  const total = checkedIn + noShows;

  return {
    totalEvents,
    avgAttendanceRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
  };
}

export async function getUserEventHistory(userId: string) {
  return db.select({
    registration: eventRegistrations,
    event: {
      id: events.id,
      name: events.name,
      date: events.date,
    },
  })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(eq(eventRegistrations.userId, userId))
    .orderBy(desc(events.date));
}
