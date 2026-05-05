import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { LotterySelectedPayload } from '@/lib/emails/templates';

export const lotterySelectedSubject = (p: LotterySelectedPayload) =>
  `You got into ${p.event.name}`;

export function LotterySelected(p: LotterySelectedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={lotterySelectedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        You won the lottery - you&rsquo;re confirmed for:
      </Text>
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>View event</CtaButton>
      <Text className="text-stone-500 text-sm mt-4 m-0">
        If you can no longer attend, please cancel from the event page so someone on the waitlist
        can take your spot.
      </Text>
    </Layout>
  );
}
