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
  location_id: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
}

// Define the store's state and actions
interface InventoryState {
  items: InventoryItem[];
  categories: InventoryCategory[];
  isLoading: boolean;
  hasInitiallyLoaded: boolean;
  lastFetchTime: Date | null;
  setItems: (items: InventoryItem[]) => void;
  setCategories: (categories: InventoryCategory[]) => void;
  updateItem: (updatedItem: Partial<InventoryItem> & { id: string }) => void;
  updateItems: (
    updatedItems: (Partial<InventoryItem> & { id: string })[]
  ) => void;
  error: string | null;
  setError: (error: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setHasInitiallyLoaded: (loaded: boolean) => void;
  setLastFetchTime: (time: Date | null) => void;
}

// Create the Zustand store
export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  categories: [],
  error: null,
  isLoading: false,
  hasInitiallyLoaded: false,
  lastFetchTime: null,
  setItems: (items) =>
    set({ items, hasInitiallyLoaded: true, lastFetchTime: new Date() }),
  setCategories: (categories) => set({ categories }),
  setError: (error) => set({ error }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setHasInitiallyLoaded: (loaded) => set({ hasInitiallyLoaded: loaded }),
  setLastFetchTime: (time) => set({ lastFetchTime: time }),
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
