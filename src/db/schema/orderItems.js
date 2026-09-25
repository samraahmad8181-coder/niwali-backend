import { pgTable, serial, integer } from "drizzle-orm/pg-core";
import { orders } from "./orders.js";
import { products } from "./products.js";

export const orderItems = pgTable("order_items", {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
});