CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "categories_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"locationId" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" numeric DEFAULT '0' NOT NULL,
	"unit" text NOT NULL,
	"category" text NOT NULL,
	"threshold" numeric,
	"lastUpdated" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"embedding" vector(1536),
	"description" text,
	CONSTRAINT "inventory_items_locationId_name_key" UNIQUE("locationId","name")
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inventory_updates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"itemId" uuid NOT NULL,
	"action" text NOT NULL,
	"previousQuantity" numeric NOT NULL,
	"newQuantity" numeric NOT NULL,
	"quantity" numeric NOT NULL,
	"unit" text NOT NULL,
	"userId" uuid,
	"userName" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_updates_action_check" CHECK (action = ANY (ARRAY['add'::text, 'remove'::text, 'set'::text, 'check'::text]))
);
--> statement-breakpoint
ALTER TABLE "inventory_updates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"image" text,
	"created_at" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text),
	"updated_at" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'::text)
);
--> statement-breakpoint
CREATE TABLE "session_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"type" text NOT NULL,
	"text" text NOT NULL,
	"action" text,
	"status" text,
	"is_final" boolean,
	"confidence" double precision,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "session_logs_status_check" CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text, 'info'::text])),
	CONSTRAINT "session_logs_type_check" CHECK (type = ANY (ARRAY['transcript'::text, 'action'::text]))
);
--> statement-breakpoint
ALTER TABLE "session_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_locations" (
	"userId" uuid NOT NULL,
	"locationId" uuid NOT NULL,
	"roleId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_locations_userId_locationId_pk" PRIMARY KEY("userId","locationId")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_updates" ADD CONSTRAINT "inventory_updates_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."user_roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_logs_session_id_idx" ON "session_logs" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "session_logs_timestamp_idx" ON "session_logs" USING btree ("timestamp" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "session_logs_type_idx" ON "session_logs" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "session_logs_user_id_idx" ON "session_logs" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "Allow access based on user locations" ON "inventory_items" AS PERMISSIVE FOR ALL TO "authenticated" USING (EXISTS (
        SELECT 1 
        FROM user_locations 
        WHERE user_locations.locationId = inventory_items.locationId 
        AND user_locations.userId = auth.uid()
      ));--> statement-breakpoint
CREATE POLICY "Allow insert based on user role per location" ON "inventory_updates" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (EXISTS (
        SELECT 1
        FROM inventory_items ii
        JOIN user_locations ul ON ii.locationId = ul.locationId
        JOIN user_roles ur ON ul.roleId = ur.id
        WHERE ii.id = inventory_updates.itemId
          AND ul.userId = auth.uid()
          AND ur.name IN ('owner', 'team-member')
      ));--> statement-breakpoint
CREATE POLICY "Allow select based on user role per location" ON "inventory_updates" AS PERMISSIVE FOR SELECT TO "authenticated" USING (EXISTS (
        SELECT 1
        FROM inventory_items ii
        JOIN user_locations ul ON ii.locationId = ul.locationId
        JOIN user_roles ur ON ul.roleId = ur.id
        WHERE ii.id = inventory_updates.itemId
          AND ul.userId = auth.uid()
          AND ur.name IN ('owner', 'team-member')
      ));--> statement-breakpoint
CREATE POLICY "Users can view their own session logs" ON "session_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR ((auth.jwt() ? 'user_role'::text) AND (((auth.jwt() ->> 'user_role'::text) = 'manager'::text) OR ((auth.jwt() ->> 'user_role'::text) = 'owner'::text)))));--> statement-breakpoint
CREATE POLICY "Allow authenticated users to insert logs" ON "session_logs" AS PERMISSIVE FOR INSERT TO "authenticated";