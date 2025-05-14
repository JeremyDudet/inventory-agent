// frontend/src/stores/locationStore.ts
import { create } from "zustand";

interface LocationState {
  currentLocation: string | null;
  setCurrentLocation: (location: string | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),
}));
