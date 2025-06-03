ALTER TABLE "inventory_updates" DROP CONSTRAINT "inventory_updates_method_check";--> statement-breakpoint
ALTER TABLE "undo_actions" DROP CONSTRAINT "undo_actions_method_check";--> statement-breakpoint
ALTER TABLE "inventory_updates" ADD CONSTRAINT "inventory_updates_method_check" CHECK (method = ANY (ARRAY['ui'::text, 'voice'::text, 'api'::text, 'undo'::text]));--> statement-breakpoint
ALTER TABLE "undo_actions" ADD CONSTRAINT "undo_actions_method_check" CHECK (method = ANY (ARRAY['ui'::text, 'voice'::text, 'api'::text, 'undo'::text]));