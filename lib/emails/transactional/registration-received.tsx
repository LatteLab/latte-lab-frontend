import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import { EventCard } from './components/event-card';
import { CtaButton } from './components/cta-button';
import type { RegistrationReceivedPayload } from '@/lib/emails/templates';

export const registrationReceivedSubject = (p: RegistrationReceivedPayload) =>
  p.requiresApproval
    ? `Application received: ${p.event.name}`
    : `You're confirmed for ${p.event.name}`;

export function RegistrationReceived(p: RegistrationReceivedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={registrationReceivedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      {p.requiresApproval ? (
        <Text className="text-stone-700 text-base mt-3">
          Thanks for applying. We&rsquo;ve received your registration for the event below and will let
          you know once the host has reviewed it.
        </Text>
      ) : (
        <Text className="text-stone-700 text-base mt-3">
          You&rsquo;re confirmed. We&rsquo;ll see you there.
        </Text>
      )}
      <EventCard event={p.event} />
      <CtaButton href={p.event.url}>View event</CtaButton>
    </Layout>
  );
}
