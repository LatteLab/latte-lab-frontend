import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import type { PlusOneDeclinedPayload } from '@/lib/emails/templates';

export const plusOneDeclinedSubject = (p: PlusOneDeclinedPayload) =>
  `${p.inviteeName ?? 'Your invitee'} declined your +1 invite`;

export function PlusOneDeclined(p: PlusOneDeclinedPayload) {
  const greet = p.inviterName ? `Hi ${p.inviterName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={plusOneDeclinedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        <strong>{p.inviteeName ?? 'Your invitee'}</strong> declined your +1 invite for{' '}
        <strong>{p.event.name}</strong>. You can invite someone else from the event page.
      </Text>
    </Layout>
  );
}
