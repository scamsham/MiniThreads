CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deactivated', 'shadowbanned');--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"username" varchar(32) NOT NULL,
	"name" varchar(32) NOT NULL,
	"email" varchar(64) NOT NULL,
	"password_hash" text,
	"address" text,
	"country" varchar(32),
	"is_private" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"bio" varchar(240),
	"display_picture_url" text DEFAULT '',
	"accountStatus" "account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "emaid_idx" ON "users" USING btree ("email");