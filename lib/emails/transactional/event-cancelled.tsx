import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import type { EventCancelledPayload } from '@/lib/emails/templates';

export const eventCancelledSubject = (p: EventCancelledPayload) =>
  `${p.event.name} has been cancelled`;

export function EventCancelled(p: EventCancelledPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={eventCancelledSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        We&rsquo;re sorry to let you know that the event below has been cancelled.
      </Text>
      <EventCard event={p.event} />
      {p.reason && (
        <Text className="text-stone-700 text-base mt-3">
          <strong>Reason:</strong> {p.reason}
        </Text>
      )}
      <Text className="text-stone-500 text-sm mt-4 m-0">
        If you have questions, reply directly to this email.
      </Text>
    </Layout>
  );
}
