# CLAUDE.md

Latte Lab Frontend - Next.js app for MIT's Latte Lab organization management.

## Tech Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- Auth: NextAuth v5 (Google OAuth restricted to `mit.edu`)
- Database: PostgreSQL (Supabase) + Drizzle ORM
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
├── (admin)/admin/          # Admin section (protected)
│   ├── page.tsx            # Dashboard
│   ├── users/page.tsx      # Team Directory
│   ├── users/[id]/page.tsx # User detail
│   └── settings/page.tsx   # Admin whitelist
├── (auth)/login/           # Login page
├── (user)/user/            # User portal (protected)
└── api/auth/               # NextAuth routes

components/
├── ui/                     # shadcn/ui components
├── admin/                  # Admin components (sidebar, user-row, etc.)
└── auth/                   # Auth components

lib/
├── db/                     # Drizzle schema + queries
├── fake-data.ts            # Temporary mock data (150 users)
└── utils.ts                # Utilities (cn helper)
```

## Key Patterns

**Auth check pattern:**
```typescript
const session = await auth();
if (!session?.user) redirect('/login');
if (!session.user.isAdmin) redirect('/user');
```

**Component styling:** Use `cn()` for conditional Tailwind classes.

**Server vs Client:** Pages are server components; interactive parts use `'use client'`.

## Current Status

- Team Directory uses fake data (`lib/fake-data.ts`) - database tables pending
- See `docs/TODO.md` for outstanding tasks (MIT credentials, schema, data migration)
