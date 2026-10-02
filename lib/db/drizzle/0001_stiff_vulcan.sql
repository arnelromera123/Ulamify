CREATE TABLE "store_profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text DEFAULT 'Bayanihan Kitchen' NOT NULL,
	"location" text DEFAULT 'Makati' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ulamify_data_migrations" (
	"migration_key" text PRIMARY KEY NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;