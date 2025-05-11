ALTER TABLE "inventory_items" ALTER COLUMN "threshold" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "inventory_updates" ALTER COLUMN "previous_quantity" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "inventory_updates" ALTER COLUMN "previous_quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_updates" ALTER COLUMN "new_quantity" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "inventory_updates" ALTER COLUMN "new_quantity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_updates" ALTER COLUMN "quantity" SET DATA TYPE numeric(10, 2);