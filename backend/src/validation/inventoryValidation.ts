// backend/src/validation/inventoryValidation.ts
import { z } from "zod";

// Schema for inventory updates (add/remove/set quantity)
export const inventoryUpdateSchema = z.object({
  action: z.enum(["add", "remove", "set"]),
  item: z.string().min(1, "Item name is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  unit: z.string().min(1, "Unit is required"),
});

// Schema for updating individual inventory item's quantity
export const updateQuantitySchema = z.object({
  quantity: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .min(0, "Quantity must be non-negative"),
});

// Schema for creating/updating inventory items
export const inventoryItemSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be non-negative").nullable(),
  unit: z.string().min(1, "Unit is required"),
  category: z.string().min(1, "Category is required"),
  location_id: z.string().min(1, "Location ID is required"),
  threshold: z.number().min(0, "Threshold must be non-negative").nullable(),
  last_updated: z.string(),
  embedding: z.array(z.number()).nullable(),
  description: z.string().nullable(),
});

// Type inference
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
