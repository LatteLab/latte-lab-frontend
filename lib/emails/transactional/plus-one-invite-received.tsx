import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { PlusOneInviteReceivedPayload } from '@/lib/emails/templates';

export const plusOneInviteReceivedSubject = (p: PlusOneInviteReceivedPayload) =>
  `${p.inviterName ?? 'Someone'} invited you as a +1 to ${p.event.name}`;

export function PlusOneInviteReceived(p: PlusOneInviteReceivedPayload) {
  const greet = p.inviteeName ? `Hi ${p.inviteeName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={plusOneInviteReceivedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        <strong>{p.inviterName ?? 'A member'}</strong> invited you to be their +1 for the event
        below. Accept or decline from the event page.
      </Text>
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>Respond to invite</CtaButton>
    </Layout>
  );
}
