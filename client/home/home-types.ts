import { Headphones, Mic, BookOpen, PenLine, GraduationCap } from "lucide-react";

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
 * tier      — the curriculum track sent alongside the domain ("general" | "academic")
 *
 * The config key (e.g. "listening_academic") is a UI-layer identifier only;
 * the actual API call uses { domain: apiDomain, tier }.
 */
export interface DomainConfig {
  icon: typeof Headphones;
  color: string;
  bg: string;
  border: string;
  btnBg: string;
  label?: string;
  apiDomain: string;
  tier: "general" | "academic";
}

export const DOMAIN_CONFIG: Record<string, DomainConfig> = {
  listening:          { icon: Headphones,    color: "text-trust-blue",      bg: "bg-trust-blue/10",      border: "border-trust-blue",      btnBg: "bg-trust-blue",      label: "Everyday Listening",  apiDomain: "listening", tier: "general"  },
  listening_academic: { icon: GraduationCap, color: "text-indigo-600",      bg: "bg-indigo-100",         border: "border-indigo-400",      btnBg: "bg-indigo-500",      label: "Academic Listening",  apiDomain: "listening", tier: "academic" },
  speaking:           { icon: Mic,           color: "text-growth-green",    bg: "bg-growth-green/10",    border: "border-growth-green",    btnBg: "bg-growth-green",                                  apiDomain: "speaking",  tier: "general"  },
  reading:            { icon: BookOpen,      color: "text-energy-orange",   bg: "bg-energy-orange/10",   border: "border-energy-orange",   btnBg: "bg-energy-orange",                                 apiDomain: "reading",   tier: "general"  },
  writing:            { icon: PenLine,       color: "text-achieve-purple",  bg: "bg-achieve-purple/10",  border: "border-achieve-purple",  btnBg: "bg-achieve-purple",  label: "Writing",           apiDomain: "writing",   tier: "academic" },
  // Alias — domainTierToKey("writing", "academic") would otherwise produce an unknown key.
  writing_academic:   { icon: PenLine,       color: "text-achieve-purple",  bg: "bg-achieve-purple/10",  border: "border-achieve-purple",  btnBg: "bg-achieve-purple",  label: "Writing",           apiDomain: "writing",   tier: "academic" },
};

/** Returns the user-facing label for a domain config key. */
export function domainLabel(domainKey: string): string {
  return DOMAIN_CONFIG[domainKey]?.label ?? (domainKey.charAt(0).toUpperCase() + domainKey.slice(1));
}

/**
 * Derives a UI domain config key from a (domain, tier) pair returned by the API.
 * (listening, academic) → "listening_academic"
 * (listening, general)  → "listening"
 * (speaking,  general)  → "speaking"
 */
export function domainTierToKey(domain: string, tier: string = "general"): string {
  // Writing is academic-only — UI key stays "writing" (matches progress API).
  if (domain === "writing") return "writing";
  if (tier === "academic") return `${domain}_academic`;
  return domain;
}

/** Maps a dashboard / URL domain key to the POST /sessions/start payload. */
export function resolveSessionStartFromUiKey(domainKey: string): {
  apiDomain: string;
  tier: "general" | "academic";
} {
  const cfg = DOMAIN_CONFIG[domainKey];
  if (cfg) return { apiDomain: cfg.apiDomain, tier: cfg.tier };

  if (domainKey === "writing" || domainKey === "writing_academic") {
    return { apiDomain: "writing", tier: "academic" };
  }
  if (domainKey.endsWith("_academic")) {
    return { apiDomain: domainKey.replace(/_academic$/, ""), tier: "academic" };
  }
  return { apiDomain: domainKey, tier: "general" };
}
