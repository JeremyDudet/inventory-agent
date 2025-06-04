import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  isInitialized: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Initialize theme synchronously before store creation
const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  
  const savedTheme = localStorage.getItem("theme-storage");
  if (savedTheme) {
    try {
      const { state } = JSON.parse(savedTheme);
      return state.theme;
    } catch {
      // If parsing fails, fall back to system preference
    }
  }
  
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      isInitialized: false,
      setTheme: (theme) => {
        set({ theme, isInitialized: true });
        document.documentElement.setAttribute("data-theme", theme);
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", newTheme);
          return { theme: newTheme, isInitialized: true };
        });
      },
    }),
    {
      name: "theme-storage",
    }
  )
);

// Initialize theme on store creation
if (typeof window !== "undefined") {
  const theme = getInitialTheme();
  document.documentElement.setAttribute("data-theme", theme);
  useThemeStore.getState().setTheme(theme);

  // Listen for system preference changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (e: MediaQueryListEvent) => {
    const newTheme = e.matches ? "dark" : "light";
    useThemeStore.getState().setTheme(newTheme);
  };

  // Add listener for system preference changes
  mediaQuery.addEventListener("change", handleChange);
}
