import { Text, Section } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { EventChangedPayload } from '@/lib/emails/templates';

const FIELD_LABELS: Record<string, string> = {
  date: 'Start time',
  endDate: 'End time',
  location: 'Location',
  visibility: 'Visibility',
};

export const eventChangedSubject = (p: EventChangedPayload) => {
  // Use friendly labels in the subject - recipients shouldn't see "endDate" camelCase.
  const fields = p.changes.map((c) => FIELD_LABELS[c.field] ?? c.field).join(', ');
  return `Update for ${p.event.name}${fields ? `: ${fields} changed` : ''}`;
};

export function EventChanged(p: EventChangedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={eventChangedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        Heads up - details for an event you&rsquo;re registered for have changed:
      </Text>
      <EventCard event={p.event} />
      <Section className="bg-amber-50 rounded-xl px-5 py-4 my-4 border border-amber-200">
        {p.changes.map((c) => (
          <Text key={c.field} className="text-sm text-stone-800 m-0 mb-1">
            <strong>{FIELD_LABELS[c.field] ?? c.field}:</strong>{' '}
            <span className="text-stone-500 line-through">{c.oldValue ?? '-'}</span>{' '}
            <span className="text-stone-900">{'->'} {c.newValue ?? '-'}</span>
          </Text>
        ))}
      </Section>
      <CtaButton href={p.event.url}>View updated details</CtaButton>
    </Layout>
  );
}
