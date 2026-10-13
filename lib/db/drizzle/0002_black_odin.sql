CREATE TABLE "auth_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"base_unit" text NOT NULL,
	"is_pantry_item" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory_lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity_received" numeric(14, 3) NOT NULL,
	"quantity_remaining" numeric(14, 3) NOT NULL,
	"unit_cost" numeric(12, 4) NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"supplier" text,
	"expense_log_id" integer,
	"recorded_by_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"ingredient_id" integer NOT NULL,
	"lot_id" integer,
	"movement_type" text NOT NULL,
	"quantity_delta" numeric(14, 3) NOT NULL,
	"unit_cost" numeric(12, 4) DEFAULT '0' NOT NULL,
	"production_log_id" integer,
	"notes" text,
	"recorded_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_run_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_run_id" integer NOT NULL,
	"ingredient_id" integer,
	"item_type" text NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" text NOT NULL,
	"base_cost" numeric(10, 2) NOT NULL,
	"allocated_delivery_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"landed_unit_cost" numeric(12, 4) NOT NULL,
	"inventory_lot_id" integer
);
--> statement-breakpoint
CREATE TABLE "market_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier" text,
	"total_items_cost" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"expense_log_id" integer,
	"notes" text,
	"recorded_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"current_price" numeric(10, 2) NOT NULL,
	"cost_per_serving" numeric(10, 2) NOT NULL,
	"pricing_method" text NOT NULL,
	"target_value" numeric(7, 4) NOT NULL,
	"proposed_price" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_by_user_id" integer NOT NULL,
	"reviewed_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_cost_profiles" (
	"product_id" integer PRIMARY KEY NOT NULL,
	"packaging_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"labor_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"overhead_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"ingredient_id" integer,
	"name" text NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" text NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operation_logs" ADD COLUMN "expense_category" text;--> statement-breakpoint
ALTER TABLE "operation_logs" ADD COLUMN "supplier" text;--> statement-breakpoint
ALTER TABLE "operation_logs" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "operation_logs" ADD COLUMN "recorded_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_expense_log_id_operation_logs_id_fk" FOREIGN KEY ("expense_log_id") REFERENCES "public"."operation_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_lot_id_inventory_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."inventory_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_production_log_id_operation_logs_id_fk" FOREIGN KEY ("production_log_id") REFERENCES "public"."operation_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_run_items" ADD CONSTRAINT "market_run_items_market_run_id_market_runs_id_fk" FOREIGN KEY ("market_run_id") REFERENCES "public"."market_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_run_items" ADD CONSTRAINT "market_run_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_run_items" ADD CONSTRAINT "market_run_items_inventory_lot_id_inventory_lots_id_fk" FOREIGN KEY ("inventory_lot_id") REFERENCES "public"."inventory_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_runs" ADD CONSTRAINT "market_runs_expense_log_id_operation_logs_id_fk" FOREIGN KEY ("expense_log_id") REFERENCES "public"."operation_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_runs" ADD CONSTRAINT "market_runs_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_proposals" ADD CONSTRAINT "price_proposals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_proposals" ADD CONSTRAINT "price_proposals_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_proposals" ADD CONSTRAINT "price_proposals_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_cost_profiles" ADD CONSTRAINT "product_cost_profiles_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_sessions_token_hash_unique" ON "auth_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "inventory_lots_fifo_idx" ON "inventory_lots" USING btree ("ingredient_id","purchased_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_lots_expense_log_unique" ON "inventory_lots" USING btree ("expense_log_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_ingredient_date_idx" ON "inventory_movements" USING btree ("ingredient_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_production_idx" ON "inventory_movements" USING btree ("production_log_id");--> statement-breakpoint
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;