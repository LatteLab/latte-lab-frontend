import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import type { RegistrationRejectedPayload } from '@/lib/emails/templates';

export const registrationRejectedSubject = (p: RegistrationRejectedPayload) =>
  `Update on your ${p.event.name} application`;

export function RegistrationRejected(p: RegistrationRejectedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={registrationRejectedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        Thanks for applying to <strong>{p.event.name}</strong>. Unfortunately we weren&rsquo;t
        able to confirm a spot for you this time.
      </Text>
      <Text className="text-stone-700 text-base mt-3">
        Keep an eye out for upcoming events - we&rsquo;d love to see you at the next one.
      </Text>
    </Layout>
  );
}
