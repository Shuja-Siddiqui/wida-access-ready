/** Shared visual language for practice sessions — refined, not playful. */

import { cn } from "@/lib/utils";

export type SessionDomainKey = "listening" | "reading" | "speaking" | "writing";

export function normalizeSessionDomain(key: string): SessionDomainKey {
  const base = key.replace("_academic", "");
  if (base === "reading" || base === "speaking" || base === "writing") return base;
  return "listening";
}

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
}

export const SESSION_THEMES: Record<SessionDomainKey, SessionTheme> = {
  listening: {
    title: "text-sky-800 dark:text-sky-200",
    progress: "bg-sky-500",
    iconWrap: "bg-sky-500/10 ring-1 ring-sky-500/15",
    icon: "text-sky-600 dark:text-sky-400",
    panel: "border-sky-500/15 bg-sky-500/[0.03]",
    primaryBtn: "btn-brand",
    chip: "border-border/70 bg-background text-foreground",
    chipHover: "hover:border-sky-500/35 hover:bg-sky-500/[0.04]",
    selected: "border-sky-500/50 bg-sky-500/[0.06] text-sky-900 dark:text-sky-100",
    paired: "border-slate-400/30 bg-muted/50 text-muted-foreground",
  },
  reading: {
    title: "text-amber-900 dark:text-amber-100",
    progress: "bg-amber-600",
    iconWrap: "bg-amber-500/10 ring-1 ring-amber-500/15",
    icon: "text-amber-700 dark:text-amber-300",
    panel: "border-amber-500/15 bg-amber-500/[0.03]",
    primaryBtn: "btn-brand",
    chip: "border-border/70 bg-background text-foreground",
    chipHover: "hover:border-amber-500/35 hover:bg-amber-500/[0.04]",
    selected: "border-amber-600/45 bg-amber-500/[0.06] text-amber-950 dark:text-amber-50",
    paired: "border-slate-400/30 bg-muted/50 text-muted-foreground",
  },
  speaking: {
    title: "text-emerald-900 dark:text-emerald-100",
    progress: "bg-emerald-600",
    iconWrap: "bg-emerald-500/10 ring-1 ring-emerald-500/15",
    icon: "text-emerald-700 dark:text-emerald-300",
    panel: "border-emerald-500/15 bg-emerald-500/[0.03]",
    primaryBtn: "btn-brand",
    chip: "border-border/70 bg-background text-foreground",
    chipHover: "hover:border-emerald-500/35 hover:bg-emerald-500/[0.04]",
    selected: "border-emerald-600/45 bg-emerald-500/[0.06] text-emerald-950 dark:text-emerald-50",
    paired: "border-slate-400/30 bg-muted/50 text-muted-foreground",
  },
  writing: {
    title: "text-violet-900 dark:text-violet-100",
    progress: "bg-violet-600",
    iconWrap: "bg-violet-500/10 ring-1 ring-violet-500/15",
    icon: "text-violet-700 dark:text-violet-300",
    panel: "border-violet-500/15 bg-violet-500/[0.03]",
    primaryBtn: "btn-brand",
    chip: "border-border/70 bg-background text-foreground",
    chipHover: "hover:border-violet-500/35 hover:bg-violet-500/[0.04]",
    selected: "border-violet-600/45 bg-violet-500/[0.06] text-violet-950 dark:text-violet-50",
    paired: "border-slate-400/30 bg-muted/50 text-muted-foreground",
  },
};

export const SESSION_LABEL = "text-[11px] font-medium text-muted-foreground";

export const SESSION_CARD =
  "rounded-xl border border-border/60 bg-card/80 shadow-sm";

export const SESSION_QUESTION =
  "text-[17px] sm:text-lg font-semibold text-foreground leading-snug tracking-tight";

export const SESSION_OPTION_BASE =
  "w-full text-left px-4 py-3 rounded-lg border transition-colors duration-150";

export const SESSION_SUCCESS =
  "border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-200";

export const SESSION_ERROR =
  "border-rose-500/35 bg-rose-500/[0.05] text-rose-800 dark:text-rose-200 opacity-90";

export const SESSION_MUTED_OPTION =
  "border-border/25 bg-muted/20 opacity-50";

/** Single column for MC-only items with no reference media. */
export const SESSION_SINGLE_COLUMN = "max-w-2xl mx-auto w-full space-y-5";

/** Reference column — image, passage, audio, or prompt. Scrolls inside the app viewport shell. */
export const SESSION_REFERENCE_COLUMN =
  "min-w-0 flex flex-col gap-3 sm:gap-4 h-full max-h-full overflow-y-auto overscroll-contain lg:pr-1";

/** Theme-aware scrollbar (see .themed-scroll in client/index.css). */
export function sessionScrollArea(_domain?: SessionDomainKey): string {
  return "themed-scroll";
}

/** Questions, recorder, or composer. */
export const SESSION_WORK_COLUMN = "min-w-0 flex flex-col gap-5 h-full max-h-full min-h-0";
