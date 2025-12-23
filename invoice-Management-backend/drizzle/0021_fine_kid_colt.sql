ALTER TABLE "my-invoicees" RENAME COLUMN "document_path" TO "invoice_copy_path";--> statement-breakpoint
ALTER TABLE "my-invoicees" ADD COLUMN "proof_of_submission_path" varchar(255);--> statement-breakpoint
ALTER TABLE "my-invoicees" ADD COLUMN "supporting_docs_path" varchar(255);