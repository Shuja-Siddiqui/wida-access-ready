const CONFETTI_TOKENS = [
  "--color-trust-blue",
  "--color-streak-gold",
  "--color-growth-green",
  "--color-achieve-purple",
  "--color-energy-orange",
] as const;

function cssVarToColor(varName: string): string | null {
  if (typeof document === "undefined") return null;
  const probe = document.createElement("span");
  probe.style.color = `var(${varName})`;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return rgb && rgb !== "rgba(0, 0, 0, 0)" ? rgb : null;
}

/** Brand palette colors for canvas-confetti and similar runtime effects. */
export function getThemeConfettiColors(): string[] {
  const colors = CONFETTI_TOKENS.map(cssVarToColor).filter(Boolean) as string[];
  return colors.length ? colors : ["hsl(217 100% 50%)"];
}

/** Resolved primary color for inline SVG/chart accents. */
export function getThemePrimaryColor(): string {
  return cssVarToColor("--color-primary") ?? "hsl(217 100% 50%)";
}

/** Primary brand gradient for inline styles when a CSS class is awkward. */
export function getThemePrimaryGradient(): string {
  if (typeof document === "undefined") {
    return "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))";
  }
  const root = getComputedStyle(document.documentElement);
  const primary = root.getPropertyValue("--primary").trim();
  const hover = root.getPropertyValue("--primary-hover").trim();
  return `linear-gradient(135deg, hsl(${primary}), hsl(${hover}))`;
}

/** Secondary accent gradient (e.g. academic tracks). */
export function getThemeAccentGradient(): string {
  if (typeof document === "undefined") {
    return "linear-gradient(135deg, hsl(var(--brand-achieve-purple)), hsl(var(--primary)))";
  }
  const root = getComputedStyle(document.documentElement);
  const accent = root.getPropertyValue("--brand-achieve-purple").trim();
  const primary = root.getPropertyValue("--primary").trim();
  return `linear-gradient(135deg, hsl(${accent}), hsl(${primary}))`;
}

export function getThemeAccentColor(): string {
  return cssVarToColor("--color-achieve-purple") ?? getThemePrimaryColor();
}
