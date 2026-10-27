/** Dashboard visual language — card surfaces aligned with Blossom / goELprep theme. */

/** Full-page soft wash (render on `#app-main`, not inside max-width column). */
export const PAGE_THEME_WASH_LAYER =
  "bg-gradient-to-b from-primary/[0.09] via-trust-blue/[0.04] via-25% to-background";

export const DASHBOARD_PANEL =
  "rounded-2xl border border-card-border bg-gradient-to-br from-card via-card to-primary/[0.06] shadow-sm";

export const DASHBOARD_PANEL_HOVER =
  "rounded-2xl border border-card-border bg-gradient-to-br from-card via-card to-primary/[0.06] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20";

/** Tables and lists that need clip without hover lift */
export const DASHBOARD_PANEL_OVERFLOW = `${DASHBOARD_PANEL} overflow-hidden`;

export const DASHBOARD_MICRO =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

export const DASHBOARD_ACCENT = "absolute top-0 left-0 right-0 h-0.5";

/** Outline actions on dashboard headers */
export const DASHBOARD_OUTLINE_BTN =
  "font-bold border border-border/40 shadow-sm hover:-translate-y-1 hover:shadow-sm active:translate-y-0 active:shadow-sm transition-all rounded-xl bg-gradient-to-br from-card via-card to-primary/[0.06] hover:to-primary/[0.1]";

/** XP / streak / rank stat tiles on student home */
export const DASHBOARD_STAT_XP =
  "rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.14] via-card to-trust-blue/[0.1] shadow-sm";

export const DASHBOARD_STAT_STREAK =
  "rounded-2xl border border-logo-gold/25 bg-gradient-to-br from-logo-gold/[0.16] via-card to-primary/[0.06] shadow-sm";

export const DASHBOARD_STAT_RANK =
  "rounded-2xl border border-card-border bg-gradient-to-br from-primary/[0.12] via-card to-trust-blue/[0.08] shadow-sm";

/** Replaces flat `bg-card border … rounded-2xl` on educator detail cards */
export const DASHBOARD_FLAT_CARD = DASHBOARD_PANEL;

