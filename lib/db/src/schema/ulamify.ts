import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  accent: text("accent").notNull().default("amber"),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  cashTendered: numeric("cash_tendered", { precision: 10, scale: 2 }),
  changeAmount: numeric("change_amount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("completed"),
  offlineId: text("offline_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const operationLogsTable = pgTable("operation_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  details: text("details").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  servings: integer("servings"),
  productId: integer("product_id").references(() => productsTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
});
export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
});
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({
  id: true,
});
export const insertOperationLogSchema = createInsertSchema(
  operationLogsTable,
).omit({ id: true, createdAt: true });

export type Product = z.infer<typeof insertProductSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type OperationLog = typeof operationLogsTable.$inferSelect;