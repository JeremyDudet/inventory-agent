// frontend/src/stores/inventoryStore.ts
import { create } from "zustand";

// Define the shape of an inventory item
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  threshold: number;
  lastupdated: string;
  createdat: string;
  description: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
}

// Define the store's state and actions
interface InventoryState {
  items: InventoryItem[];
  categories: InventoryCategory[];
  setItems: (items: InventoryItem[]) => void;
  setCategories: (categories: InventoryCategory[]) => void;
  updateItem: (updatedItem: Partial<InventoryItem> & { id: string }) => void;
}

// Create the Zustand store
export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  categories: [],
  setItems: (items) => set({ items }),
  setCategories: (categories) => set({ categories }),
  updateItem: (updatedItem) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      ),
    })),
}));
