import { create } from "zustand";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

export interface UndoableAction {
  id: string;
  actionType:
    | "inventory_update"
    | "item_create"
    | "item_delete"
    | "bulk_update";
  timestamp: Date;
  description: string;
  previousState: any;
  currentState: any;
  itemId?: string;
  itemName?: string;
  method: string;
  expiresAt: string;
  createdAt: string;
}

interface UndoState {
  actionHistory: UndoableAction[];
  isLoading: boolean;
  hasInitiallyLoaded: boolean;
  lastFetchTime: Date | null;
  fetchUndoActions: (force?: boolean) => Promise<void>;
  executeUndo: (actionId: string) => Promise<boolean>;
  deleteUndoAction: (actionId: string) => Promise<boolean>;
  getRecentActions: (count?: number) => UndoableAction[];
  canUndo: (actionId: string) => boolean;
  clearCache: () => void;
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  actionHistory: [],
  isLoading: false,
  hasInitiallyLoaded: false,
  lastFetchTime: null,

  fetchUndoActions: async (force = false) => {
    const state = get();

    // Don't fetch if we already have data and it's not forced
    if (state.hasInitiallyLoaded && !force && state.actionHistory.length >= 0) {
      console.log("🔄 Skipping fetch - undo actions already loaded");
      return;
    }

    // Don't fetch if already loading
    if (state.isLoading) {
      console.log("🔄 Skipping fetch - already loading");
      return;
    }

    try {
      set({ isLoading: true });
      const { session } = useAuthStore.getState();

      if (!session?.access_token) {
        console.warn("No auth token available for fetching undo actions");
        return;
      }

      console.log("🔄 Fetching undo actions from API...");
      const response = await api.get("/api/undo", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.success) {
        const actions = response.data.map((action: any) => ({
          ...action,
          timestamp: new Date(action.createdAt),
        }));

        set({
          actionHistory: actions,
          hasInitiallyLoaded: true,
          lastFetchTime: new Date(),
        });
        console.log(`🔄 Successfully loaded ${actions.length} undo actions`);
      }
    } catch (error) {
      console.error("Failed to fetch undo actions:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  executeUndo: async (actionId: string) => {
    try {
      const { session } = useAuthStore.getState();

      if (!session?.access_token) {
        console.error("No auth token available for undo");
        return false;
      }

      const response = await api.post(
        `/api/undo/${actionId}/execute`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.success) {
        // Remove the undone action from local state immediately
        set((state) => ({
          actionHistory: state.actionHistory.filter((a) => a.id !== actionId),
        }));

        // Refresh from server to get the latest state
        const { fetchUndoActions } = get();
        fetchUndoActions(true);

        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to execute undo:", error);
      return false;
    }
  },

  deleteUndoAction: async (actionId: string) => {
    try {
      const { session } = useAuthStore.getState();

      if (!session?.access_token) {
        console.error("No auth token available for deleting undo action");
        return false;
      }

      const response = await api.delete(`/api/undo/${actionId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.success) {
        // Remove the action from local state
        set((state) => ({
          actionHistory: state.actionHistory.filter((a) => a.id !== actionId),
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to delete undo action:", error);
      return false;
    }
  },

  getRecentActions: (count = 10) => {
    const state = get();
    return state.actionHistory.slice(0, count);
  },

  canUndo: (actionId: string) => {
    const state = get();
    return state.actionHistory.some((a) => a.id === actionId);
  },

  clearCache: () => {
    set({
      actionHistory: [],
      isLoading: false,
      hasInitiallyLoaded: false,
      lastFetchTime: null,
    });
  },
}));
