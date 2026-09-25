import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const session = pgTable('session', {
    id: serial('id').primaryKey(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});