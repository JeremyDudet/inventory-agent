import express from 'express';
import supabase from '../config/db';
import { 
  mockInventory, 
  InventoryItem, 
  InventoryItemInsert,
  InventoryItemUpdate,
  INVENTORY_TABLE 
} from '../models/InventoryItem';

const router = express.Router();

// Helper to check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return process.env.SUPABASE_URL && process.env.SUPABASE_KEY;
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
    
    // Start building the query
    let query = supabase
      .from(INVENTORY_TABLE)
      .select('*', { count: 'exact' });
    
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    // Get paginated results
    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + Number(limit) - 1);
    
    if (error) {
      console.error('Error fetching inventory:', error);
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch inventory items',
          details: error.message
        }
      });
    }
    
    res.status(200).json({
      items: data as InventoryItem[],
      count: count || 0,
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
    
    // Fetch from Supabase
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Inventory item not found',
          },
        });
      }
      
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch inventory item',
          details: error.message
        }
      });
    }
    
    res.status(200).json({ 
      item: data as InventoryItem,
      source: 'database' 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

// Update inventory (add, remove, or set quantity)
router.post('/update', async (req, res, next) => {
  try {
    const { itemId, action, quantity, unit } = req.body;
    
    if (!itemId || !action || quantity === undefined) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Item ID, action, and quantity are required',
        },
      });
    }
    
    // Validate action
    if (!['add', 'remove', 'set'].includes(action)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ACTION',
          message: 'Action must be one of: add, remove, set',
        },
      });
    }
    
    // Using Supabase if configured
    if (isSupabaseConfigured()) {
      // First, get the current item to calculate the new quantity
      const { data: item, error: fetchError } = await supabase
        .from(INVENTORY_TABLE)
        .select('*')
        .eq('id', itemId)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({
            error: {
              code: 'ITEM_NOT_FOUND',
              message: 'Inventory item not found',
            },
          });
        }
        
        return res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch inventory item',
            details: fetchError.message
          }
        });
      }
      
      // Calculate new quantity based on action
      let newQuantity = item.quantity;
      switch (action) {
        case 'add':
          newQuantity += Number(quantity);
          break;
        case 'remove':
          newQuantity = Math.max(0, item.quantity - Number(quantity));
          break;
        case 'set':
          newQuantity = Number(quantity);
          break;
      }
      
      // Prepare update data
      const updateData: InventoryItemUpdate = {
        quantity: newQuantity,
        lastUpdated: new Date().toISOString(),
      };
      
      // Update unit if provided
      if (unit) {
        updateData.unit = unit;
      }
      
      // Update in database
      const { data: updatedItem, error: updateError } = await supabase
        .from(INVENTORY_TABLE)
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();
      
      if (updateError) {
        return res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update inventory item',
            details: updateError.message
          }
        });
      }
      
      return res.status(200).json({
        item: updatedItem,
        message: `Inventory updated successfully: ${action} ${quantity} ${updatedItem.unit} of ${updatedItem.name}`,
        source: 'database'
      });
    } else {
      console.warn('Supabase not configured, using mock data');
      // Fall back to mock data
      const itemIndex = mockInventory.findIndex(item => item.id === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Inventory item not found',
          },
        });
      }
      
      const item = { ...mockInventory[itemIndex] };
      
      // Update quantity based on action
      switch (action) {
        case 'add':
          item.quantity += Number(quantity);
          break;
        case 'remove':
          item.quantity = Math.max(0, item.quantity - Number(quantity));
          break;
        case 'set':
          item.quantity = Number(quantity);
          break;
      }
      
      // Update unit if provided
      if (unit) {
        item.unit = unit;
      }
      
      // Update lastUpdated timestamp
      item.lastUpdated = new Date().toISOString();
      
      // Update mock inventory
      mockInventory[itemIndex] = item;
      
      return res.status(200).json({
        item,
        message: `Inventory updated successfully: ${action} ${quantity} ${item.unit} of ${item.name}`,
        source: 'mock'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

// Add a new inventory item
router.post('/add-item', async (req, res, next) => {
  try {
    const { name, quantity, unit, category, threshold } = req.body;
    
    if (!name || quantity === undefined || !unit || !category) {
      return res.status(400).json({
        error: {
          code: 'MISSING_FIELDS',
          message: 'Name, quantity, unit, and category are required',
        },
      });
    }
    
    // Using Supabase if configured
    if (isSupabaseConfigured()) {
      // Check if item with same name already exists
      const { data: existingItems, error: checkError } = await supabase
        .from(INVENTORY_TABLE)
        .select('id')
        .ilike('name', name)
        .limit(1);
      
      if (checkError) {
        return res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to check for existing items',
            details: checkError.message
          }
        });
      }
      
      if (existingItems && existingItems.length > 0) {
        return res.status(409).json({
          error: {
            code: 'ITEM_EXISTS',
            message: 'An item with this name already exists',
            existingId: existingItems[0].id
          }
        });
      }
      
      // Prepare the new item
      const newItem: InventoryItemInsert = {
        name,
        quantity: Number(quantity),
        unit,
        category,
        lastUpdated: new Date().toISOString(),
      };
      
      // Add threshold if provided
      if (threshold !== undefined) {
        newItem.threshold = Number(threshold);
      }
      
      // Insert into database
      const { data, error: insertError } = await supabase
        .from(INVENTORY_TABLE)
        .insert(newItem)
        .select()
        .single();
      
      if (insertError) {
        return res.status(500).json({
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to add inventory item',
            details: insertError.message
          }
        });
      }
      
      return res.status(201).json({
        item: data,
        message: `New item added: ${name}`,
        source: 'database'
      });
    } else {
      console.warn('Supabase not configured, using mock data');
      // Fall back to mock data
      const newItem: InventoryItem = {
        id: (mockInventory.length + 1).toString(),
        name,
        quantity: Number(quantity),
        unit,
        category,
        lastUpdated: new Date().toISOString(),
      };
      
      // Add threshold if provided
      if (threshold !== undefined) {
        newItem.threshold = Number(threshold);
      }
      
      mockInventory.push(newItem);
      
      return res.status(201).json({
        item: newItem,
        message: `New item added: ${name}`,
        source: 'mock'
      });
    }
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
    
    // Get distinct categories from database
    const { data, error } = await supabase
      .from(INVENTORY_TABLE)
      .select('category')
      .order('category')
      .limit(100);
    
    if (error) {
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch categories',
          details: error.message
        }
      });
    }
    
    // Extract unique categories
    const categories = Array.from(new Set(data.map(item => item.category)));
    
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
router.delete('/:id', async (req, res, next) => {
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
    
    // First, check if the item exists
    const { data: existingItem, error: fetchError } = await supabase
      .from(INVENTORY_TABLE)
      .select('name')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Inventory item not found',
          },
        });
      }
      
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check for item existence',
          details: fetchError.message
        }
      });
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from(INVENTORY_TABLE)
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return res.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete inventory item',
          details: deleteError.message
        }
      });
    }
    
    res.status(200).json({
      message: `Item deleted: ${existingItem.name}`,
      source: 'database'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    next(error);
  }
});

export default router; 