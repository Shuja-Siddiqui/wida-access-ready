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
  {
    id: "daredevil",
    label: "Daredevil",
    themes: [
      { id: "daredevil-light", label: "Light", swatch: "bg-[#BE1E2D]" },
      { id: "daredevil-dark", label: "Dark", swatch: "bg-[#140808] ring-1 ring-[#E4142]/50" },
    ],
  },
] as const;

export const THEMES = [
  ...THEME_GROUPS[0].themes,
  ...THEME_GROUPS[1].themes,
  ...THEME_GROUPS[2].themes,
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "goelprep-light";

const THEME_IDS: readonly string[] = THEMES.map((t) => t.id);

const DARK_THEME_IDS = new Set<string>(["dark", "goelprep-dark", "daredevil-dark"]);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.includes(value);
}

export function isDarkTheme(theme: ThemeId): boolean {
  return DARK_THEME_IDS.has(theme);
}

export function themeGroupId(theme: ThemeId): (typeof THEME_GROUPS)[number]["id"] {
  if (theme.startsWith("goelprep")) return "goelprep";
  if (theme.startsWith("daredevil")) return "daredevil";
  return "blossom";
}

/** Flip light ↔ dark within the same palette family. */
export function toggleThemeMode(theme: ThemeId): ThemeId {
  if (theme.startsWith("goelprep")) {
    return theme === "goelprep-dark" ? "goelprep-light" : "goelprep-dark";
  }
  if (theme.startsWith("daredevil")) {
    return theme === "daredevil-dark" ? "daredevil-light" : "daredevil-dark";
  }
  return theme === "dark" ? "light" : "dark";
}

export const THEME_STORAGE_KEY = "theme";
