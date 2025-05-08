// backend/src/routes/inventory.ts
import express from "express";
import {
  mockInventory,
  InventoryItem,
  InventoryItemInsert,
  INVENTORY_TABLE,
} from "../models/InventoryItem";
import { authMiddleware, authorize } from "../middleware/auth";
import inventoryService from "../services/inventoryService";
import {
  inventoryUpdateSchema,
  inventoryItemSchema,
} from "../validation/inventoryValidation";
import { NotFoundError } from "../errors/NotFoundError";
import { ValidationError } from "../errors/ValidationError";
import websocketService from "../services/websocketService";
import { InventoryRepository } from "../repositories/InventoryRepository";
import { z } from "zod";

const router = express.Router();
const inventoryRepository = new InventoryRepository();

// Validation schema for updating individual inventory item's quantity
const updateQuantitySchema = z.object({
  quantity: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .min(0, "Quantity must be non-negative"),
});

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return (
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)
  );
};

// Get all inventory items
router.get("/", async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, using mock data");
      return res.status(200).json({
        items: mockInventory,
        count: mockInventory.length,
        source: "mock",
      });
    }

    const { category, search, limit = 100, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const items = await inventoryService.fetchInventory();

    let filteredItems = items;
    if (category) {
      filteredItems = filteredItems.filter(
        (item) => item.category === category
      );
    }

    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredItems = filteredItems.filter((item) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      items: filteredItems as InventoryItem[],
      count: filteredItems.length,
      page: Number(page),
      limit: Number(limit),
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

// Get all categories (MOVED BEFORE /:id)
router.get("/categories", async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, using mock data");
      const categories = Array.from(
        new Set(mockInventory.map((item) => item.category))
      );
      return res.status(200).json({
        categories,
        source: "mock",
      });
    }

    const categories = await inventoryService.getCategories();

    res.status(200).json({
      categories,
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific inventory item (MOVED AFTER /categories)
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, using mock data");
      const item = mockInventory.find((item) => item.id === id);

      if (!item) {
        throw new NotFoundError("Inventory item not found");
      }

      return res.status(200).json({
        item,
        source: "mock",
      });
    }

    const item = await inventoryService.findById(id);
    res.status(200).json({
      item: item as InventoryItem,
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

// Update single inventory item
router.post(
  "/update/:id",
  authMiddleware,
  authorize("inventory:write"),
  async (req, res, next) => {
    try {
      const validationResult = updateQuantitySchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new ValidationError(
          `Invalid input data: ${JSON.stringify(errors)}`
        );
      }

      const { quantity } = validationResult.data;
      const { id } = req.params;

      // Update the item quantity
      const updatedItem = await inventoryRepository.updateQuantity(
        id,
        quantity
      );
      if (!updatedItem) {
        throw new ValidationError("Failed to update inventory quantity");
      }

      // Send WebSocket notification
      const successMessage = {
        type: "stockUpdate",
        status: "success",
        data: {
          item: updatedItem.name,
          quantity: updatedItem.quantity,
          unit: updatedItem.unit,
          id: updatedItem.id,
        },
        timestamp: Date.now(),
      };
      websocketService.broadcastToInventoryClients(
        "inventory-updated",
        successMessage
      );

      res.status(200).json({
        message: "Inventory updated successfully",
        source: "database",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add a new inventory item
router.post(
  "/add-item",
  authMiddleware,
  authorize("inventory:write"),
  async (req, res, next) => {
    try {
      const validationResult = inventoryItemSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw new ValidationError("Invalid input data");
      }

      const newItem = validationResult.data;
      const item = await inventoryService.addItem(newItem);

      res.status(201).json({
        item,
        message: `Successfully added ${item.name}`,
        source: "database",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete an inventory item
router.delete(
  "/:id",
  authMiddleware,
  authorize("inventory:delete"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!isSupabaseConfigured()) {
        console.warn("Supabase not configured, using mock data");
        const itemIndex = mockInventory.findIndex((item) => item.id === id);

        if (itemIndex === -1) {
          throw new NotFoundError("Inventory item not found");
        }

        const deletedItem = { ...mockInventory[itemIndex] };
        mockInventory.splice(itemIndex, 1);

        return res.status(200).json({
          item: deletedItem,
          message: `Item deleted: ${deletedItem.name}`,
          source: "mock",
        });
      }

      await inventoryService.deleteItem(id);

      res.status(200).json({
        message: "Item deleted successfully",
        source: "database",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
