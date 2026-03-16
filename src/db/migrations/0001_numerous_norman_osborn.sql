CREATE TYPE "public"."roast_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'c' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'cpp' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'cs' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'php' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'json' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'markdown' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'yaml' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'shell' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'ruby' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'kotlin' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."language" ADD VALUE 'swift' BEFORE 'other';--> statement-breakpoint
ALTER TABLE "roasts" ALTER COLUMN "score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ALTER COLUMN "verdict" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ALTER COLUMN "roast_quote" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ADD COLUMN "status" "roast_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "roasts" ADD COLUMN "ip" text;