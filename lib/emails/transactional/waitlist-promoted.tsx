import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { WaitlistPromotedPayload } from '@/lib/emails/templates';

export const waitlistPromotedSubject = (p: WaitlistPromotedPayload) =>
  `A spot opened up: ${p.event.name}`;

export function WaitlistPromoted(p: WaitlistPromotedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={waitlistPromotedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        You&rsquo;ve been moved off the waitlist - you&rsquo;re confirmed for:
      </Text>
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>View event</CtaButton>
    </Layout>
  );
}
