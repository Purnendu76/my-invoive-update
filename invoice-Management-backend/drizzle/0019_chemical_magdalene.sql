CREATE TABLE "gst_percentages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"percent" numeric NOT NULL,
	"label" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_modes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "project_modes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"mode_id" uuid NOT NULL,
	"state_id" uuid NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "projects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "states_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "my-invoicees" ALTER COLUMN "project" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "users_auth" ALTER COLUMN "project_role" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "my-invoicees" ADD COLUMN "gst_percentage_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_mode_id_project_modes_id_fk" FOREIGN KEY ("mode_id") REFERENCES "public"."project_modes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my-invoicees" ADD CONSTRAINT "my-invoicees_project_projects_id_fk" FOREIGN KEY ("project") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my-invoicees" ADD CONSTRAINT "my-invoicees_gst_percentage_id_gst_percentages_id_fk" FOREIGN KEY ("gst_percentage_id") REFERENCES "public"."gst_percentages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_auth" ADD CONSTRAINT "users_auth_project_role_projects_id_fk" FOREIGN KEY ("project_role") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "my-invoicees" DROP COLUMN "mode_of_project";--> statement-breakpoint
ALTER TABLE "my-invoicees" DROP COLUMN "state";--> statement-breakpoint
ALTER TABLE "my-invoicees" DROP COLUMN "gst_percentage";--> statement-breakpoint
DROP TYPE "public"."gst_percentage";--> statement-breakpoint
DROP TYPE "public"."mode_of_projecte";--> statement-breakpoint
DROP TYPE "public"."my-project";--> statement-breakpoint
DROP TYPE "public"."states";