ALTER TABLE "players" ADD COLUMN "skill_levels" text[];--> statement-breakpoint
UPDATE "players" SET "skill_levels" = ARRAY["skill_level"] WHERE "skill_level" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "players" ALTER COLUMN "skill_levels" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "players" DROP COLUMN "skill_level";
