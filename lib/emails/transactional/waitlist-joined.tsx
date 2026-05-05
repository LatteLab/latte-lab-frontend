import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { WaitlistJoinedPayload } from '@/lib/emails/templates';

export const waitlistJoinedSubject = (p: WaitlistJoinedPayload) =>
  `You're on the waitlist for ${p.event.name}`;

export function WaitlistJoined(p: WaitlistJoinedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={waitlistJoinedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        You&rsquo;re on the waitlist for the event below
        {p.position !== null ? ` at position #${p.position}` : ''}. We&rsquo;ll email you the
        moment a spot opens up.
      </Text>
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>View event</CtaButton>
    </Layout>
  );
}
