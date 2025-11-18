import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Admin whitelist table - stores approved admin emails
export const adminWhitelist = pgTable('admin_whitelist', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users table - synced with auth.users via trigger
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // References auth.users.id
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type AdminWhitelist = typeof adminWhitelist.$inferSelect;
export type NewAdminWhitelist = typeof adminWhitelist.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
