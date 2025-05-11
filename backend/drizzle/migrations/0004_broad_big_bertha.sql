ALTER TABLE "inventory_items" ALTER COLUMN "quantity" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "quantity" DROP NOT NULL;