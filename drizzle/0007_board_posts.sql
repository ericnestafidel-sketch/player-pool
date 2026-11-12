CREATE TABLE "board_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"team_name" text NOT NULL,
	"age_group" text NOT NULL,
	"positions" text[] NOT NULL,
	"skill_levels" text[] NOT NULL,
	"county" text NOT NULL,
	"state" text NOT NULL,
	"season_code" text,
	"needed_through" date,
	"notes" text,
	"closed_at" timestamp with time zone,
	"hidden_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_requests" ADD COLUMN "opened_by" text DEFAULT 'coach' NOT NULL;--> statement-breakpoint
ALTER TABLE "board_posts" ADD CONSTRAINT "board_posts_coach_id_coaches_user_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_reports" ADD CONSTRAINT "board_reports_post_id_board_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."board_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_reports" ADD CONSTRAINT "board_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_posts_open_idx" ON "board_posts" USING btree ("expires_at","coach_id");--> statement-breakpoint
CREATE INDEX "board_reports_post_idx" ON "board_reports" USING btree ("post_id","created_at");