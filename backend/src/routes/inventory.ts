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
import multer from "multer";
import db from "../db";
import { inventory_items, user_locations } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

const router = express.Router();
const inventoryRepository = new InventoryRepository();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

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

      // The loadItem middleware ensures req.item exists, but TypeScript doesn't know that
      if (!req.item) {
        throw new ValidationError("Item not found");
      }

      // Use the inventory service to update, which will handle websocket notifications properly
      await inventoryService.updateInventoryCount(
        {
          action: "set",
          item: id,
          quantity: quantity,
          unit: req.item.unit, // Use the item's unit from the middleware
        },
        req, // Pass the request object to include user info
        "ui" // Method is UI since this is a direct API call from the UI
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
      const item = await inventoryService.addItem(newItem, req);

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

// Get inventory updates/changelog
router.get("/updates/changelog", authMiddleware, async (req, res, next) => {
  try {
    const updates = await inventoryRepository.getInventoryUpdates();

    res.status(200).json({
      updates,
      source: "database",
    });
  } catch (error) {
    next(error);
  }
});

// Delete an inventory item
router.delete(
  "/:id",
  authMiddleware,
  authorize("inventory:delete"),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      await inventoryService.deleteItem(id, req);

      res.status(200).json({
        message: "Item deleted successfully",
        source: "database",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Bulk import endpoint
router.post(
  "/bulk-import",
  authMiddleware,
  authorize("inventory:write"),
  async (req, res) => {
    try {
      const { items, location_id } = req.body;
      // Handle both AuthUser and AuthTokenPayload types
      const userId =
        req.user && "id" in req.user ? req.user.id : req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ message: "No items provided for import" });
      }

      if (!location_id) {
        return res.status(400).json({ message: "Location ID is required" });
      }

      // Verify user has access to this location
      const userLocation = await db
        .select()
        .from(user_locations)
        .where(
          and(
            eq(user_locations.user_id, userId),
            eq(user_locations.location_id, location_id)
          )
        )
        .limit(1);

      if (userLocation.length === 0) {
        return res
          .status(403)
          .json({ message: "Access denied to this location" });
      }

      // Validate and prepare items for insertion
      const validItems = [];
      const errors = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          // Validate required fields
          if (
            !item.name ||
            typeof item.name !== "string" ||
            item.name.trim() === ""
          ) {
            errors.push(
              `Row ${item.rowIndex || i + 1}: Product name is required`
            );
            continue;
          }

          if (
            !item.unit ||
            typeof item.unit !== "string" ||
            item.unit.trim() === ""
          ) {
            errors.push(`Row ${item.rowIndex || i + 1}: Unit is required`);
            continue;
          }

          if (
            !item.category ||
            typeof item.category !== "string" ||
            item.category.trim() === ""
          ) {
            errors.push(`Row ${item.rowIndex || i + 1}: Category is required`);
            continue;
          }

          if (
            item.quantity === null ||
            item.quantity === undefined ||
            isNaN(parseFloat(item.quantity))
          ) {
            errors.push(
              `Row ${item.rowIndex || i + 1}: Valid quantity is required`
            );
            continue;
          }

          // Prepare the item for insertion
          const validItem = {
            location_id: location_id,
            name: item.name.trim(),
            quantity: parseFloat(item.quantity),
            unit: item.unit.trim(),
            category: item.category.trim(),
            threshold: item.threshold ? parseFloat(item.threshold) : null,
            description: item.description ? item.description.trim() : null,
          };

          validItems.push(validItem);
        } catch (error) {
          errors.push(
            `Row ${item.rowIndex || i + 1}: ${(error as Error).message}`
          );
        }
      }

      if (errors.length > 0 && validItems.length === 0) {
        return res.status(400).json({
          message: "No valid items to import",
          errors: errors.slice(0, 10), // Limit to first 10 errors
        });
      }

      // Insert valid items
      const insertedItems = [];
      const insertErrors = [];

      for (const item of validItems) {
        try {
          // Check if item with same name already exists in this location
          const existingItem = await db
            .select()
            .from(inventory_items)
            .where(
              and(
                eq(inventory_items.location_id, location_id),
                eq(inventory_items.name, item.name)
              )
            )
            .limit(1);

          if (existingItem.length > 0) {
            // Update existing item quantity
            const updated = await db
              .update(inventory_items)
              .set({
                quantity: item.quantity,
                unit: item.unit,
                category: item.category,
                threshold: item.threshold,
                description: item.description,
                updated_at: sql`now()`,
              })
              .where(eq(inventory_items.id, existingItem[0].id))
              .returning();

            insertedItems.push({ ...updated[0], status: "updated" });
          } else {
            // Insert new item
            const inserted = await db
              .insert(inventory_items)
              .values(item)
              .returning();

            insertedItems.push({ ...inserted[0], status: "created" });
          }
        } catch (error) {
          console.error(`Failed to insert item ${item.name}:`, error);
          insertErrors.push(
            `Failed to import "${item.name}": ${(error as Error).message}`
          );
        }
      }

      const response: any = {
        message: `Successfully processed ${insertedItems.length} items`,
        imported: insertedItems.length,
        created: insertedItems.filter((item) => item.status === "created")
          .length,
        updated: insertedItems.filter((item) => item.status === "updated")
          .length,
      };

      if (errors.length > 0) {
        response.warnings = errors.slice(0, 10);
      }

      if (insertErrors.length > 0) {
        response.errors = insertErrors.slice(0, 10);
      }

      res.json(response);
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: "Internal server error during import" });
    }
  }
);

export default router;
