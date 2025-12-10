ALTER TYPE "public"."gst_percentage" ADD VALUE '0' BEFORE '5%';--> statement-breakpoint
ALTER TABLE "my-invoicees" ADD COLUMN "document_path" varchar(255);