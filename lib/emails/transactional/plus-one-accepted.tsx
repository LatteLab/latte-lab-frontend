import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import type { PlusOneAcceptedPayload } from '@/lib/emails/templates';

export const plusOneAcceptedSubject = (p: PlusOneAcceptedPayload) =>
  `${p.inviteeName ?? 'Your invitee'} accepted your +1 invite`;

export function PlusOneAccepted(p: PlusOneAcceptedPayload) {
  const greet = p.inviterName ? `Hi ${p.inviterName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={plusOneAcceptedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        <strong>{p.inviteeName ?? 'Your invitee'}</strong> accepted your +1 invite. You&rsquo;re both
        going.
      </Text>
      <EventCard event={p.event} />
    </Layout>
  );
}
