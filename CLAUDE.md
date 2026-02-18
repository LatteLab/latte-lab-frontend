# CLAUDE.md

Latte Lab Frontend - Next.js app for MIT's Latte Lab organization management.

## Tech Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- Auth: NextAuth v5 (Google OAuth restricted to `mit.edu`)
- Database: PostgreSQL (Supabase) + Drizzle ORM
- Storage: Supabase Storage (`event-covers` bucket) via `lib/supabase/client.ts`
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
│   ├── events/page.tsx         # Event management list
│   ├── events/new/page.tsx     # Create event
│   ├── events/[id]/page.tsx    # Event detail (registrations, lottery, edit)
│   ├── events/[id]/checkin/    # Mobile check-in mode
│   ├── users/page.tsx          # Team Directory
│   ├── users/[id]/page.tsx     # User detail with event history
│   └── settings/page.tsx       # Admin whitelist
├── (auth)/login/               # Login page
├── (user)/user/                # Member portal (protected)
│   ├── events/page.tsx         # Event catalog (upcoming/past)
│   ├── events/[id]/page.tsx    # Event detail + registration
│   ├── directory/page.tsx      # Member directory grid
│   ├── directory/[id]/page.tsx # Member profile view
│   └── profile/page.tsx        # Edit own profile
├── actions/                    # Server actions (events.ts, profile.ts)
└── api/auth/                   # NextAuth routes

components/
├── ui/                     # shadcn/ui components
├── admin/                  # Admin components (sidebar, event-form, checkin, lottery)
├── user/                   # Member portal components (sidebar, event-card, profile-form)
└── auth/                   # Auth components

lib/
├── db/
│   ├── schema.ts           # Drizzle schema (users, events, registrations, lottery)
│   ├── queries.ts          # User/admin queries
│   └── event-queries.ts    # Event, registration, lottery queries
├── supabase/
│   ├── client.ts           # Browser Supabase client (anon key)
│   └── storage.ts          # Upload/delete helpers for event covers
├── gradients.ts            # Gradient generation/parsing for event covers
├── validations/            # Zod schemas (events.ts, profile.ts)
└── utils.ts                # Utilities (cn helper)
```

## Database Tables

- `user`, `account`, `session`, `authenticator` — NextAuth tables
- `admin_whitelist` — Admin email whitelist
- `events` — Event details (type: waitlist/lottery, status: draft/published/closed)
- `event_registrations` — User registrations with status tracking
- `lottery_history` — Lottery draw outcomes and priority scores

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

**Component styling:** Use `cn()` for conditional Tailwind classes.

**Server vs Client:** Pages are server components; interactive parts use `'use client'`.

## Gotchas

- Supabase Storage RLS: client uses anon key, so policies must include `anon` role (not just `authenticated`)
