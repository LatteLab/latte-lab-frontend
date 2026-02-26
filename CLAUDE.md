# CLAUDE.md

Latte Lab Frontend - Next.js app for MIT's Latte Lab organization management.

## Tech Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- Auth: NextAuth v5 (Google OAuth restricted to `mit.edu`)
- Database: PostgreSQL (Supabase) + Drizzle ORM
- Storage: Supabase Storage (`event-covers`, `profile-images` buckets) via `lib/supabase/client.ts`
- Rich text: Tiptap — event descriptions stored as HTML in `description` text column
- Package manager: pnpm

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio
```

## Project Structure

```
app/
├── (admin)/admin/              # Admin section (protected)
│   ├── page.tsx                # Dashboard with user + event stats
│   ├── email/page.tsx          # Email blast hub
│   ├── email/compose/page.tsx  # Compose / edit draft
│   ├── email/[id]/page.tsx     # Blast detail & delivery tracking
│   ├── events/page.tsx         # Event management list
│   ├── events/new/page.tsx     # Create event
│   ├── events/[id]/page.tsx    # Event detail (registrations, lottery, edit)
│   ├── events/[id]/checkin/    # Mobile check-in mode
│   ├── users/page.tsx          # Team Directory
│   ├── users/[id]/page.tsx     # User detail with event history
│   └── settings/page.tsx       # Admin whitelist & semester config
├── (auth)/login/               # Login page
├── (user)/user/                # Member portal (protected)
│   ├── events/page.tsx         # Event catalog (upcoming/past)
│   ├── events/[id]/page.tsx    # Event detail + registration
│   ├── directory/page.tsx      # Member directory grid
│   ├── directory/[id]/page.tsx # Member profile view
│   ├── discover/page.tsx       # Discover events/content
│   └── settings/page.tsx       # Edit own profile & settings
├── actions/                    # Server actions (events.ts, email.ts, profile.ts)
└── api/                        # NextAuth routes + Resend webhook

components/
├── ui/                     # shadcn/ui components
├── admin/                  # Admin components, organized by domain:
│   ├── events/             # Event form, guest list, checkin, lottery, etc.
│   ├── email/              # Composer, audience picker, blast list/detail
│   ├── settings/           # Whitelist & semester managers
│   ├── users/              # Member search, user detail modal, users table
│   ├── admin-sidebar.tsx   # Shared sidebar (used in layout)
│   └── stat-card.tsx       # Shared dashboard stat card
├── user/                   # Member portal components (sidebar, event-card, profile-form)
└── auth/                   # Auth components

lib/
├── db/
│   ├── schema.ts           # Drizzle schema (users, events, registrations, lottery, email)
│   ├── queries.ts          # User/admin queries
│   ├── event-queries.ts    # Event, registration, lottery queries
│   └── email-queries.ts    # Email blast, recipient, audience queries
├── emails/                 # Email HTML templates (blast-template.ts)
├── types/                  # Shared TypeScript interfaces (event.ts, email.ts)
├── supabase/
│   ├── client.ts           # Browser Supabase client (anon key)
│   └── storage.ts          # Upload/delete helpers for event covers + profile images
├── gradients.ts            # Gradient generation/parsing for event covers
├── validations/            # Zod schemas (events.ts, email.ts, profile.ts)
└── utils.ts                # Utilities (cn helper)
```

## Database Tables

- `user`, `account`, `session`, `authenticator` — NextAuth tables
- `admin_whitelist` — Admin email whitelist
- `events` — Event details (status: open/closed/completed, lotteryStatus: draft/finalized)
- `event_registrations` — User registrations with status tracking
- `lottery_history` — Lottery draw outcomes and priority scores
- `semesters` — Academic semester tracking (auto-detected or admin override)
- `email_blasts` — Email campaigns (draft/sending/sent/failed, audience filters as JSON)
- `email_recipients` — Per-recipient delivery tracking (status via Resend webhooks)

## Key Patterns

**Auth check pattern:**

```typescript
const session = await auth();
if (!session?.user) redirect("/login");
if (!session.user.isAdmin) redirect("/user");
```

**Server actions pattern:**

```typescript
"use server";
const session = await auth();
if (!session?.user) throw new Error("Unauthorized");
// validate with Zod, mutate with Drizzle, revalidatePath
```

**Every exported function in a `'use server'` file is a public HTTP endpoint.** Always add auth checks, even for read-only functions like `getSemesterData()`. Admin mutations must check `session.user.isAdmin`.

**Type derivation:** Derive shared types from Drizzle schema (`$inferSelect`) rather than manually redeclaring field subsets. See `lib/types/event.ts` for the `RegistrationRow`/`RegistrationWithStats`/`Registration` pattern.

**Component styling:** Use `cn()` for conditional Tailwind classes.

**Server vs Client:** Pages are server components; interactive parts use `'use client'`.

**Auto-save before send:** When a client action (Send, Preview) triggers a server action that reads state from DB, always save current form state first. Otherwise the server uses stale data.

## Gotchas

- Supabase Storage RLS: client uses anon key, so policies must include `anon` role (not just `authenticated`). When creating new buckets or tables, always enable RLS and add explicit policies — Supabase disables RLS by default, which means public access to everything.
- Supabase Storage filenames: when filenames are derived from user data (e.g. userId), include a random token (`{userId}-{uuid}.ext`) to prevent other users from overwriting files via the anon key. For multi-step mutations (upload file + update DB), update the DB first — a broken DB reference is worse than an orphaned storage file.
- `redirect()` in server actions throws internally (NEXT_REDIRECT). Never wrap server action calls that use `redirect()` in try/catch — it catches the redirect as an error. If you need a toast + navigation after a mutation, skip `redirect()` in the action and use `router.push()` client-side instead.
- `pnpm db:push` may conflict when multiple worktrees target the same Supabase DB. For schema changes from a non-primary worktree, apply SQL directly via Supabase MCP (`apply_migration` or `execute_sql`).
- Mobile-first: most users access on mobile. Always test layouts in narrow viewports. When reusing components in constrained containers (Sheets, modals, popovers), pass a `compact` prop to adapt layout — don't assume the full-page grid will fit.
- Zsh glob: paths like `app/(admin)/` must be quoted in shell commands (`'app/(admin)/'`) or zsh interprets parens as glob patterns.
