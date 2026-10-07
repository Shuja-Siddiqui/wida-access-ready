/**
 * goELprep logo domain colors (speech-bubble icon streaks + EL blue).
 * Single source of truth for dashboard cards, charts, and session accents.
 */
import type { SessionDomainKey } from "./session-ui-styles";
import { domainTierToKey } from "../home-types";

/** Resolve API / progress domain keys to a config key. */
export function resolveDomainBrandKey(domain: string): SessionDomainKey {
  const key = domainTierToKey(domain);
  if (key === "listening" || key === "speaking" || key === "reading" || key === "writing") {
    return key;
  }
  return "listening";
}

export type DomainBrandTokens = {
  /** For SVG stroke / inline styles */
  stroke: string;
  text: string;
  bgSoft: string;
  bg: string;
  border: string;
  ring: string;
  ringSoft: string;
  borderAccent: string;
  selected: string;
};

/**
 * goELprep brand colors:
 * Blue #107CE6 · Green #55C40A · Navy #032552
 * Reading #f8b000 · Writing #00a0b8 (logo streak accents)
 */
export const DOMAIN_BRAND_COLORS: Record<SessionDomainKey, DomainBrandTokens> = {
  listening: {
    stroke: "var(--color-trust-blue)",
    text: "text-trust-blue",
    bgSoft: "bg-trust-blue/10",
    bg: "bg-trust-blue",
    border: "border-trust-blue",
    ring: "ring-trust-blue/45",
    ringSoft: "ring-trust-blue/30",
    borderAccent: "border-l-trust-blue/50",
    selected: "bg-trust-blue/14 ring-2 ring-trust-blue/45 font-semibold text-foreground shadow-sm",
  },
  speaking: {
    stroke: "var(--color-growth-green)",
    text: "text-growth-green",
    bgSoft: "bg-growth-green/10",
    bg: "bg-growth-green",
    border: "border-growth-green",
    ring: "ring-growth-green/45",
    ringSoft: "ring-growth-green/30",
    borderAccent: "border-l-growth-green/50",
    selected: "bg-growth-green/14 ring-2 ring-growth-green/45 font-semibold text-foreground shadow-sm",
  },
  reading: {
    stroke: "var(--color-logo-gold)",
    text: "text-logo-gold",
    bgSoft: "bg-logo-gold/10",
    bg: "bg-logo-gold",
    border: "border-logo-gold",
    ring: "ring-logo-gold/45",
    ringSoft: "ring-logo-gold/30",
    borderAccent: "border-l-logo-gold/50",
    selected: "bg-logo-gold/14 ring-2 ring-logo-gold/45 font-semibold text-foreground shadow-sm",
  },
  writing: {
    stroke: "var(--color-logo-teal)",
    text: "text-logo-teal",
    bgSoft: "bg-logo-teal/10",
    bg: "bg-logo-teal",
    border: "border-logo-teal",
    ring: "ring-logo-teal/45",
    ringSoft: "ring-logo-teal/30",
    borderAccent: "border-l-logo-teal/50",
    selected: "bg-logo-teal/14 ring-2 ring-logo-teal/45 font-semibold text-foreground shadow-sm",
  },
};

export function domainBrand(domain: string): DomainBrandTokens {
  return DOMAIN_BRAND_COLORS[resolveDomainBrandKey(domain)];
}

export function domainBrandStroke(domain: string): string {
  return domainBrand(domain).stroke;
}
