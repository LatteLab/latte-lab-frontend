import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { getEventById, getUserRegistration, getEventRegistrations, getRegistrationCount, hasEventAccess } from '@/lib/db/event-queries';
import { EventRegistrationButton } from '@/components/user/event-registration-button';
import { PastEventStatusCard } from '@/components/user/past-event-status-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, Users, Lock, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { isGradient, parseGradient, gradientConfigToCSS } from '@/lib/gradients';
import { CoverImageLightbox } from '@/components/user/cover-image-lightbox';

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

function formatMonthShort(date: Date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatDay(date: Date) {
  return new Date(date).getDate();
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  // Access check for private events
  if (event.visibility === 'private') {
    const access = await hasEventAccess(session.user.id, id);
    if (!access) notFound();
  }

  const [registration, registrations, confirmedCount] = await Promise.all([
    getUserRegistration(session.user.id, id),
    getEventRegistrations(id),
    getRegistrationCount(id, ['registered', 'selected', 'checked_in']),
  ]);

  const spotsRemaining = Math.max(0, event.capacity - confirmedCount);
  const capacityPercent = Math.min(100, Math.round((confirmedCount / event.capacity) * 100));
  const isPastEvent = new Date(event.endDate ?? event.date) < new Date()
    || event.status === 'closed' || event.status === 'completed';

  // Get confirmed attendees for guest list
  const attendees = registrations.filter(r =>
    ['registered', 'selected', 'checked_in'].includes(r.registration.status)
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`mx-auto max-w-4xl px-4 py-8 ${!isPastEvent ? 'pb-40 md:pb-8' : ''}`}>
          <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
            {/* Left: Cover image */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                {event.coverImage && isGradient(event.coverImage) ? (
                  <div
                    className="h-full w-full"
                    style={{ background: gradientConfigToCSS(parseGradient(event.coverImage)!) }}
                  />
                ) : event.coverImage ? (
                  <>
                    <img
                      src={event.coverImage}
                      alt={event.name}
                      className="h-full w-full object-cover"
                    />
                    <CoverImageLightbox src={event.coverImage} alt={event.name} />
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Calendar className="h-20 w-20 text-primary/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Event info */}
            <div className="space-y-6">
              {event.visibility === 'private' && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-pink-600">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Private Event</span>
                </div>
              )}

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {event.name}
              </h1>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/50">
                    <span className="text-[10px] font-semibold uppercase leading-none text-muted-foreground">
                      {formatMonthShort(event.date)}
                    </span>
                    <span className="text-lg font-bold leading-tight text-foreground">
                      {formatDay(event.date)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{formatDate(event.date)}</p>
                    <p className="text-sm">
                      {formatTime(event.date)}
                      {event.endDate && ` — ${formatTime(event.endDate)}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">
                    {event.location
                      ? event.location
                      : event.visibility === 'private'
                        ? 'Register to See Address'
                        : 'No location specified'}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {confirmedCount} / {event.capacity} spots
                    </p>
                    <Progress value={capacityPercent} className="mt-1 h-2" />
                  </div>
                </div>
              </div>

              {/* Registration container — hidden on mobile when sticky CTA is shown */}
              {isPastEvent ? (
                <PastEventStatusCard
                  registrationStatus={registration?.status ?? null}
                  userName={session.user.name || ''}
                  userImage={session.user.image || null}
                />
              ) : (
                <div className="hidden md:block rounded-xl border p-5 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Registration</p>

                  {event.requireApproval && (
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Approval Required</p>
                        <p className="text-xs text-muted-foreground">Your registration is subject to host approval.</p>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Welcome! To join the event, please register below.
                  </p>

                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {session.user.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <span className="font-medium">{session.user.name}</span>{' '}
                      <span className="text-muted-foreground">{session.user.email}</span>
                    </div>
                  </div>

                  <EventRegistrationButton
                    event={event}
                    registration={registration}
                    spotsRemaining={spotsRemaining}
                  />
                </div>
              )}

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
        {!isPastEvent && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 p-4 backdrop-blur-lg md:hidden">
            <EventRegistrationButton
              event={event}
              registration={registration}
              spotsRemaining={spotsRemaining}
            />
          </div>
        )}
    </div>
  );
}
