/**
 * Theme registry — the single source of truth for available themes.
 *
 * To add a NEW palette:
 *   1. Add `[data-theme="your-id"] { ... }` in `client/styles/theme.css`.
 *   2. Register it in THEME_GROUPS below.
 */

export const THEME_GROUPS = [
  {
    id: "goelprep",
    label: "goELprep",
    themes: [
      { id: "goelprep-light", label: "Light", swatch: "bg-[#0066FF]" },
      { id: "goelprep-dark", label: "Dark", swatch: "bg-[#272B33] ring-1 ring-[#3399FF]/40" },
    ],
  },
  {
    id: "blossom",
    label: "Blossom",
    themes: [
      { id: "light", label: "Light", swatch: "bg-[#FF4D8D]" },
      { id: "dark", label: "Dark", swatch: "bg-[#0F0F0F] ring-1 ring-[#FF4D8D]/40" },
    ],
  },
] as const;

export const THEMES = [
  ...THEME_GROUPS[0].themes,
  ...THEME_GROUPS[1].themes,
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "goelprep-light";

const THEME_IDS: readonly string[] = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.includes(value);
}

export function isDarkTheme(theme: ThemeId): boolean {
  return theme === "dark" || theme === "goelprep-dark";
}

export function themeGroupId(theme: ThemeId): (typeof THEME_GROUPS)[number]["id"] {
  return theme.startsWith("goelprep") ? "goelprep" : "blossom";
}

/** Flip light ↔ dark within the same palette family. */
export function toggleThemeMode(theme: ThemeId): ThemeId {
  if (theme.startsWith("goelprep")) {
    return theme === "goelprep-dark" ? "goelprep-light" : "goelprep-dark";
  }
  return theme === "dark" ? "light" : "dark";
}

export const THEME_STORAGE_KEY = "theme";
