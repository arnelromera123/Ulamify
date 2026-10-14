CREATE TABLE "day_closings" (
	"business_date" text PRIMARY KEY NOT NULL,
	"opening_cash" numeric(10, 2) NOT NULL,
	"cash_sales" numeric(10, 2) NOT NULL,
	"gcash_sales" numeric(10, 2) NOT NULL,
	"maya_sales" numeric(10, 2) NOT NULL,
	"expected_cash" numeric(10, 2) NOT NULL,
	"counted_cash" numeric(10, 2) NOT NULL,
	"variance" numeric(10, 2) NOT NULL,
	"note" text,
	"closed_by_user_id" integer,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "day_closings" ADD CONSTRAINT "day_closings_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;