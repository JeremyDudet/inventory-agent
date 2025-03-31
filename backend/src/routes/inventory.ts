import express from 'express';
import { 
  mockInventory, 
  InventoryItem, 
  InventoryItemInsert,
  INVENTORY_TABLE 
} from '../models/InventoryItem';
import { authMiddleware, authorize } from '../middleware/auth';
import inventoryService from '../services/inventoryService';
import { inventoryUpdateSchema, inventoryItemSchema } from '../validation/inventoryValidation';

const router = express.Router();

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY);
};

// Get all inventory items
router.get('/', async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using mock data');
      return res.status(200).json({
        items: mockInventory,
        count: mockInventory.length,
        source: 'mock'
      });
    }

    // Query parameters for filtering
    const { category, search, limit = 100, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Get paginated results
    const items = await inventoryService.fetchInventory();
    
    // Apply filters if provided
    let filteredItems = items;
    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }
    
    if (search) {
      const searchLower = search.toString().toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower)
      );
    }
    
    res.status(200).json({
      items: filteredItems as InventoryItem[],
      count: filteredItems.length,
      page: Number(page),
      limit: Number(limit),
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

// Get a specific inventory item
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using mock data');
      const item = mockInventory.find(item => item.id === id);
      
      if (!item) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Inventory item not found',
          },
        });
      }
      
      return res.status(200).json({ 
        item, 
        source: 'mock' 
      });
    }
    
    const item = await inventoryService.findById(id);
    
    if (!item) {
      return res.status(404).json({
        error: {
          code: 'ITEM_NOT_FOUND',
          message: 'Inventory item not found',
        },
      });
    }
    
    res.status(200).json({ 
      item: item as InventoryItem,
      source: 'database' 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

// Update inventory item
router.post('/update', authMiddleware, authorize('inventory:write'), async (req, res, next) => {
  try {
    const validationResult = inventoryUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationResult.error.errors
        },
      });
    }

    const { action, item, quantity, unit } = validationResult.data;
    
    const result = await inventoryService.updateInventory({
      action,
      item,
      quantity,
      unit
    });
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'UPDATE_FAILED',
          message: result.message || 'Failed to update inventory',
        },
      });
    }
    
    res.status(200).json({
      message: result.message || 'Inventory updated successfully',
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

// Add a new inventory item
router.post('/add-item', authMiddleware, authorize('inventory:write'), async (req, res, next) => {
  try {
    const validationResult = inventoryItemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: validationResult.error.errors
        },
      });
    }

    const newItem = validationResult.data;
    const result = await inventoryService.addItem(newItem);
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'CREATE_FAILED',
          message: result.message || 'Failed to add inventory item',
        },
      });
    }
    
    res.status(201).json({
      item: result.item,
      message: result.message || 'New item added successfully',
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

// Get all categories
router.get('/categories', async (req, res, next) => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using mock data');
      // Get unique categories from mock data
      const categories = Array.from(new Set(mockInventory.map(item => item.category)));
      return res.status(200).json({
        categories,
        source: 'mock'
      });
    }
    
    const categories = await inventoryService.getCategories();
    
    res.status(200).json({
      categories,
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

// Delete an inventory item
router.delete('/:id', authMiddleware, authorize('inventory:delete'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using mock data');
      const itemIndex = mockInventory.findIndex(item => item.id === id);
      
      if (itemIndex === -1) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Inventory item not found',
          },
        });
      }
      
      const deletedItem = { ...mockInventory[itemIndex] };
      mockInventory.splice(itemIndex, 1);
      
      return res.status(200).json({
        item: deletedItem,
        message: `Item deleted: ${deletedItem.name}`,
        source: 'mock'
      });
    }
    
    const result = await inventoryService.deleteItem(id);
    
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'DELETE_FAILED',
          message: result.message || 'Failed to delete inventory item',
        },
      });
    }
    
    res.status(200).json({
      message: result.message || 'Item deleted successfully',
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

export default router; 