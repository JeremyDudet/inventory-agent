import { InventoryItem } from "@/models/InventoryItem";
import { User, UserRole } from "@/services/authService";
import { NlpResult } from "@/types/nlp";
import { describe, it, expect } from "@jest/globals";

describe("Test Fixtures", () => {
  it("should export fixture creation functions", () => {
    expect(typeof createInventoryItem).toBe("function");
    expect(typeof createUser).toBe("function");
    expect(typeof createNlpResult).toBe("function");
  });
});

/**
 * Factory for creating inventory items for testing
 */
export const createInventoryItem = (
  overrides: Partial<InventoryItem> = {}
): InventoryItem => ({
  id: "test-item-id",
  name: "Test Item",
  quantity: 10,
  unit: "units",
  category: "test",
  lastupdated: new Date().toISOString(),
  embedding: [],
  ...overrides,
});

/**
 * Factory for creating test users
 */
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: UserRole.STAFF,
  permissions: {
    "inventory:read": true,
    "inventory:write": true,
    "inventory:delete": false,
    "user:read": false,
    "user:write": false,
  },
  ...overrides,
});

/**
 * Factory for creating NLP results
 */
export const createNlpResult = (
  overrides: Partial<NlpResult> = {}
): NlpResult => ({
  action: "add",
  item: "milk",
  quantity: 5,
  unit: "gallons",
  confidence: 0.95,
  isComplete: true,
  ...overrides,
});
