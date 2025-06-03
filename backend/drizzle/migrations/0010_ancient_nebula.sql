CREATE TABLE "undo_actions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" text NOT NULL,
	"item_id" uuid NOT NULL,
	"item_name" text NOT NULL,
	"description" text NOT NULL,
	"previous_state" jsonb NOT NULL,
	"current_state" jsonb NOT NULL,
	"method" text DEFAULT 'ui' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "undo_actions_action_type_check" CHECK (action_type = ANY (ARRAY['inventory_update'::text, 'item_create'::text, 'item_delete'::text, 'bulk_update'::text])),
	CONSTRAINT "undo_actions_method_check" CHECK (method = ANY (ARRAY['ui'::text, 'voice'::text, 'api'::text]))
);
--> statement-breakpoint
ALTER TABLE "undo_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "undo_actions" ADD CONSTRAINT "undo_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "undo_actions" ADD CONSTRAINT "undo_actions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "undo_actions_user_id_idx" ON "undo_actions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "undo_actions_expires_at_idx" ON "undo_actions" USING btree ("expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "undo_actions_created_at_idx" ON "undo_actions" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE POLICY "Users can only access their own undo actions" ON "undo_actions" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = auth.uid());