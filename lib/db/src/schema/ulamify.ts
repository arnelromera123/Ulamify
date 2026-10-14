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
  index,
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
  recordedByUserId: integer("recorded_by_user_id").references(() => usersTable.id),
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

export const dayClosingsTable = pgTable("day_closings", {
  businessDate: text("business_date").primaryKey(),
  openingCash: numeric("opening_cash", { precision: 10, scale: 2 }).notNull(),
  cashPaidOut: numeric("cash_paid_out", { precision: 10, scale: 2 }).notNull().default("0"),
  cashSales: numeric("cash_sales", { precision: 10, scale: 2 }).notNull(),
  gcashSales: numeric("gcash_sales", { precision: 10, scale: 2 }).notNull(),
  mayaSales: numeric("maya_sales", { precision: 10, scale: 2 }).notNull(),
  expectedCash: numeric("expected_cash", { precision: 10, scale: 2 }).notNull(),
  countedCash: numeric("counted_cash", { precision: 10, scale: 2 }).notNull(),
  variance: numeric("variance", { precision: 10, scale: 2 }).notNull(),
  note: text("note"),
  closedByUserId: integer("closed_by_user_id").references(() => usersTable.id),
  closedAt: timestamp("closed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const operationLogsTable = pgTable("operation_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  details: text("details").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  servings: integer("servings"),
  productId: integer("product_id").references(() => productsTable.id),
  expenseCategory: text("expense_category"),
  supplier: text("supplier"),
  notes: text("notes"),
  recordedByUserId: integer("recorded_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const productCostProfilesTable = pgTable("product_cost_profiles", {
  productId: integer("product_id")
    .primaryKey()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  packagingCost: numeric("packaging_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  overheadCost: numeric("overhead_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ingredientsTable = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  baseUnit: text("base_unit").notNull(),
  isPantryItem: boolean("is_pantry_item").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const recipeIngredientsTable = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").references(() => ingredientsTable.id),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
});

export const inventoryLotsTable = pgTable(
  "inventory_lots",
  {
    id: serial("id").primaryKey(),
    ingredientId: integer("ingredient_id")
      .notNull()
      .references(() => ingredientsTable.id),
    quantityReceived: numeric("quantity_received", { precision: 14, scale: 3 }).notNull(),
    quantityRemaining: numeric("quantity_remaining", { precision: 14, scale: 3 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 12, scale: 4 }).notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    supplier: text("supplier"),
    expenseLogId: integer("expense_log_id").references(() => operationLogsTable.id),
    recordedByUserId: integer("recorded_by_user_id").references(() => usersTable.id),
  },
  (table) => [
    index("inventory_lots_fifo_idx").on(table.ingredientId, table.purchasedAt, table.id),
    uniqueIndex("inventory_lots_expense_log_unique").on(table.expenseLogId),
  ],
);

export const inventoryMovementsTable = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    ingredientId: integer("ingredient_id")
      .notNull()
      .references(() => ingredientsTable.id),
    lotId: integer("lot_id").references(() => inventoryLotsTable.id),
    movementType: text("movement_type").notNull(),
    quantityDelta: numeric("quantity_delta", { precision: 14, scale: 3 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 12, scale: 4 }).notNull().default("0"),
    productionLogId: integer("production_log_id").references(() => operationLogsTable.id),
    notes: text("notes"),
    recordedByUserId: integer("recorded_by_user_id").references(() => usersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("inventory_movements_ingredient_date_idx").on(table.ingredientId, table.createdAt),
    index("inventory_movements_production_idx").on(table.productionLogId),
  ],
);

export const priceProposalsTable = pgTable("price_proposals", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => productsTable.id, { onDelete: "cascade" }),
  currentPrice: numeric("current_price", { precision: 10, scale: 2 }).notNull(),
  costPerServing: numeric("cost_per_serving", { precision: 10, scale: 2 }).notNull(),
  pricingMethod: text("pricing_method").notNull(),
  targetValue: numeric("target_value", { precision: 7, scale: 4 }).notNull(),
  proposedPrice: numeric("proposed_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  submittedByUserId: integer("submitted_by_user_id")
    .notNull()
    .references(() => usersTable.id),
  reviewedByUserId: integer("reviewed_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
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

export const authSessionsTable = pgTable(
  "auth_sessions",
  {
    id: serial("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash)],
);

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

export const marketRunsTable = pgTable("market_runs", {
  id: serial("id").primaryKey(),
  supplier: text("supplier"),
  totalItemsCost: numeric("total_items_cost", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  expenseLogId: integer("expense_log_id").references(() => operationLogsTable.id),
  notes: text("notes"),
  recordedByUserId: integer("recorded_by_user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketRunItemsTable = pgTable("market_run_items", {
  id: serial("id").primaryKey(),
  marketRunId: integer("market_run_id")
    .notNull()
    .references(() => marketRunsTable.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").references(() => ingredientsTable.id),
  itemType: text("item_type").notNull(),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull(),
  baseCost: numeric("base_cost", { precision: 10, scale: 2 }).notNull(),
  allocatedDeliveryCost: numeric("allocated_delivery_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  landedUnitCost: numeric("landed_unit_cost", { precision: 12, scale: 4 }).notNull(),
  inventoryLotId: integer("inventory_lot_id").references(() => inventoryLotsTable.id),
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
export const insertMarketRunSchema = createInsertSchema(
  marketRunsTable,
).omit({ id: true, createdAt: true });
export const insertMarketRunItemSchema = createInsertSchema(
  marketRunItemsTable,
).omit({ id: true });

export type Product = z.infer<typeof insertProductSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
export type OperationLog = typeof operationLogsTable.$inferSelect;
export type UserRole = typeof userRolesTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type VoidRequest = typeof voidRequestsTable.$inferSelect;
export type MarketRun = typeof marketRunsTable.$inferSelect;
export type MarketRunItem = typeof marketRunItemsTable.$inferSelect;
