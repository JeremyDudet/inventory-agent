// frontend/src/stores/inventoryStore.ts
import { create } from "zustand";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  threshold?: number; // Alert threshold for low inventory
  lastupdated: string;
  createdat?: string;
  updatedat?: string;
  embedding: number[];
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
  updateItems: (
    updatedItems: (Partial<InventoryItem> & { id: string })[]
  ) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create the Zustand store
export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  categories: [],
  error: null,
  setItems: (items) => set({ items }),
  setCategories: (categories) => set({ categories }),
  setError: (error) => set({ error }),
  updateItem: (updatedItem) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      ),
    })),
  updateItems: (updatedItems) =>
    set((state) => ({
      items: state.items.map((item) => {
        const update = updatedItems.find((u) => u.id === item.id);
        return update ? { ...item, ...update } : item;
      }),
    })),
}));
