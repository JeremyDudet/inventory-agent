// backend/db/schema.ts
import {
  pgTable,
  index,
  pgPolicy,
  check,
  uuid,
  text,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
  unique,
  vector,
  foreignKey,
  primaryKey,
  decimal,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const categories = pgTable(
  "categories",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: text().notNull(),
  },
  (table) => [unique("categories_name_key").on(table.name)]
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(),
  name: text(),
  email: text(),
  image: text(),
  created_at: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`(now() AT TIME ZONE 'UTC'::text)`),
  updated_at: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`(now() AT TIME ZONE 'UTC'::text)`),
});

export const user_roles = pgTable(
  "user_roles",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    name: text().notNull(),
    permissions: jsonb().default({}).notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("user_roles_name_key").on(table.name)]
);

export const locations = pgTable("locations", {
  id: uuid()
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  name: text().notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const session_logs = pgTable(
  "session_logs",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    type: text().notNull(),
    text: text().notNull(),
    action: text(),
    status: text(),
    is_final: boolean("is_final"),
    confidence: doublePrecision(),
    timestamp: timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    session_id: text("session_id").notNull(),
    user_id: uuid("user_id"),
    metadata: jsonb().default({}),
  },
  (table) => [
    index("session_logs_session_id_idx").using(
      "btree",
      table.session_id.asc().nullsLast().op("text_ops")
    ),
    index("session_logs_timestamp_idx").using(
      "btree",
      table.timestamp.asc().nullsLast().op("timestamptz_ops")
    ),
    index("session_logs_type_idx").using(
      "btree",
      table.type.asc().nullsLast().op("text_ops")
    ),
    index("session_logs_user_id_idx").using(
      "btree",
      table.user_id.asc().nullsLast().op("uuid_ops")
    ),
    pgPolicy("Users can view their own session logs", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`((user_id = auth.uid()) OR ((auth.jwt() ? 'user_role'::text) AND (((auth.jwt() ->> 'user_role'::text) = 'manager'::text) OR ((auth.jwt() ->> 'user_role'::text) = 'owner'::text))))`,
    }),
    pgPolicy("Allow authenticated users to insert logs", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
    }),
    check(
      "session_logs_status_check",
      sql`status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text, 'info'::text])`
    ),
    check(
      "session_logs_type_check",
      sql`type = ANY (ARRAY['transcript'::text, 'action'::text])`
    ),
  ]
);

export const inventory_items = pgTable(
  "inventory_items",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    location_id: uuid("location_id").notNull(),
    name: text().notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2, mode: "number" }),
    unit: text().notNull(),
    category: text().notNull(),
    threshold: decimal("threshold", {
      precision: 10,
      scale: 2,
      mode: "number",
    }),
    last_updated: timestamp("last_updated", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    embedding: vector({ dimensions: 1536 }),
    description: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.location_id],
      foreignColumns: [locations.id],
      name: "inventory_items_location_id_fkey",
    }).onDelete("cascade"),
    unique("inventory_items_location_id_name_key").on(
      table.location_id,
      table.name
    ),
    pgPolicy("Allow access based on user locations", {
      as: "permissive",
      for: "all",
      to: ["authenticated"],
      using: sql`EXISTS (
        SELECT 1 
        FROM user_locations 
        WHERE user_locations.location_id = inventory_items.location_id 
        AND user_locations.user_id = auth.uid()
      )`,
    }),
  ]
);

export const user_locations = pgTable(
  "user_locations",
  {
    user_id: uuid("user_id").notNull(),
    location_id: uuid("location_id").notNull(),
    role_id: uuid("role_id").notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey(table.user_id, table.location_id),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [profiles.id],
      name: "user_locations_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.location_id],
      foreignColumns: [locations.id],
      name: "user_locations_location_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.role_id],
      foreignColumns: [user_roles.id],
      name: "user_locations_role_id_fkey",
    }).onDelete("restrict"),
  ]
);

export const inventory_updates = pgTable(
  "inventory_updates",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    item_id: uuid("item_id").notNull(),
    action: text().notNull(),
    previous_quantity: decimal("previous_quantity", {
      precision: 10,
      scale: 2,
      mode: "number",
    }),
    new_quantity: decimal("new_quantity", {
      precision: 10,
      scale: 2,
      mode: "number",
    }),
    quantity: decimal("quantity", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    unit: text().notNull(),
    user_id: uuid("user_id"),
    user_name: text("user_name"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.item_id],
      foreignColumns: [inventory_items.id],
      name: "inventory_updates_item_id_fkey",
    }).onDelete("cascade"),
    pgPolicy("Allow insert based on user role per location", {
      as: "permissive",
      for: "insert",
      to: ["authenticated"],
      withCheck: sql`EXISTS (
        SELECT 1
        FROM inventory_items ii
        JOIN user_locations ul ON ii.location_id = ul.location_id
        JOIN user_roles ur ON ul.role_id = ur.id
        WHERE ii.id = inventory_updates.item_id
          AND ul.user_id = auth.uid()
          AND ur.name IN ('owner', 'team-member')
      )`,
    }),
    pgPolicy("Allow select based on user role per location", {
      as: "permissive",
      for: "select",
      to: ["authenticated"],
      using: sql`EXISTS (
        SELECT 1
        FROM inventory_items ii
        JOIN user_locations ul ON ii.location_id = ul.location_id
        JOIN user_roles ur ON ul.role_id = ur.id
        WHERE ii.id = inventory_updates.item_id
          AND ul.user_id = auth.uid()
          AND ur.name IN ('owner', 'team-member')
      )`,
    }),
    check(
      "inventory_updates_action_check",
      sql`action = ANY (ARRAY['add'::text, 'remove'::text, 'set'::text, 'check'::text])`
    ),
  ]
);

export const invite_codes = pgTable(
  "invite_codes",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    code: text().notNull(),
    role: text().notNull(),
    location_id: uuid("location_id").notNull(), // Added column
    created_by: uuid("created_by"),
    used_by: uuid("used_by"),
    used_at: timestamp("used_at", { withTimezone: true, mode: "string" }),
    expires_at: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("invite_codes_code_key").on(table.code),
    foreignKey({
      columns: [table.location_id],
      foreignColumns: [locations.id],
      name: "invite_codes_location_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.created_by],
      foreignColumns: [profiles.id],
      name: "invite_codes_created_by_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.used_by],
      foreignColumns: [profiles.id],
      name: "invite_codes_used_by_fkey",
    }).onDelete("set null"),
  ]
);

export const revoked_tokens = pgTable(
  "revoked_tokens",
  {
    id: uuid()
      .default(sql`uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    token_jti: text("token_jti").notNull(),
    user_id: uuid("user_id").notNull(),
    revoked_at: timestamp("revoked_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    expires_at: timestamp("expires_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    reason: text().notNull(),
  },
  (table) => [
    unique("revoked_tokens_token_jti_key").on(table.token_jti),
    index("revoked_tokens_expires_at_idx").using(
      "btree",
      table.expires_at.asc().nullsLast().op("timestamptz_ops")
    ),
    foreignKey({
      columns: [table.user_id],
      foreignColumns: [profiles.id],
      name: "revoked_tokens_user_id_fkey",
    }).onDelete("cascade"),
  ]
);
