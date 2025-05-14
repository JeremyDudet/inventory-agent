// backend/src/routes/inventory.ts
import express, { NextFunction, Request, Response } from "express";
import { InventoryItem, InventoryItemInsert } from "../types";
import { authMiddleware, authorize } from "../middleware/auth";
import inventoryService from "../services/inventoryService";
import {
  inventoryItemSchema,
  updateQuantitySchema,
} from "../validation/inventoryValidation";
import { ValidationError } from "../errors/ValidationError";
import websocketService from "../services/websocketService";
import { InventoryRepository } from "../repositories/InventoryRepository";

const router = express.Router();
const inventoryRepository = new InventoryRepository();

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return (
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY)
  );
};

// Middleware to load the inventory item and set locationId
const loadItem = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    const item = await inventoryService.findById(id);
    req.item = item as InventoryItem;
    req.locationId = item.location_id; // Attach location_id to req
    next();
  } catch (error) {
    next(error); // Pass NotFoundError or other errors to error handler
  }
};

// Get all inventory items
router.get("/", async (req, res, next) => {
  try {
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
  loadItem,
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
