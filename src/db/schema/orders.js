import { pgTable, serial, varchar, text, boolean, decimal, timestamp } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
    id: serial("id").primaryKey(),
    trackId: varchar("track_id", { length: 20 }).notNull().unique(),
    firstname: varchar("firstname", { length: 100 }).notNull(),
    lastname: varchar("lastname", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    address: text("address").notNull(),
    apartment: varchar("apartment", { length: 100 }),
    cashOnDelivery: boolean("cash_on_delivery").default(true),
    status: varchar("status", { length: 50 }).default("Pending"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});