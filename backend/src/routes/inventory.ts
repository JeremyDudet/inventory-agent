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
import { NotFoundError } from '../errors/NotFoundError';
import { ValidationError } from '../errors/ValidationError';

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
        throw new NotFoundError('Inventory item not found');
      }
      
      return res.status(200).json({ 
        item, 
        source: 'mock' 
      });
    }
    
    const item = await inventoryService.findById(id);
    res.status(200).json({ 
      item: item as InventoryItem,
      source: 'database' 
    });
  } catch (error) {
    next(error);
  }
});

// Update inventory item
router.post('/update', authMiddleware, authorize('inventory:write'), async (req, res, next) => {
  try {
    const validationResult = inventoryUpdateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new ValidationError('Invalid input data');
    }

    const { action, item, quantity, unit } = validationResult.data;
    
    await inventoryService.updateInventory({
      action,
      item,
      quantity,
      unit
    });
    
    res.status(200).json({
      message: 'Inventory updated successfully',
      source: 'database'
    });
  } catch (error) {
    next(error);
  }
});

// Add a new inventory item
router.post('/add-item', authMiddleware, authorize('inventory:write'), async (req, res, next) => {
  try {
    const validationResult = inventoryItemSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new ValidationError('Invalid input data');
    }

    const newItem = validationResult.data;
    const item = await inventoryService.addItem(newItem);
    
    res.status(201).json({
      item,
      message: `Successfully added ${item.name}`,
      source: 'database'
    });
  } catch (error) {
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
        throw new NotFoundError('Inventory item not found');
      }
      
      const deletedItem = { ...mockInventory[itemIndex] };
      mockInventory.splice(itemIndex, 1);
      
      return res.status(200).json({
        item: deletedItem,
        message: `Item deleted: ${deletedItem.name}`,
        source: 'mock'
      });
    }
    
    await inventoryService.deleteItem(id);
    
    res.status(200).json({
      message: 'Item deleted successfully',
      source: 'database'
    });
  } catch (error) {
    next(error);
  }
});

export default router; 