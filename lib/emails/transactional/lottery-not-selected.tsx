import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import type { LotteryNotSelectedPayload } from '@/lib/emails/templates';

export const lotteryNotSelectedSubject = (p: LotteryNotSelectedPayload) =>
  `Update on the ${p.event.name} lottery`;

export function LotteryNotSelected(p: LotteryNotSelectedPayload) {
  const greet = p.userName ? `Hi ${p.userName.split(' ')[0]},` : 'Hi,';
  return (
    <Layout preview={lotteryNotSelectedSubject(p)}>
      <Text className="text-stone-700 text-base m-0">{greet}</Text>
      <Text className="text-stone-700 text-base mt-3">
        Thanks for entering the lottery for <strong>{p.event.name}</strong>. You weren&rsquo;t
        selected in this round, but you remain in the pool - if anyone declines or there&rsquo;s a
        re-roll, you may still be picked. We&rsquo;ll let you know if anything changes.
      </Text>
    </Layout>
  );
}
