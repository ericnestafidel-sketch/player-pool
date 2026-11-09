ALTER TABLE "coaches" ADD COLUMN "conduct_version" text;--> statement-breakpoint
ALTER TABLE "coaches" ADD COLUMN "eligibility_attested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coaches" ADD COLUMN "safety_rules_agreed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "parents" ADD COLUMN "terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "parents" ADD COLUMN "terms_version" text;--> statement-breakpoint
UPDATE "players" SET "season" = replace("season", 'fall-winter', 'fall') WHERE "season" LIKE '%fall-winter%';--> statement-breakpoint
UPDATE "subscriptions" SET "season_code" = replace("season_code", 'fall-winter', 'fall') WHERE "season_code" LIKE '%fall-winter%';