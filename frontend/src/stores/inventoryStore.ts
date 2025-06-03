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
  refreshInventory: () => Promise<void>;
}

// Create the Zustand store
export const useInventoryStore = create<InventoryState>((set, get) => ({
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
  refreshInventory: async () => {
    try {
      set({ isLoading: true, error: null });

      // Fetch items
      const itemsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!itemsResponse.ok) {
        throw new Error("Failed to fetch inventory items");
      }

      const itemsData = await itemsResponse.json();

      // Fetch categories
      const categoriesResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/categories`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!categoriesResponse.ok) {
        throw new Error("Failed to fetch categories");
      }

      const categoriesData = await categoriesResponse.json();

      set({
        items: itemsData.items || [],
        categories: categoriesData.categories || [],
        hasInitiallyLoaded: true,
        lastFetchTime: new Date(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to refresh inventory:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh inventory",
        isLoading: false,
      });
    }
  },
}));
