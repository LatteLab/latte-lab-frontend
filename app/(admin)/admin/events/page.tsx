import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getEvents, getRegistrationCount } from '@/lib/db/event-queries';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  open: 'bg-green-500/10 text-green-500 border-green-500/20',
  closed: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

export default async function AdminEventsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (!session.user.isAdmin) redirect('/user');

  const events = await getEvents();

  const eventsWithCounts = await Promise.all(
    events.map(async (event) => {
      const count = await getRegistrationCount(event.id);
      return { event, registrationCount: count };
    })
  );

  return (
    <>
      <PageHeader
        title="Events"
        showSidebarTrigger
        actions={
          <Link href="/admin/events/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Event
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6">
          {eventsWithCounts.length > 0 ? (
            <div className="space-y-2">
              {eventsWithCounts.map(({ event, registrationCount }) => (
                <Link key={event.id} href={`/admin/events/${event.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{event.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                        {event.location && ` · ${event.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-sm text-muted-foreground">
                        {registrationCount} / {event.capacity}
                      </span>
                      <Badge variant="outline" className={statusColors[event.status] || ''}>
                        {event.status}
                      </Badge>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              <p>No events yet.</p>
              <Link href="/admin/events/new">
                <Button className="mt-4">Create Your First Event</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
