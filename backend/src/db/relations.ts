// backend/src/db/relations.ts
import { relations } from "drizzle-orm/relations";
import { profiles, inventory_items, inventory_updates } from "./schema";

export const profilesRelations = relations(profiles, () => ({})); // No direct relation to auth.users

export const inventoryUpdatesRelations = relations(
  inventory_updates,
  ({ one }) => ({
    inventoryItem: one(inventory_items, {
      fields: [inventory_updates.itemId],
      references: [inventory_items.id],
    }),
  })
);

export const inventoryItemsRelations = relations(
  inventory_items,
  ({ many }) => ({
    inventoryUpdates: many(inventory_updates),
  })
);
