import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light",
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", newTheme);
          return { theme: newTheme };
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
  const savedTheme = localStorage.getItem("theme-storage");
  if (savedTheme) {
    const { state } = JSON.parse(savedTheme);
    document.documentElement.setAttribute("data-theme", state.theme);
  }

  // Listen for system preference changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (e: MediaQueryListEvent) => {
    const newTheme = e.matches ? "dark" : "light";
    useThemeStore.getState().setTheme(newTheme);
  };

  // Add listener for system preference changes
  mediaQuery.addEventListener("change", handleChange);
}
