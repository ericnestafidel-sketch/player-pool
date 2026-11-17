CREATE TABLE "need_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "need_alerts" ADD CONSTRAINT "need_alerts_parent_id_parents_user_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("user_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "need_alerts" ADD CONSTRAINT "need_alerts_post_id_board_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."board_posts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "need_alerts_parent_post_unique" ON "need_alerts" USING btree ("parent_id","post_id");
--> statement-breakpoint
CREATE INDEX "need_alerts_parent_idx" ON "need_alerts" USING btree ("parent_id","created_at");
