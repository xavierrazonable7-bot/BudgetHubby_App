import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { Colors, ColorScheme, ThemeColors } from "@/constants/colors";

interface ThemeContextValue {
  theme: ThemeColors;
  colorScheme: ColorScheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "@budgetbuddy_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark") {
        setColorScheme(saved);
      } else {
        setColorScheme(systemScheme === "dark" ? "dark" : "light");
      }
      setLoaded(true);
    });
  }, []);

  const toggleTheme = () => {
    const next: ColorScheme = colorScheme === "light" ? "dark" : "light";
    setColorScheme(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  };

  const setTheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
  };

  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const value = useMemo(() => ({
    theme,
    colorScheme,
    isDark,
    toggleTheme,
    setTheme,
  }), [theme, colorScheme, isDark]);

  if (!loaded) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
