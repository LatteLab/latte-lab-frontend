import { Text } from '@react-email/components';
import * as React from 'react';
import { Layout } from './components/layout';
import type { AdminReplyPayload } from '@/lib/emails/templates';

/**
 * Admin-authored reply to an inbound email. Subject is set via SendArgs.subjectOverride
 * (typically "Re: <original>"). Body is admin-authored HTML, already sanitized server-side.
 */
export const adminReplySubject = () =>
  // Real subject set via subjectOverride - this fallback should never be used.
  'Latte Lab reply';

export function AdminReply(p: AdminReplyPayload) {
  return (
    <Layout preview="Latte Lab reply">
      <div
        // sanitize() runs in the action before saving to DB; here we render the result.
        dangerouslySetInnerHTML={{ __html: p.bodyHtml }}
      />
      {p.senderName && (
        <Text className="text-stone-500 text-sm mt-6 m-0">- {p.senderName}, Latte Lab Exec</Text>
      )}
    </Layout>
  );
}
