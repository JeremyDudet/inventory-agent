import { create } from "zustand";

export interface UndoableAction {
  id: string;
  type: "inventory_update" | "item_create" | "item_delete" | "bulk_update";
  timestamp: Date;
  description: string;
  previousState: any;
  currentState: any;
  revertFunction: () => Promise<void>;
  itemId?: string;
  itemName?: string;
}

interface UndoState {
  actionHistory: UndoableAction[];
  maxHistorySize: number;
  addUndoableAction: (action: UndoableAction) => void;
  executeUndo: (actionId: string) => Promise<boolean>;
  clearHistory: () => void;
  getRecentActions: (count?: number) => UndoableAction[];
  canUndo: (actionId: string) => boolean;
}

export const useUndoStore = create<UndoState>()((set, get) => ({
  actionHistory: [],
  maxHistorySize: 20,

  addUndoableAction: (action: UndoableAction) => {
    set((state) => {
      const newHistory = [action, ...state.actionHistory];
      // Keep only the most recent actions
      const trimmedHistory = newHistory.slice(0, state.maxHistorySize);

      return {
        actionHistory: trimmedHistory,
      };
    });
  },

  executeUndo: async (actionId: string) => {
    const state = get();
    const action = state.actionHistory.find((a) => a.id === actionId);

    if (!action) {
      console.error("Undo action not found:", actionId);
      return false;
    }

    try {
      await action.revertFunction();

      // Remove the undone action from history
      set((state) => ({
        actionHistory: state.actionHistory.filter((a) => a.id !== actionId),
      }));

      return true;
    } catch (error) {
      console.error("Failed to execute undo:", error);
      return false;
    }
  },

  clearHistory: () => {
    set({ actionHistory: [] });
  },

  getRecentActions: (count = 10) => {
    const state = get();
    return state.actionHistory.slice(0, count);
  },

  canUndo: (actionId: string) => {
    const state = get();
    return state.actionHistory.some((a) => a.id === actionId);
  },
}));
