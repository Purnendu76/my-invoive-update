-- -- Convert enum columns to text so we can normalize bad/typo values first
-- ALTER TABLE "my-invoicees" ALTER COLUMN "project" SET DATA TYPE text;--> statement-breakpoint
-- ALTER TABLE "users_auth" ALTER COLUMN "project_role" SET DATA TYPE text;--> statement-breakpoint

-- -- Remove trailing/leading spaces and normalize 'Bharat Net' variants
-- UPDATE "my-invoicees" SET project = TRIM(project) WHERE project ILIKE '%bharat net%';--> statement-breakpoint
-- UPDATE "users_auth" SET project_role = TRIM(project_role) WHERE project_role ILIKE '%bharat net%';--> statement-breakpoint

-- -- Drop and recreate the enum with the exact labels you use in code (case & spacing matter)
-- DROP TYPE IF EXISTS "public"."my-project";--> statement-breakpoint
-- CREATE TYPE "public"."my-project" AS ENUM('NFS', 'GAIL', 'BGCL', 'STP', 'Bharat Net', 'NFS AMC');--> statement-breakpoint

-- -- Cast the text columns back to the enum type (safe now that values match the enum)
-- ALTER TABLE "my-invoicees" ALTER COLUMN "project" SET DATA TYPE "public"."my-project" USING project::"public"."my-project";--> statement-breakpoint
-- ALTER TABLE "users_auth" ALTER COLUMN "project_role" SET DATA TYPE "public"."my-project" USING project_role::"public"."my-project";--> statement-breakpoint