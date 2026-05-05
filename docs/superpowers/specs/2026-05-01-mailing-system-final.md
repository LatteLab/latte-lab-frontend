# Mailing System - Final v1 Deployment

**Date:** 2026-05-01
**Status:** Code complete pending DB migration, Resend inbound setup, QStash schedules, env vars, and deploy.

## Current Design

- One Resend domain only: `lattelab.org`.
- Outbound senders:
  - `Latte Lab <exec@lattelab.org>` for human-feeling mail and blasts.
  - `Latte Lab <noreply@lattelab.org>` for automated reminders and system notices.
- Replies use tokenized addresses on the apex domain: `reply+<outboxId>@lattelab.org` and `reply+blast-<blastId>@lattelab.org`.
- Resend Inbound receives all mail for `lattelab.org`, the app logs it, then the app forwards it to `lattelab-exec@mit.edu`.
- Vercel is on Hobby, so scheduled jobs are run by QStash, not Vercel Cron.

## Database

Run [scripts/migrate-mailing-system-v1.sql](../../../scripts/migrate-mailing-system-v1.sql) in Supabase SQL Editor before deploying. It includes:

- `email_outbox`, `inbound_emails`, `event_email_reminder_rules`, and `event_email_reminder_sends`.
- `email_outbox.idempotency_key` as a plain unique constraint, not a partial unique index.
- `ON DELETE SET NULL` foreign keys for email audit relationships.
- `event_status` value `cancelled`.
- RLS enabled and anon/authenticated revoked for all server-only email tables.
- RLS enabled and anon/authenticated revoked for `event_photos`.
- Default 24h reminder rules seeded for existing events.

Quick verification:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'email_outbox',
  'inbound_emails',
  'event_email_reminder_rules',
  'event_email_reminder_sends'
);

SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN (
  'email_outbox',
  'inbound_emails',
  'event_email_reminder_rules',
  'event_email_reminder_sends',
  'event_photos'
);

SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'email_outbox'::regclass
  AND conname LIKE '%idempotency%';
```

## Resend And DNS

In Resend:

1. Use the existing `lattelab.org` domain.
2. Enable Receiving/Inbound on that same domain.
3. Add webhook endpoint `https://app.lattelab.org/api/webhooks/inbound-email`.
4. Subscribe only to `email.received`.
5. Save the inbound webhook signing secret as `INBOUND_EMAIL_WEBHOOK_SECRET`.

In Route 53:

- Remove ForwardEmail MX records at the apex.
- Remove the `forward-email=...` TXT record.
- Add Resend's inbound MX record for `lattelab.org` exactly as Resend shows it.
- Keep Resend sending records: SPF, DKIM, return-path MX, and DMARC.
- Apex SPF should include Resend only unless another provider is still sending mail:

```txt
v=spf1 include:_spf.resend.com ~all
```

Do not add or document `reply.lattelab.org` for v1.

## Vercel Env Vars

Set these for Production, Preview, and local `.env.local` where relevant:

```env
EMAIL_FROM="Latte Lab <exec@lattelab.org>"
EMAIL_FROM_AUTOMATED="Latte Lab <noreply@lattelab.org>"
EMAIL_REPLY_DOMAIN="lattelab.org"
INBOUND_FORWARD_TO="lattelab-exec@mit.edu"
INBOUND_EMAIL_WEBHOOK_SECRET="whsec_..."
RESEND_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
AUTH_RESEND_KEY="re_..."
CRON_SECRET="..."
NEXT_PUBLIC_APP_URL="https://app.lattelab.org"
```

## QStash Schedules

Because the project is on Vercel Hobby, do not rely on Vercel Cron.

Create two QStash schedules:

- Every 10 minutes: `GET https://app.lattelab.org/api/cron/email-outbox`
- Every hour: `GET https://app.lattelab.org/api/cron/event-reminder-generator`

Both must include:

```txt
Authorization: Bearer <CRON_SECRET>
```

Local endpoint checks:

```powershell
curl.exe http://localhost:3000/api/cron/email-outbox
curl.exe -H "Authorization: Bearer $env:CRON_SECRET" http://localhost:3000/api/cron/email-outbox
curl.exe -H "Authorization: Bearer $env:CRON_SECRET" http://localhost:3000/api/cron/event-reminder-generator
```

The unauthenticated request should return `401`; authenticated requests should return JSON.

## Smoke Tests

After deploy:

1. Send a registration email and verify it appears in `/admin/email/log`.
2. Reply to `reply+<outboxId>@lattelab.org`.
3. Verify the reply appears in `/admin/email/inbox`.
4. Verify the same reply forwards to `lattelab-exec@mit.edu`.
5. Send a direct email to `exec@lattelab.org`.
6. Verify it logs in `/admin/email/inbox` and forwards to the MIT shared mailbox.
7. Run the QStash-protected outbox endpoint once and confirm queued bulk notifications drain.

## Notes

- Seeing `reply+<uuid>@lattelab.org` in Outlook is expected. That token is how the app threads replies.
- Blast replies are threaded by the `reply+blast-<blastId>@lattelab.org` address, not by a shared RFC Message-ID.
- Blasts intentionally stay on the existing `email_blasts` plus `email_recipients` campaign pipeline for v1. Transactional event mail uses `email_outbox`.
- Inbound webhook payloads are metadata-only; the app fetches full content via Resend Receiving before storing parsed fields.
- Raw inbound payload storage intentionally keeps webhook metadata and errors only, not duplicate full message content.
