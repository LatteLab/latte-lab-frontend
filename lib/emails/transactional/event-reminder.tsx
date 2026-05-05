import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { EventReminderPayload } from '@/lib/emails/templates';

export const eventReminderSubject = (p: EventReminderPayload) =>
  `Reminder: ${p.event.name} ${p.humanOffsetLabel}`;

export function EventReminder(p: EventReminderPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={eventReminderSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        Quick reminder - <strong>{p.event.name}</strong> is {p.humanOffsetLabel}.
      </Text>
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>View event</CtaButton>
    </Layout>
  );
}
