/** Shared visual language for practice sessions — clean, minimal, hierarchy through type & space. */

import { cn } from "@/lib/utils";

export type SessionDomainKey = "listening" | "reading" | "speaking" | "writing";

export function normalizeSessionDomain(key: string): SessionDomainKey {
  const base = key.replace("_academic", "");
  if (base === "reading" || base === "speaking" || base === "writing") return base;
  return "listening";
}

import { DOMAIN_BRAND_COLORS as DOMAIN_BRAND } from "./domain-brand-colors";

/** Logo-aligned domain palette — single source in domain-brand-colors.ts */
export { DOMAIN_BRAND_COLORS as DOMAIN_BRAND } from "./domain-brand-colors";

export interface SessionTheme {
  title: string;
  progress: string;
  iconWrap: string;
  icon: string;
  panel: string;
  primaryBtn: string;
  chip: string;
  chipHover: string;
  selected: string;
  paired: string;
  accent: string;
  ringSoft: string;
  borderAccent: string;
}

function themeFromBrand(domain: SessionDomainKey): SessionTheme {
  const brand = DOMAIN_BRAND[domain];
  return {
    title: "text-foreground",
    progress: brand.bg,
    iconWrap: brand.text,
    icon: brand.text,
    panel: "bg-muted/25",
    accent: brand.text,
    primaryBtn: "btn-brand",
    chip: "bg-transparent text-foreground",
    chipHover: "hover:bg-muted/60",
    selected: brand.selected,
    paired: "bg-muted/40 text-muted-foreground",
    ringSoft: brand.ringSoft,
    borderAccent: brand.borderAccent,
  };
}

export const SESSION_THEMES: Record<SessionDomainKey, SessionTheme> = {
  listening: themeFromBrand("listening"),
  reading: themeFromBrand("reading"),
  speaking: themeFromBrand("speaking"),
  writing: themeFromBrand("writing"),
};

export const SESSION_LABEL =
  "text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground";

export const SESSION_CARD = "rounded-xl bg-muted/20";

export const SESSION_QUESTION =
  "text-[17px] sm:text-lg font-medium text-foreground leading-snug tracking-tight";

export const SESSION_OPTION_BASE =
  "w-full text-left rounded-lg px-3 py-2.5 transition-colors duration-150";

export const SESSION_SUCCESS =
  "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/20";

export const SESSION_ERROR =
  "bg-rose-500/10 text-rose-900 dark:text-rose-100 ring-1 ring-rose-500/20";

export const SESSION_MUTED_OPTION =
  "opacity-45 text-muted-foreground";

export const SESSION_SINGLE_COLUMN = "max-w-2xl mx-auto w-full space-y-5";

export const SESSION_REFERENCE_COLUMN =
  "min-w-0 flex flex-col gap-3 sm:gap-4 h-full max-h-full overflow-y-auto overscroll-contain lg:pr-1";

export function sessionScrollArea(_domain?: SessionDomainKey): string {
  return "themed-scroll";
}

export const SESSION_WORK_COLUMN = "min-w-0 flex flex-col min-h-0 w-full";

/** Soft divider between stacked session blocks (questions, sections). */
export const SESSION_SECTION_DIVIDER = "border-b border-border/15 pb-8 last:border-0 last:pb-0";

/** Compose brand utility classes for a domain (dashboard cards, charts, etc.). */
export function domainBrandClasses(domain: SessionDomainKey) {
  const brand = DOMAIN_BRAND[domain];
  return {
    ...brand,
    iconWrap: cn("shrink-0 rounded-lg flex items-center justify-center", brand.bgSoft, brand.text),
  };
}
