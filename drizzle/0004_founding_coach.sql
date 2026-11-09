ALTER TABLE "coaches" ALTER COLUMN "verify_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "coaches" ADD COLUMN "proof_kind" text;--> statement-breakpoint
ALTER TABLE "coaches" ADD COLUMN "call_requested" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coaches" ADD COLUMN "founding_coach" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "coaches" ADD COLUMN "founding_number" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "coaches_founding_number_unique" ON "coaches" USING btree ("founding_number");