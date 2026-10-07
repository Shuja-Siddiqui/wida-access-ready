import { Headphones, Mic, BookOpen, PenLine } from "lucide-react";



export type AnswerRecord = {

  question: string;

  content: unknown;

  submittedAnswer: unknown;

  correct: boolean;

};



export type View = "home" | "loading" | "session" | "error" | "complete" | "finishing";



/**

 * Domain config entries drive the dashboard UI (icon, colour, label) and also

 * encode the canonical API payload for starting a session.

 *

 * apiDomain — the core skill sent to POST /sessions/start  (always one of the 4 base domains)

 * tier      — always "academic" (WIDA SF content across all domains)

 *

 * The actual API call uses { domain: apiDomain, tier }.

 */

export interface DomainConfig {

  icon: typeof Headphones;

  color: string;

  bg: string;

  border: string;

  btnBg: string;

  label?: string;

  apiDomain: string;

  tier: "academic";

}



export const DOMAIN_CONFIG: Record<string, DomainConfig> = {

  listening:          { icon: Headphones,    color: "text-trust-blue",      bg: "bg-trust-blue/10",      border: "border-trust-blue",      btnBg: "bg-trust-blue",      label: "Listening",           apiDomain: "listening", tier: "academic" },

  speaking:           { icon: Mic,           color: "text-growth-green",    bg: "bg-growth-green/10",    border: "border-growth-green",    btnBg: "bg-growth-green",                                  apiDomain: "speaking",  tier: "academic" },

  reading:            { icon: BookOpen,      color: "text-logo-gold",   bg: "bg-logo-gold/10",   border: "border-logo-gold",   btnBg: "bg-logo-gold",                                 apiDomain: "reading",   tier: "academic" },

  writing:            { icon: PenLine,       color: "text-logo-teal",  bg: "bg-logo-teal/10",  border: "border-logo-teal",  btnBg: "bg-logo-teal",  label: "Writing",           apiDomain: "writing",   tier: "academic" },

  // Legacy aliases — progress API may still return *_academic from older rows.

  reading_academic:   { icon: BookOpen,      color: "text-logo-gold",   bg: "bg-logo-gold/10",   border: "border-logo-gold",   btnBg: "bg-logo-gold",   label: "Reading",           apiDomain: "reading",   tier: "academic" },

  writing_academic:   { icon: PenLine,       color: "text-logo-teal",  bg: "bg-logo-teal/10",  border: "border-logo-teal",  btnBg: "bg-logo-teal",  label: "Writing",           apiDomain: "writing",   tier: "academic" },

  // Legacy alias — old progress rows used listening_academic before SF-only migration.

  listening_academic: { icon: Headphones,    color: "text-trust-blue",      bg: "bg-trust-blue/10",      border: "border-trust-blue",      btnBg: "bg-trust-blue",      label: "Listening",           apiDomain: "listening", tier: "academic" },

};



/** Returns the user-facing label for a domain config key. */

export function domainLabel(domainKey: string): string {

  return DOMAIN_CONFIG[domainKey]?.label ?? (domainKey.charAt(0).toUpperCase() + domainKey.slice(1));

}



/**

 * Derives a UI domain config key from a (domain, tier) pair returned by the API.

 */

export function domainTierToKey(domain: string, _tier: string = "academic"): string {

  if (domain === "listening_academic") return "listening";

  if (domain.endsWith("_academic")) return domain.replace(/_academic$/, "");

  return domain;

}



/** Maps a dashboard / URL domain key to the POST /sessions/start payload. */

export function resolveSessionStartFromUiKey(domainKey: string): {

  apiDomain: string;

  tier: "academic";

} {

  const cfg = DOMAIN_CONFIG[domainKey];

  if (cfg) return { apiDomain: cfg.apiDomain, tier: cfg.tier };



  if (domainKey === "writing" || domainKey === "writing_academic") {

    return { apiDomain: "writing", tier: "academic" };

  }

  if (domainKey === "listening_academic") {

    return { apiDomain: "listening", tier: "academic" };

  }

  if (domainKey.endsWith("_academic")) {

    return { apiDomain: domainKey.replace(/_academic$/, ""), tier: "academic" };

  }

  return { apiDomain: domainKey, tier: "academic" };

}

