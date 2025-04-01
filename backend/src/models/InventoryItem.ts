// Inventory item model
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  threshold?: number;  // Alert threshold for low inventory
  lastupdated: string;
  createdat?: string;
  updatedat?: string;
  embedding: number[];
}

// Supabase database types for inventory items
export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'createdat' | 'updatedat' | 'lastupdated' | 'embedding'> & {
  lastupdated?: string;
  embedding?: number[];
};
export type InventoryItemUpdate = Partial<Omit<InventoryItem, 'id' | 'createdat' | 'updatedat'>>;

// Database table name
export const INVENTORY_TABLE = 'inventory_items';

// Mock inventory data for MVP when database is not available
export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Coffee Beans (Dark Roast)',
    quantity: 25,
    unit: 'pounds',
    category: 'ingredients',
    threshold: 10,
    lastupdated: new Date().toISOString(),
    embedding: [],
  },
  {
    id: '2',
    name: 'Whole Milk',
    quantity: 8,
    unit: 'gallons',
    category: 'dairy',
    threshold: 3,
    lastupdated: new Date().toISOString(),
    embedding: [],
  },
  {
    id: '3',
    name: 'Sugar',
    quantity: 15,
    unit: 'pounds',
    category: 'ingredients',
    threshold: 5,
    lastupdated: new Date().toISOString(),
    embedding: [],
  },
  {
    id: '4',
    name: 'Paper Cups (12oz)',
    quantity: 500,
    unit: 'pieces',
    category: 'supplies',
    threshold: 100,
    lastupdated: new Date().toISOString(),
    embedding: [],
  },
]; 