import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Calendar } from 'lucide-react';
import type { Event } from '@/lib/db/schema';

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'registered':
    case 'selected':
    case 'checked_in':
      return { label: 'Going', className: 'bg-green-500/15 text-green-700 border-green-500/25 dark:text-green-400' };
    case 'waitlisted':
      return { label: 'Waitlist', className: 'bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400' };
    case 'lottery_entered':
      return { label: 'Lottery Entered', className: 'bg-purple-500/15 text-purple-700 border-purple-500/25 dark:text-purple-400' };
    case 'rejected':
      return { label: 'Not Selected', className: 'bg-gray-500/15 text-gray-600 border-gray-500/25 dark:text-gray-400' };
    case 'no_show':
      return { label: 'No Show', className: 'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400' };
    default:
      return null;
  }
}

interface TimelineEventCardProps {
  event: Event;
  registrationStatus: string;
  registeredCount: number;
}

export function TimelineEventCard({ event, registrationStatus, registeredCount }: TimelineEventCardProps) {
  const badge = getStatusBadge(registrationStatus);

  return (
    <Link href={`/user/events/${event.id}`}>
      <div className="group flex gap-4 rounded-xl bg-card p-4 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.12)] dark:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)]">
        {/* Left: event info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-sm text-muted-foreground">
            {formatTime(event.date)}
          </p>

          <h3 className="text-lg leading-snug font-semibold tracking-tight line-clamp-2">
            {event.name}
          </h3>

          {event.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{registeredCount} guest{registeredCount !== 1 ? 's' : ''}</span>
          </div>

          {badge && (
            <div className="mt-1">
              <Badge variant="outline" className={`text-xs font-medium ${badge.className}`}>
                {badge.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Right: cover image */}
        <div className="h-[110px] w-[110px] shrink-0 overflow-hidden rounded-lg sm:h-[120px] sm:w-[120px]">
          {event.coverImage ? (
            <Image
              src={event.coverImage}
              alt={event.name}
              width={120}
              height={120}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
              <Calendar className="h-8 w-8 text-primary/30" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
