-- Add method field to inventory_updates table
ALTER TABLE "inventory_updates" ADD COLUMN "method" text DEFAULT 'ui';

-- Add constraint to validate method values
ALTER TABLE "inventory_updates" ADD CONSTRAINT "inventory_updates_method_check" CHECK (method = ANY (ARRAY['ui'::text, 'voice'::text, 'api'::text])); 