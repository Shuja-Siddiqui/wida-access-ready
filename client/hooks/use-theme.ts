import { useEffect, useState } from "react";
import {
  DEFAULT_THEME,
  isDarkTheme,
  isThemeId,
  THEME_STORAGE_KEY,
  toggleThemeMode,
  type ThemeId,
} from "@/lib/themes";

export function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeId(stored)) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "goelprep-dark"
    : DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /** Set any registered theme by id (light, dark, or a future custom theme). */
  const setTheme = (next: ThemeId) => setThemeState(next);

  /** Flip light ↔ dark within the current palette (goELprep or Blossom). */
  const toggleTheme = () => setThemeState((prev) => toggleThemeMode(prev));

  const isDark = isDarkTheme(theme);

  return { theme, setTheme, toggleTheme, isDark };
}
