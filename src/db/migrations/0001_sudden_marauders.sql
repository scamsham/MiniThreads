CREATE TYPE "public"."follow_status" AS ENUM('pending', 'accepted');--> statement-breakpoint
ALTER TABLE "follows" ADD COLUMN "status" "follow_status" DEFAULT 'accepted' NOT NULL;