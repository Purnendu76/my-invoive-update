ALTER TABLE "my-invoicees" ALTER COLUMN "gst_percentage" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."gst_percentage";--> statement-breakpoint
CREATE TYPE "public"."gst_percentage" AS ENUM('0%', '5%', '12%', '18%');--> statement-breakpoint
ALTER TABLE "my-invoicees" ALTER COLUMN "gst_percentage" SET DATA TYPE "public"."gst_percentage" USING "gst_percentage"::"public"."gst_percentage";