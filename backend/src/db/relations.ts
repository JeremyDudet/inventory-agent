// backend/src/db/relations.ts
import { relations } from "drizzle-orm/relations";
import {
  categories,
  profiles,
  user_roles,
  locations,
  session_logs,
  inventory_items,
  user_locations,
  inventory_updates,
  undo_actions,
  invite_codes,
  revoked_tokens,
  waiting_list,
  subscription_plans,
  customers,
  subscriptions,
  subscription_usage,
} from "./schema";

export const profilesRelations = relations(profiles, ({ many }) => ({
  user_locations: many(user_locations),
  undo_actions: many(undo_actions),
  invite_codes_created_by: many(invite_codes, {
    relationName: "invite_codes_created_by",
  }),
  invite_codes_used_by: many(invite_codes, {
    relationName: "invite_codes_used_by",
  }),
  revoked_tokens: many(revoked_tokens),
  customers: many(customers),
}));

export const inventoryUpdatesRelations = relations(
  inventory_updates,
  ({ one }) => ({
    inventoryItem: one(inventory_items, {
      fields: [inventory_updates.item_id],
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

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(profiles, {
    fields: [customers.user_id],
    references: [profiles.id],
  }),
  subscriptions: many(subscriptions),
}));

export const subscription_plansRelations = relations(
  subscription_plans,
  ({ many }) => ({
    subscriptions: many(subscriptions),
  })
);

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [subscriptions.customer_id],
      references: [customers.id],
    }),
    plan: one(subscription_plans, {
      fields: [subscriptions.plan_id],
      references: [subscription_plans.id],
    }),
    usage: many(subscription_usage),
  })
);

export const subscription_usageRelations = relations(
  subscription_usage,
  ({ one }) => ({
    subscription: one(subscriptions, {
      fields: [subscription_usage.subscription_id],
      references: [subscriptions.id],
    }),
  })
);
