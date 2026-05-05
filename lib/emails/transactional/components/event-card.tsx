import { Section, Text } from '@react-email/components';
import * as React from 'react';
import type { EventSummary } from '@/lib/emails/templates';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Section className="bg-stone-50 rounded-xl px-5 py-4 my-4 border border-stone-200">
      <Text className="m-0 text-base font-semibold text-stone-900">{event.name}</Text>
      <Text className="m-0 mt-1 text-sm text-stone-700">{formatDate(event.date)}</Text>
      {event.location && (
        <Text className="m-0 mt-1 text-sm text-stone-700">{event.location}</Text>
      )}
    </Section>
  );
}
