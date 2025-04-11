import { createContext, useContext, useState, useEffect } from "react";

type ColorMode = "light" | "dark";

interface ColorModeContextType {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  colorMode: "light",
  setColorMode: () => {},
});

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const getInitialColorMode = (): ColorMode => {
    const savedMode = localStorage.getItem("colorMode");
    if (savedMode && (savedMode === "light" || savedMode === "dark")) {
      return savedMode;
    }
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  };

  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorMode);
    localStorage.setItem("colorMode", colorMode);
  }, [colorMode]);

  return (
    <ColorModeContext.Provider value={{ colorMode, setColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}
