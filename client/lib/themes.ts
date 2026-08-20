/**
 * Theme registry — the single source of truth for available themes.
 *
 * To add a NEW theme (e.g. "midnight"):
 *   1. Add a `[data-theme="midnight"] { ... }` block in `client/styles/theme.css`.
 *   2. Add `{ id: "midnight", label: "Midnight" }` to the THEMES array below.
 * Everything else (toggle, persistence, no-flash init) picks it up automatically.
 */

export const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "light";

const THEME_IDS: readonly string[] = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.includes(value);
}

export const THEME_STORAGE_KEY = "theme";
