CREATE TYPE "public"."availability_state" AS ENUM('avail', 'busy');--> statement-breakpoint
CREATE TYPE "public"."coach_status" AS ENUM('pending', 'approved', 'denied', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."contact_request_status" AS ENUM('sent', 'closed');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('season', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('full', 'pickup', 'not');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('parent', 'coach', 'admin');--> statement-breakpoint
CREATE TABLE "availability_weekends" (
	"player_id" uuid NOT NULL,
	"weekend_start" date NOT NULL,
	"state" "availability_state" NOT NULL,
	CONSTRAINT "availability_weekends_player_id_weekend_start_pk" PRIMARY KEY("player_id","weekend_start")
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"parent_id" text NOT NULL,
	"coach_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_parent_id_coach_id_pk" PRIMARY KEY("parent_id","coach_id")
);
--> statement-breakpoint
CREATE TABLE "coach_notes" (
	"coach_id" text NOT NULL,
	"player_id" uuid NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coach_notes_coach_id_player_id_pk" PRIMARY KEY("coach_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "coach_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"team_org" text NOT NULL,
	"contact" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaches" (
	"user_id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"team_name" text NOT NULL,
	"organization" text NOT NULL,
	"ages_coached" text NOT NULL,
	"years_experience" integer,
	"state" text NOT NULL,
	"county" text NOT NULL,
	"verify_url" text NOT NULL,
	"use_note" text NOT NULL,
	"status" "coach_status" DEFAULT 'pending' NOT NULL,
	"status_reason" text,
	"conduct_agreed_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by" text,
	"daily_contact_count" integer DEFAULT 0 NOT NULL,
	"contact_count_reset_at" timestamp with time zone,
	"checklist_team_page" boolean DEFAULT false NOT NULL,
	"checklist_org" boolean DEFAULT false NOT NULL,
	"checklist_conduct" boolean DEFAULT false NOT NULL,
	"info_request_note" text,
	"info_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"coach_id" text NOT NULL,
	"weekend" date,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "contact_request_status" DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" text NOT NULL,
	"subscription_id" uuid,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_slots" (
	"id" integer PRIMARY KEY NOT NULL,
	"claimed_count" integer DEFAULT 0 NOT NULL,
	"cap" integer DEFAULT 25 NOT NULL,
	CONSTRAINT "founder_slots_singleton" CHECK ("founder_slots"."id" = 1),
	CONSTRAINT "founder_slots_cap" CHECK ("founder_slots"."cap" = 25),
	CONSTRAINT "founder_slots_count" CHECK ("founder_slots"."claimed_count" >= 0 AND "founder_slots"."claimed_count" <= "founder_slots"."cap")
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parents" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"founder" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"player_id" uuid PRIMARY KEY NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_number" integer GENERATED ALWAYS AS IDENTITY (sequence name "player_public_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 100 CACHE 1),
	"parent_id" text NOT NULL,
	"sport" text DEFAULT 'baseball' NOT NULL,
	"birth_year" integer NOT NULL,
	"age_group" text NOT NULL,
	"positions" text[] NOT NULL,
	"skill_level" text NOT NULL,
	"state" text NOT NULL,
	"county" text NOT NULL,
	"status" "player_status" NOT NULL,
	"travel_miles" integer,
	"season" text,
	"note" text,
	"paused" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"highlight_uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"coach_id" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_parent_id" text NOT NULL,
	"coach_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"slug" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"age_labels" text[] NOT NULL,
	"level_labels" text[] NOT NULL,
	"position_labels" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" text NOT NULL,
	"player_id" uuid NOT NULL,
	"plan" "plan_type" NOT NULL,
	"season_code" text,
	"year" integer,
	"amount_cents" integer NOT NULL,
	"founder" boolean DEFAULT false NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent" text,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"viewed_by_coach" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"role" "user_role" NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_weekends" ADD CONSTRAINT "availability_weekends_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parent_id_parents_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_notes" ADD CONSTRAINT "coach_notes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_references" ADD CONSTRAINT "coach_references_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founder_claims" ADD CONSTRAINT "founder_claims_parent_id_parents_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founder_claims" ADD CONSTRAINT "founder_claims_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parents" ADD CONSTRAINT "parents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_parent_id_parents_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_sport_sports_slug_fk" FOREIGN KEY ("sport") REFERENCES "public"."sports"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_parent_id_parents_user_id_fk" FOREIGN KEY ("reporter_parent_id") REFERENCES "public"."parents"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_parent_id_parents_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coaches_status_idx" ON "coaches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contact_requests_coach_day_idx" ON "contact_requests" USING btree ("coach_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "founder_claims_parent_unique" ON "founder_claims" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "players_public_number_unique" ON "players" USING btree ("public_number");--> statement-breakpoint
CREATE INDEX "players_parent_idx" ON "players" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "players_visible_idx" ON "players" USING btree ("sport","state","county","age_group","status") WHERE "players"."paused" = false AND "players"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "profile_views_player_idx" ON "profile_views" USING btree ("player_id","viewed_at");--> statement-breakpoint
CREATE INDEX "profile_views_coach_idx" ON "profile_views" USING btree ("coach_id","viewed_at");--> statement-breakpoint
CREATE INDEX "reports_coach_idx" ON "reports" USING btree ("coach_id","created_at");--> statement-breakpoint
CREATE INDEX "subscriptions_player_expires_idx" ON "subscriptions" USING btree ("player_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
INSERT INTO "sports" ("slug", "label", "age_labels", "level_labels", "position_labels") VALUES (
  'baseball',
  'Baseball',
  ARRAY['8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U'],
  ARRAY['Major','AAA','AA','A','Rec / developing'],
  ARRAY['Pitcher','Catcher','First base','Second base','Shortstop','Third base','Left field','Center field','Right field','Utility']
);--> statement-breakpoint
INSERT INTO "founder_slots" ("id", "claimed_count", "cap") VALUES (1, 0, 25);