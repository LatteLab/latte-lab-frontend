import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { RegistrationApprovedPayload } from '@/lib/emails/templates';

export const registrationApprovedSubject = (p: RegistrationApprovedPayload) =>
  `You're confirmed for ${p.event.name}`;

export function RegistrationApproved(p: RegistrationApprovedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={registrationApprovedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        Good news - your registration has been approved. You&rsquo;re confirmed for:
      </Text>
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>View event</CtaButton>
    </Layout>
  );
}
