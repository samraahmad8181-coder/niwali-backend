const {
    pgTable,
    serial,
    varchar,
    text,
    numeric,
    boolean,
    integer,
    jsonb,
    timestamp,
} = require("drizzle-orm/pg-core");
const { categories } = require("./categories");

const products = pgTable("products", {
    id: serial("id").primaryKey(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),

    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    original_price: numeric("original_price", { precision: 10, scale: 2 }),

    sale: boolean("sale").notNull().default(false),
    stock: integer("stock").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default("active"),

    category_id: integer("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "cascade" }),

    main_image: text("main_image").notNull(),
    thumbnail_images: text("thumbnail_images").array().notNull().default([]),

    benefits: jsonb("benefits"),

    // New field to store total order count
    order_count: integer("order_count").notNull().default(0),

    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

module.exports = { products };