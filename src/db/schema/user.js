const {
    pgTable,
    serial,
    varchar,
    text,
    timestamp,
    pgEnum,
} = require("drizzle-orm/pg-core");

const roleEnum = pgEnum("role", ["user", "admin"]);

const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    profile_image: text("profile_image"), // <-- ADD THIS
    role: roleEnum("role").notNull().default("user"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

module.exports = { users, roleEnum };