import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin } from 'lucide-react';
import type { Event } from '@/lib/db/schema';

function getEventBadge(event: Event, registeredCount: number) {
  if (event.type === 'lottery') {
    if (event.lotteryDeadline && new Date() > event.lotteryDeadline) {
      return { label: 'Lottery Closed', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
    }
    return { label: 'Lottery Open', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
  }
  // Waitlist type
  if (registeredCount < event.capacity) {
    return { label: 'Open', className: 'bg-green-500/10 text-green-500 border-green-500/20' };
  }
  return { label: 'Waitlist', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
}

function formatEventDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();
}

interface EventCardProps {
  event: Event;
  registeredCount: number;
}

export function EventCard({ event, registeredCount }: EventCardProps) {
  const badge = getEventBadge(event, registeredCount);

  return (
    <Link href={`/user/events/${event.id}`}>
      <Card className="group overflow-hidden rounded-2xl border-0 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.4)]">
        {/* Cover image */}
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <Calendar className="h-12 w-12 text-primary/40" />
            </div>
          )}
        </div>

        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">
              {formatEventDate(event.date)}
            </p>
            <Badge variant="outline" className={badge.className}>
              {badge.label}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold tracking-tight line-clamp-1">
            {event.name}
          </h3>
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {registeredCount} / {event.capacity} spots
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
