ALTER TABLE "board_posts" ADD COLUMN "starts_on" date;
--> statement-breakpoint
ALTER TABLE "board_posts" ADD COLUMN "ends_on" date;
--> statement-breakpoint
ALTER TABLE "board_posts" ADD COLUMN "event_name" text;
--> statement-breakpoint
ALTER TABLE "board_posts" ADD COLUMN "players_needed" integer;
--> statement-breakpoint
ALTER TABLE "board_posts" ADD COLUMN "closes_on" date;
--> statement-breakpoint
UPDATE "board_posts"
SET "ends_on" = COALESCE("needed_through", ("expires_at" AT TIME ZONE 'America/Indiana/Indianapolis')::date)
WHERE "ends_on" IS NULL;
--> statement-breakpoint
UPDATE "board_posts" SET "starts_on" = "ends_on" WHERE "starts_on" IS NULL;
--> statement-breakpoint
UPDATE "board_posts" SET "closes_on" = "starts_on" - 1 WHERE "closes_on" IS NULL;
--> statement-breakpoint
UPDATE "board_posts" SET "players_needed" = 1 WHERE "players_needed" IS NULL;
--> statement-breakpoint
ALTER TABLE "board_posts" ALTER COLUMN "starts_on" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "board_posts" ALTER COLUMN "ends_on" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "board_posts" ALTER COLUMN "players_needed" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "board_posts" ALTER COLUMN "closes_on" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_dates_check" CHECK ("ends_on" >= "starts_on" AND "closes_on" <= "ends_on" AND "players_needed" >= 1);
