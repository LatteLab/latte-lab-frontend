import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import type { PlusOneCancelledPayload } from '@/lib/emails/templates';

export const plusOneCancelledSubject = (p: PlusOneCancelledPayload) =>
  `${p.inviterName ?? 'Your inviter'} cancelled their +1 invite to ${p.event.name}`;

export function PlusOneCancelled(p: PlusOneCancelledPayload) {
  const greet = p.inviteeName ? `Hi ${p.inviteeName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={plusOneCancelledSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        <strong>{p.inviterName ?? 'A member'}</strong> cancelled the +1 invite they sent you for{' '}
        <strong>{p.event.name}</strong>. Your own registration (if any) is unchanged.
      </Text>
    </Layout>
  );
}
