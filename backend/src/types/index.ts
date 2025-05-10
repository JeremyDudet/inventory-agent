// backend/src/types/index.ts
import {
  profiles,
  user_roles,
  user_locations,
  locations,
  inventory_items,
} from "@/db/schema";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: UserPermissions;
  sessionId?: string;
}

// Select types (for reading from DB)
export type Profile = typeof profiles.$inferSelect;
export type UserRole = typeof user_roles.$inferSelect;
export type UserLocation = typeof user_locations.$inferSelect;
export type Location = typeof locations.$inferSelect;

// Insert types (for writing to DB)
export type InsertProfile = typeof profiles.$inferInsert;
export type InsertUserRole = typeof user_roles.$inferInsert;
export type InsertUserLocation = typeof user_locations.$inferInsert;
export type InsertLocation = typeof locations.$inferInsert;

export type InventoryItem = typeof inventory_items.$inferSelect;
export type InventoryItemInsert = typeof inventory_items.$inferInsert;

// Custom types for auth
export type UserWithProfile = Profile & {
  locations?: Array<{
    location: Location;
    role: UserRole;
  }>;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: UserPermissions;
  locations?: Array<{
    id: string;
    name: string;
    role: {
      id: string;
      name: string;
      permissions: Record<string, boolean>;
    };
  }>;
};

export type AuthTokenPayload = {
  userId: string;
  email: string;
  name: string;
  role: string;
  permissions: UserPermissions;
  sessionId: string;
  jti: string;
};

// Enum for user roles (to match your existing code)
export enum UserRoleEnum {
  OWNER = "owner",
  MANAGER = "manager",
  STAFF = "staff",
  READONLY = "readonly",
}

export type UserPermissions = {
  "inventory:read": boolean;
  "inventory:write": boolean;
  "inventory:delete": boolean;
  "user:read": boolean;
  "user:write": boolean;
};
