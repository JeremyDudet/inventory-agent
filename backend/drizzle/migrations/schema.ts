import { pgTable, index, foreignKey, unique, uuid, text, timestamp, jsonb, pgPolicy, numeric, vector, check, boolean, doublePrecision, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const revokedTokens = pgTable("revoked_tokens", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	tokenJti: text("token_jti").notNull(),
	userId: uuid("user_id").notNull(),
	revokedAt: timestamp("revoked_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	reason: text().notNull(),
}, (table) => [
	index("revoked_tokens_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "revoked_tokens_user_id_fkey"
		}).onDelete("cascade"),
	unique("revoked_tokens_token_jti_key").on(table.tokenJti),
]);

export const inviteCodes = pgTable("invite_codes", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	code: text().notNull(),
	role: text().notNull(),
	createdBy: uuid("created_by"),
	usedBy: uuid("used_by"),
	usedAt: timestamp("used_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	locationId: uuid("location_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [profiles.id],
			name: "invite_codes_created_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.id],
			name: "invite_codes_location_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.usedBy],
			foreignColumns: [profiles.id],
			name: "invite_codes_used_by_fkey"
		}).onDelete("set null"),
	unique("invite_codes_code_key").on(table.code),
]);

export const userRoles = pgTable("user_roles", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text().notNull(),
	permissions: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("user_roles_name_key").on(table.name),
]);

export const inventoryItems = pgTable("inventory_items", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text().notNull(),
	quantity: numeric({ precision: 10, scale:  2 }),
	unit: text().notNull(),
	category: text().notNull(),
	threshold: numeric({ precision: 10, scale:  2 }),
	lastUpdated: timestamp("last_updated", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	embedding: vector({ dimensions: 1536 }),
	description: text(),
	locationId: uuid("location_id").notNull(),
	sku: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.id],
			name: "inventory_items_location_id_fkey"
		}).onDelete("cascade"),
	unique("inventory_items_location_id_name_key").on(table.name, table.locationId),
	unique("inventory_items_sku_key").on(table.sku),
	pgPolicy("Allow access based on user locations", { as: "permissive", for: "all", to: ["authenticated"], using: sql`true` }),
]);

export const sessionLogs = pgTable("session_logs", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	type: text().notNull(),
	text: text().notNull(),
	action: text(),
	status: text(),
	isFinal: boolean("is_final"),
	confidence: doublePrecision(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	sessionId: text("session_id").notNull(),
	userId: uuid("user_id"),
	metadata: jsonb().default({}),
}, (table) => [
	index("session_logs_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("session_logs_timestamp_idx").using("btree", table.timestamp.asc().nullsLast().op("timestamptz_ops")),
	index("session_logs_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("session_logs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	pgPolicy("Users can view their own session logs", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((user_id = auth.uid()) OR ((auth.jwt() ? 'user_role'::text) AND (((auth.jwt() ->> 'user_role'::text) = 'manager'::text) OR ((auth.jwt() ->> 'user_role'::text) = 'owner'::text))))` }),
	pgPolicy("Allow authenticated users to insert logs", { as: "permissive", for: "insert", to: ["authenticated"] }),
	check("session_logs_status_check", sql`status = ANY (ARRAY['success'::text, 'error'::text, 'pending'::text, 'info'::text])`),
	check("session_logs_type_check", sql`type = ANY (ARRAY['transcript'::text, 'action'::text])`),
]);

export const waitingList = pgTable("waiting_list", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: text().notNull(),
	name: text().notNull(),
	phone: text(),
	businessType: text("business_type").notNull(),
	inventoryMethod: text("inventory_method"),
	softwareName: text("software_name"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("waiting_list_email_key").on(table.email),
]);

export const categories = pgTable("categories", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("categories_name_key").on(table.name),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	name: text(),
	email: text(),
	image: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`(now() AT TIME ZONE 'UTC'::text)`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`(now() AT TIME ZONE 'UTC'::text)`),
});

export const inventoryUpdates = pgTable("inventory_updates", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	itemId: uuid("item_id").notNull(),
	action: text().notNull(),
	previousQuantity: numeric("previous_quantity", { precision: 10, scale:  2 }),
	newQuantity: numeric("new_quantity", { precision: 10, scale:  2 }),
	quantity: numeric({ precision: 10, scale:  2 }).notNull(),
	unit: text().notNull(),
	userId: uuid("user_id"),
	userName: text("user_name"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	method: text().default('ui').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [inventoryItems.id],
			name: "inventory_updates_item_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Allow select based on user role per location", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Allow insert based on user role per location", { as: "permissive", for: "insert", to: ["authenticated"] }),
	check("inventory_updates_action_check", sql`action = ANY (ARRAY['add'::text, 'remove'::text, 'set'::text, 'check'::text])`),
	check("inventory_updates_method_check", sql`method = ANY (ARRAY['ui'::text, 'voice'::text, 'api'::text])`),
]);

export const undoActions = pgTable("undo_actions", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	actionType: text("action_type").notNull(),
	itemId: uuid("item_id").notNull(),
	itemName: text("item_name").notNull(),
	description: text().notNull(),
	previousState: jsonb("previous_state").notNull(),
	currentState: jsonb("current_state").notNull(),
	method: text().default('ui').notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("undo_actions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("undo_actions_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("undo_actions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [inventoryItems.id],
			name: "undo_actions_item_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "undo_actions_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can only access their own undo actions", { as: "permissive", for: "all", to: ["authenticated"] }),
	check("undo_actions_action_type_check", sql`action_type = ANY (ARRAY['inventory_update'::text, 'item_create'::text, 'item_delete'::text, 'bulk_update'::text])`),
	check("undo_actions_method_check", sql`method = ANY (ARRAY['ui'::text, 'voice'::text, 'api'::text])`),
]);

export const locations = pgTable("locations", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const userLocations = pgTable("user_locations", {
	userId: uuid("user_id").notNull(),
	locationId: uuid("location_id").notNull(),
	roleId: uuid("role_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.locationId],
			foreignColumns: [locations.id],
			name: "user_locations_location_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [userRoles.id],
			name: "user_locations_role_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "user_locations_user_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.locationId], name: "user_locations_user_id_location_id_pk"}),
]);
