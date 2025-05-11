ALTER TABLE "inventory_items" ALTER COLUMN "quantity" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "quantity" SET DEFAULT '0';