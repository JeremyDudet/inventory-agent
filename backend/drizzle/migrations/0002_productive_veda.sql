ALTER TABLE "inventory_items" RENAME COLUMN "locationId" TO "location_id";--> statement-breakpoint
ALTER TABLE "inventory_items" RENAME COLUMN "lastUpdated" TO "last_updated";--> statement-breakpoint
ALTER TABLE "inventory_items" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "inventory_items" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "inventory_updates" RENAME COLUMN "itemId" TO "item_id";--> statement-breakpoint
ALTER TABLE "inventory_updates" RENAME COLUMN "previousQuantity" TO "previous_quantity";--> statement-breakpoint
ALTER TABLE "inventory_updates" RENAME COLUMN "newQuantity" TO "new_quantity";--> statement-breakpoint
ALTER TABLE "inventory_updates" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "inventory_updates" RENAME COLUMN "userName" TO "user_name";--> statement-breakpoint
ALTER TABLE "inventory_updates" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "locations" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "locations" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_locations" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "user_locations" RENAME COLUMN "locationId" TO "location_id";--> statement-breakpoint
ALTER TABLE "user_locations" RENAME COLUMN "roleId" TO "role_id";--> statement-breakpoint
ALTER TABLE "user_locations" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_roles" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "user_roles" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_locationId_name_key";--> statement-breakpoint
ALTER TABLE "inventory_items" DROP CONSTRAINT "inventory_items_locationId_fkey";
--> statement-breakpoint
ALTER TABLE "inventory_updates" DROP CONSTRAINT "inventory_updates_itemId_fkey";
--> statement-breakpoint
ALTER TABLE "user_locations" DROP CONSTRAINT "user_locations_userId_fkey";
--> statement-breakpoint
ALTER TABLE "user_locations" DROP CONSTRAINT "user_locations_locationId_fkey";
--> statement-breakpoint
ALTER TABLE "user_locations" DROP CONSTRAINT "user_locations_roleId_fkey";
--> statement-breakpoint
ALTER TABLE "user_locations" DROP CONSTRAINT "user_locations_userId_locationId_pk";--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_location_id_pk" PRIMARY KEY("user_id","location_id");--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_updates" ADD CONSTRAINT "inventory_updates_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_location_id_name_key" UNIQUE("location_id","name");--> statement-breakpoint
ALTER POLICY "Allow access based on user locations" ON "inventory_items" TO authenticated USING (EXISTS (
        SELECT 1 
        FROM user_locations 
        WHERE user_locations.location_id = inventory_items.location_id 
        AND user_locations.user_id = auth.uid()
      ));--> statement-breakpoint
ALTER POLICY "Allow insert based on user role per location" ON "inventory_updates" TO authenticated WITH CHECK (EXISTS (
        SELECT 1
        FROM inventory_items ii
        JOIN user_locations ul ON ii.location_id = ul.location_id
        JOIN user_roles ur ON ul.role_id = ur.id
        WHERE ii.id = inventory_updates.item_id
          AND ul.user_id = auth.uid()
          AND ur.name IN ('owner', 'team-member')
      ));--> statement-breakpoint
ALTER POLICY "Allow select based on user role per location" ON "inventory_updates" TO authenticated USING (EXISTS (
        SELECT 1
        FROM inventory_items ii
        JOIN user_locations ul ON ii.location_id = ul.location_id
        JOIN user_roles ur ON ul.role_id = ur.id
        WHERE ii.id = inventory_updates.item_id
          AND ul.user_id = auth.uid()
          AND ur.name IN ('owner', 'team-member')
      ));