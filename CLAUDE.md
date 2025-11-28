# CLAUDE.md - Project Context for Claude Code

> **IMPORTANT**: Claude must update this file whenever significant structural changes are made to the project (new routes, components, database schema changes, etc.)

## Project Overview

**Latte Lab Frontend** - A Next.js 16 web application for MIT's Latte Lab organization. Provides admin dashboard for managing members and a user portal for members.

## Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Authentication**: NextAuth v5 (Google OAuth, Resend magic links)
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **Package Manager**: pnpm

## Project Structure

```
latte-lab-frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page (redirects based on auth)
│   ├── (admin)/                  # Admin route group
│   │   ├── layout.tsx            # Admin layout with sidebar
│   │   └── admin/
│   │       ├── page.tsx          # Dashboard (stats, recent users)
│   │       ├── users/
│   │       │   ├── page.tsx      # Team Directory (fake data for now)
│   │       │   └── [id]/
│   │       │       └── page.tsx  # User detail page
│   │       └── settings/
│   │           └── page.tsx      # Admin settings (whitelist)
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx          # Login page
│   ├── (user)/
│   │   └── user/
│   │       └── page.tsx          # User portal
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts      # NextAuth API routes
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── page-header.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   └── tooltip.tsx
│   ├── admin/                    # Admin-specific components
│   │   ├── admin-sidebar.tsx     # Navigation sidebar
│   │   ├── stat-card.tsx         # Dashboard stat cards
│   │   ├── user-row.tsx          # User list row component
│   │   ├── users-table.tsx       # Users table (database users)
│   │   └── whitelist-manager.tsx # Admin whitelist CRUD
│   ├── auth/                     # Auth components
│   │   ├── magic-link-form.tsx
│   │   ├── oauth-buttons.tsx
│   │   └── sign-out-button.tsx
│   └── providers/
│       └── session-provider.tsx  # NextAuth session provider
├── lib/
│   ├── utils.ts                  # Utility functions (cn, etc.)
│   ├── fake-data.ts              # Temporary fake user data (150 users)
│   └── db/
│       ├── index.ts              # Database connection
│       ├── schema.ts             # Drizzle schema (users, accounts, adminWhitelist)
│       └── queries.ts            # Database query functions
├── app/actions/
│   └── admin.ts                  # Server actions for admin operations
├── types/
│   └── next-auth.d.ts            # NextAuth type extensions
├── hooks/
│   └── use-mobile.ts             # Mobile detection hook
├── docs/
│   └── TODO.md                   # Outstanding tasks
├── auth.ts                       # NextAuth configuration
├── proxy.ts                      # Auth proxy middleware
└── drizzle.config.ts             # Drizzle ORM config
```

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Landing, redirects to /admin or /user based on role |
| `/login` | Public | Authentication page |
| `/admin` | Protected | Admin dashboard with KPIs |
| `/admin/users` | Protected | Team Directory (search, filter) |
| `/admin/users/[id]` | Protected | Individual user details |
| `/admin/settings` | Protected | Admin whitelist management |
| `/user` | Protected | User portal |

## Authentication Flow

1. User logs in via Google OAuth (restricted to `mit.edu` domain)
2. NextAuth checks if email is in `admin_whitelist` table
3. `isAdmin` flag is set in JWT token and session
4. Route protection via server-side `auth()` checks

## Database Schema

### Current Tables (Drizzle)
- `users` - NextAuth managed user accounts
- `accounts` - OAuth provider accounts
- `verificationTokens` - Magic link tokens
- `adminWhitelist` - Admin email whitelist

### Pending Tables (see docs/TODO.md)
- `members` - Organization member profiles
- `events` - Organization events
- `member_events` - Event attendance tracking

## Key Patterns

### Server vs Client Components
- **Server**: Pages with data fetching, auth checks
- **Client**: Interactive components (`'use client'` directive)

### Admin Authorization
```typescript
const session = await auth();
if (!session?.user) redirect('/login');
if (!session.user.isAdmin) redirect('/user');
```

### Component Styling
- Uses `cn()` utility for conditional classes
- Tailwind CSS with CSS variables for theming
- shadcn/ui components as base

## Current Status

- **Team Directory**: Using fake data (`lib/fake-data.ts`) - 150 generated users
- **Database**: Only auth tables configured, member tables pending
- **Data Migration**: Spreadsheet data needs to be imported (see docs/TODO.md)

---

## Self-Update Instructions for Claude

**When to update this file:**
1. New routes are added or existing routes are modified
2. New components are created in `/components`
3. Database schema changes (`lib/db/schema.ts`)
4. New libraries or dependencies are added
5. Authentication flow changes
6. Project structure reorganization

**How to update:**
1. Modify the relevant section above
2. Update the directory tree if structure changed
3. Update the routes table if routes changed
4. Add any new patterns or conventions discovered
5. Commit with message: `docs: Update CLAUDE.md with [change description]`
