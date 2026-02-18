import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getEventById, getUserRegistration, getEventRegistrations, getRegistrationCount } from '@/lib/db/event-queries';
import { EventRegistrationButton } from '@/components/user/event-registration-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { isGradient, parseGradient, gradientConfigToCSS } from '@/lib/gradients';

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const event = await getEventById(id);
  if (!event || event.status === 'draft') notFound();

  const [registration, registrations, confirmedCount] = await Promise.all([
    getUserRegistration(session.user.id, id),
    getEventRegistrations(id),
    getRegistrationCount(id, ['registered', 'selected', 'checked_in']),
  ]);

  const spotsRemaining = Math.max(0, event.capacity - confirmedCount);
  const capacityPercent = Math.min(100, Math.round((confirmedCount / event.capacity) * 100));

  // Get confirmed attendees for guest list
  const attendees = registrations.filter(r =>
    ['registered', 'selected', 'checked_in'].includes(r.registration.status)
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
            {/* Left: Cover image */}
            <div>
              <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
                {event.coverImage && isGradient(event.coverImage) ? (
                  <div
                    className="h-full w-full"
                    style={{ background: gradientConfigToCSS(parseGradient(event.coverImage)!) }}
                  />
                ) : event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Calendar className="h-20 w-20 text-primary/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Event info */}
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {event.name}
              </h1>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{formatDate(event.date)}</p>
                    <p className="text-sm">
                      {formatTime(event.date)}
                      {event.endDate && ` — ${formatTime(event.endDate)}`}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5 shrink-0" />
                    <p className="font-medium text-foreground">{event.location}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {confirmedCount} / {event.capacity} spots
                    </p>
                    <Progress value={capacityPercent} className="mt-1 h-2" />
                  </div>
                </div>

                {event.type === 'lottery' && event.lotteryDeadline && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Lottery Deadline</p>
                      <p className="text-sm">{formatDate(event.lotteryDeadline)} at {formatTime(event.lotteryDeadline)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration button */}
              <EventRegistrationButton
                event={event}
                registration={registration}
                spotsRemaining={spotsRemaining}
              />

              {/* Description */}
              {event.description && (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none pt-4 border-t"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              )}

              {/* Guest list */}
              {attendees.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">
                    {attendees.length} {attendees.length === 1 ? 'person' : 'people'} going
                  </h3>
                  <div className="flex -space-x-2">
                    {attendees.slice(0, 8).map((a) => (
                      <Avatar key={a.user.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={a.user.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {a.user.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {attendees.length > 8 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                        +{attendees.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 p-4 backdrop-blur-lg md:hidden">
          <EventRegistrationButton
            event={event}
            registration={registration}
            spotsRemaining={spotsRemaining}
          />
        </div>
    </div>
  );
}
