import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getPublishedEvents, getRegistrationCount } from '@/lib/db/event-queries';
import { EventCard } from '@/components/user/event-card';
import { Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const params = await searchParams;
  const filter = params.filter as 'upcoming' | 'past' | undefined;
  const events = await getPublishedEvents(filter || 'upcoming');

  // Get registration counts for each event
  const eventsWithCounts = await Promise.all(
    events.map(async (event) => {
      const count = await getRegistrationCount(event.id, ['registered', 'selected', 'checked_in']);
      return { event, registeredCount: count };
    })
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Title + Filter tabs */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Events</h1>
          <div className="flex gap-2">
            <Link
              href="/user/events?filter=upcoming"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter !== 'past'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Upcoming
            </Link>
            <Link
              href="/user/events?filter=past"
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === 'past'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Past
            </Link>
          </div>
        </div>

        {eventsWithCounts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventsWithCounts.map(({ event, registeredCount }) => (
              <EventCard key={event.id} event={event} registeredCount={registeredCount} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold">No events yet</h3>
            <p className="text-muted-foreground mt-1">
              {filter === 'past' ? 'No past events to show.' : 'Check back soon for upcoming events.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
