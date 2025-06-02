import { create } from "zustand";

interface InventoryUpdate {
  id: string;
  itemId: string;
  action: "add" | "remove" | "set" | "check";
  previousQuantity: number;
  newQuantity: number;
  quantity: number;
  unit: string;
  userId: string;
  userName: string;
  method?: "ui" | "voice" | "api";
  createdAt: string;
  itemName?: string;
  isNew?: boolean;
}

interface ChangelogState {
  updates: InventoryUpdate[];
  users: string[];
  isLoading: boolean;
  lastFetchTime: Date | null;
  hasInitiallyLoaded: boolean;

  // Actions
  setUpdates: (updates: InventoryUpdate[]) => void;
  setUsers: (users: string[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setLastFetchTime: (time: Date) => void;
  addLiveUpdate: (update: InventoryUpdate) => void;
  updateItemNames: (items: any[]) => void;
  forceRefresh: () => void;
  resetStore: () => void;
}

export const useChangelogStore = create<ChangelogState>((set, get) => ({
  updates: [],
  users: [],
  isLoading: false,
  lastFetchTime: null,
  hasInitiallyLoaded: false,

  setUpdates: (updates) =>
    set({
      updates,
      hasInitiallyLoaded: true,
    }),

  setUsers: (users) => set({ users }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setLastFetchTime: (time) => set({ lastFetchTime: time }),

  addLiveUpdate: (update) =>
    set((state) => ({
      updates: [update, ...state.updates],
    })),

  updateItemNames: (items) =>
    set((state) => ({
      updates: state.updates.map((update) => ({
        ...update,
        itemName:
          items.find((item) => item.id === update.itemId)?.name ||
          update.itemName ||
          "Unknown Item",
      })),
    })),

  forceRefresh: () =>
    set({
      hasInitiallyLoaded: false,
    }),

  resetStore: () =>
    set({
      updates: [],
      users: [],
      isLoading: false,
      lastFetchTime: null,
      hasInitiallyLoaded: false,
    }),
}));
