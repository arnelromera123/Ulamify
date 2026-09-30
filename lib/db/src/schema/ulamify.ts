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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  accent: text("accent").notNull().default("amber"),
  stockCount: integer("stock_count").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
});

export const storeProfileTable = pgTable("store_profile", {
  id: integer("id").primaryKey().default(1),
  name: text("name").notNull().default("Bayanihan Kitchen"),
  location: text("location").notNull().default("Makati"),
});

export const ulamifyDataMigrationsTable = pgTable("ulamify_data_migrations", {
  migrationKey: text("migration_key").primaryKey(),
  appliedAt: timestamp("applied_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
}, (table) => [uniqueIndex("orders_offline_id_unique").on(table.offlineId)]);

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

export const userRolesTable = pgTable("user_roles", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(),
  role: text("role")
    .notNull()
    .default("cashier")
    .references(() => userRolesTable.code),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const voidRequestsTable = pgTable("void_requests", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id),
  requestedByUserId: integer("requested_by_user_id").references(
    () => usersTable.id,
  ),
  approvedByUserId: integer("approved_by_user_id").references(
    () => usersTable.id,
  ),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  stockRestocked: boolean("stock_restocked").notNull().default(false),
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
export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export const insertUserRoleSchema = createInsertSchema(userRolesTable).omit({
  createdAt: true,
});
export const insertVoidRequestSchema = createInsertSchema(
  voidRequestsTable,
).omit({ id: true, createdAt: true });

export type Product = z.infer<typeof insertProductSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type OperationLog = typeof operationLogsTable.$inferSelect;
export type UserRole = typeof userRolesTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type VoidRequest = typeof voidRequestsTable.$inferSelect;