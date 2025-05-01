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

// Define the store's state and actions
interface InventoryState {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
  updateItem: (updatedItem: Partial<InventoryItem> & { id: string }) => void;
}

// Create the Zustand store
export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  updateItem: (updatedItem) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      ),
    })),
}));
