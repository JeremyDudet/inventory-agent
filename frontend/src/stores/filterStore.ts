import { create } from "zustand";

interface FilterState {
  // Page-specific filter states
  items: {
    searchQuery: string;
    selectedCategories: string[];
  };
  stockList: {
    searchQuery: string;
    selectedCategories: string[];
  };
  changeLog: {
    searchQuery: string;
    dateRange: {
      start: string;
      end: string;
    };
    selectedUsers: string[];
    selectedActions: string[];
  };

  // Actions for Items page
  setItemsSearchQuery: (query: string) => void;
  setItemsSelectedCategories: (categories: string[]) => void;
  resetItemsFilters: () => void;

  // Actions for StockList page
  setStockListSearchQuery: (query: string) => void;
  setStockListSelectedCategories: (categories: string[]) => void;
  resetStockListFilters: () => void;

  // Actions for ChangeLog page
  setChangeLogSearchQuery: (query: string) => void;
  setChangeLogDateRange: (range: { start: string; end: string }) => void;
  setChangeLogSelectedUsers: (users: string[]) => void;
  setChangeLogSelectedActions: (actions: string[]) => void;
  resetChangeLogFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  // Initial state
  items: {
    searchQuery: "",
    selectedCategories: [],
  },
  stockList: {
    searchQuery: "",
    selectedCategories: [],
  },
  changeLog: {
    searchQuery: "",
    dateRange: {
      start: "",
      end: "",
    },
    selectedUsers: [],
    selectedActions: [],
  },

  // Actions for Items page
  setItemsSearchQuery: (query) =>
    set((state) => ({
      items: { ...state.items, searchQuery: query },
    })),
  setItemsSelectedCategories: (categories) =>
    set((state) => ({
      items: { ...state.items, selectedCategories: categories },
    })),
  resetItemsFilters: () =>
    set((state) => ({
      items: {
        searchQuery: "",
        selectedCategories: [],
      },
    })),

  // Actions for StockList page
  setStockListSearchQuery: (query) =>
    set((state) => ({
      stockList: { ...state.stockList, searchQuery: query },
    })),
  setStockListSelectedCategories: (categories) =>
    set((state) => ({
      stockList: { ...state.stockList, selectedCategories: categories },
    })),
  resetStockListFilters: () =>
    set((state) => ({
      stockList: {
        searchQuery: "",
        selectedCategories: [],
      },
    })),

  // Actions for ChangeLog page
  setChangeLogSearchQuery: (query) =>
    set((state) => ({
      changeLog: { ...state.changeLog, searchQuery: query },
    })),
  setChangeLogDateRange: (range) =>
    set((state) => ({
      changeLog: { ...state.changeLog, dateRange: range },
    })),
  setChangeLogSelectedUsers: (users) =>
    set((state) => ({
      changeLog: { ...state.changeLog, selectedUsers: users },
    })),
  setChangeLogSelectedActions: (actions) =>
    set((state) => ({
      changeLog: { ...state.changeLog, selectedActions: actions },
    })),
  resetChangeLogFilters: () =>
    set((state) => ({
      changeLog: {
        searchQuery: "",
        dateRange: { start: "", end: "" },
        selectedUsers: [],
        selectedActions: [],
      },
    })),
}));
