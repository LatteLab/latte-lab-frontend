# Latte Lab Frontend - TODO

## Overview
This document tracks outstanding tasks for the Latte Lab frontend application.

---

## 1. MIT Credentials & Authentication

- [ ] Contact MIT IT to obtain proper OAuth credentials for production
- [ ] Configure Google OAuth with MIT domain restrictions (`hd=mit.edu`)
- [ ] Set up proper redirect URIs for production environment
- [ ] Verify authentication flow works with MIT email accounts

---

## 2. Database Setup for User Directory

The current Team Directory uses fake data (`lib/fake-data.ts`). Need to set up proper database tables.

### Required Tables/Schema Updates

- [ ] Create `members` table with fields:
  - `id` (primary key)
  - `user_id` (foreign key to users table, nullable for non-registered members)
  - `name`
  - `email`
  - `phone`
  - `location`
  - `avatar_url`
  - `class_year`
  - `status` (active, inactive, unpaid)
  - `department`
  - `bio`
  - `join_date`
  - `created_at`
  - `updated_at`

- [ ] Create `member_events` table for attendance tracking:
  - `id`
  - `member_id`
  - `event_id`
  - `attended` (boolean)
  - `created_at`

- [ ] Create `events` table:
  - `id`
  - `name`
  - `date`
  - `description`
  - `created_at`

### Code Updates Required

- [ ] Create Drizzle schema definitions in `lib/db/schema.ts`
- [ ] Write database queries in `lib/db/queries.ts`
- [ ] Update `app/(admin)/admin/users/page.tsx` to fetch from database
- [ ] Update `app/(admin)/admin/users/[id]/page.tsx` to fetch from database
- [ ] Remove `lib/fake-data.ts` once database integration is complete

---

## 3. Data Migration - Latte Lab Members

Once database schema is finalized:

- [ ] Export current member data from existing spreadsheet
- [ ] Create migration script to transform spreadsheet data to database format
- [ ] Validate data integrity (emails, dates, required fields)
- [ ] Run migration in staging environment first
- [ ] Verify member data displays correctly in Team Directory
- [ ] Run migration in production

### Spreadsheet Fields to Map
- Name → `name`
- Email → `email`
- Phone → `phone`
- Class Year → `class_year`
- Department/Team → `department`
- Join Date → `join_date`
- Status → `status`
- (Additional fields TBD based on spreadsheet structure)

---

## Notes

- Current implementation uses 150 randomly generated fake users for UI development
- Admin whitelist functionality is already working and stored in `admin_whitelist` table
- Authentication is handled via NextAuth with Google OAuth provider
