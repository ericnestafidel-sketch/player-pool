ALTER TABLE "founder_claims" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "founder_slots" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "founder_claims" CASCADE;--> statement-breakpoint
DROP TABLE "founder_slots" CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "founder" TO "promo_free_season";--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_session_unique" ON "subscriptions" USING btree ("stripe_session_id");--> statement-breakpoint
ALTER TABLE "parents" DROP COLUMN "founder";