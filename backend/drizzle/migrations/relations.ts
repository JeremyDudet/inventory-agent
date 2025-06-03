import { relations } from "drizzle-orm/relations";
import { profiles, revokedTokens, inviteCodes, locations, inventoryItems, inventoryUpdates, undoActions, userLocations, userRoles } from "./schema";

export const revokedTokensRelations = relations(revokedTokens, ({one}) => ({
	profile: one(profiles, {
		fields: [revokedTokens.userId],
		references: [profiles.id]
	}),
}));

export const profilesRelations = relations(profiles, ({many}) => ({
	revokedTokens: many(revokedTokens),
	inviteCodes_createdBy: many(inviteCodes, {
		relationName: "inviteCodes_createdBy_profiles_id"
	}),
	inviteCodes_usedBy: many(inviteCodes, {
		relationName: "inviteCodes_usedBy_profiles_id"
	}),
	undoActions: many(undoActions),
	userLocations: many(userLocations),
}));

export const inviteCodesRelations = relations(inviteCodes, ({one}) => ({
	profile_createdBy: one(profiles, {
		fields: [inviteCodes.createdBy],
		references: [profiles.id],
		relationName: "inviteCodes_createdBy_profiles_id"
	}),
	location: one(locations, {
		fields: [inviteCodes.locationId],
		references: [locations.id]
	}),
	profile_usedBy: one(profiles, {
		fields: [inviteCodes.usedBy],
		references: [profiles.id],
		relationName: "inviteCodes_usedBy_profiles_id"
	}),
}));

export const locationsRelations = relations(locations, ({many}) => ({
	inviteCodes: many(inviteCodes),
	inventoryItems: many(inventoryItems),
	userLocations: many(userLocations),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({one, many}) => ({
	location: one(locations, {
		fields: [inventoryItems.locationId],
		references: [locations.id]
	}),
	inventoryUpdates: many(inventoryUpdates),
	undoActions: many(undoActions),
}));

export const inventoryUpdatesRelations = relations(inventoryUpdates, ({one}) => ({
	inventoryItem: one(inventoryItems, {
		fields: [inventoryUpdates.itemId],
		references: [inventoryItems.id]
	}),
}));

export const undoActionsRelations = relations(undoActions, ({one}) => ({
	inventoryItem: one(inventoryItems, {
		fields: [undoActions.itemId],
		references: [inventoryItems.id]
	}),
	profile: one(profiles, {
		fields: [undoActions.userId],
		references: [profiles.id]
	}),
}));

export const userLocationsRelations = relations(userLocations, ({one}) => ({
	location: one(locations, {
		fields: [userLocations.locationId],
		references: [locations.id]
	}),
	userRole: one(userRoles, {
		fields: [userLocations.roleId],
		references: [userRoles.id]
	}),
	profile: one(profiles, {
		fields: [userLocations.userId],
		references: [profiles.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({many}) => ({
	userLocations: many(userLocations),
}));