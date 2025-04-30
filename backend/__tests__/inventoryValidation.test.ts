import { z } from "zod";
import {
  inventoryUpdateSchema,
  inventoryItemSchema,
} from "@/validation/inventoryValidation";

describe("Inventory Validation Schemas", () => {
  describe("inventoryUpdateSchema", () => {
    test("should validate a valid inventory update", () => {
      const validUpdate = {
        action: "add",
        item: "Coffee Beans",
        quantity: 5,
        unit: "pounds",
      };

      const result = inventoryUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdate);
      }
    });

    test("should reject invalid action", () => {
      const invalidUpdate = {
        action: "invalid",
        item: "Coffee Beans",
        quantity: 5,
        unit: "pounds",
      };

      const result = inventoryUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(["action"]);
      }
    });

    test("should reject negative quantity", () => {
      const invalidUpdate = {
        action: "add",
        item: "Coffee Beans",
        quantity: -5,
        unit: "pounds",
      };

      const result = inventoryUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(["quantity"]);
      }
    });

    test("should reject empty item name", () => {
      const invalidUpdate = {
        action: "add",
        item: "",
        quantity: 5,
        unit: "pounds",
      };

      const result = inventoryUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(["item"]);
      }
    });
  });

  describe("inventoryItemSchema", () => {
    test("should validate a valid inventory item", () => {
      const validItem = {
        name: "Coffee Beans",
        quantity: 25,
        unit: "pounds",
        category: "ingredients",
        threshold: 10,
      };

      const result = inventoryItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validItem);
      }
    });

    test("should validate item without threshold", () => {
      const validItem = {
        name: "Coffee Beans",
        quantity: 25,
        unit: "pounds",
        category: "ingredients",
      };

      const result = inventoryItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validItem);
      }
    });

    test("should reject negative threshold", () => {
      const invalidItem = {
        name: "Coffee Beans",
        quantity: 25,
        unit: "pounds",
        category: "ingredients",
        threshold: -10,
      };

      const result = inventoryItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(["threshold"]);
      }
    });

    test("should reject empty category", () => {
      const invalidItem = {
        name: "Coffee Beans",
        quantity: 25,
        unit: "pounds",
        category: "",
      };

      const result = inventoryItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(["category"]);
      }
    });
  });
});
