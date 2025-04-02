// backend/src/validation/inventoryValidation.ts
import { z } from 'zod';

// Schema for inventory updates (add/remove/set quantity)
export const inventoryUpdateSchema = z.object({
  action: z.enum(['add', 'remove', 'set']),
  item: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  unit: z.string().min(1, 'Unit is required')
});

// Schema for creating/updating inventory items
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().min(1, 'Category is required'),
  threshold: z.number().min(0, 'Threshold must be non-negative').optional(),
  lastupdated: z.string().optional(),
  embedding: z.array(z.number()).optional()
});

// Type inference
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>; 