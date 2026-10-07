import { useMemo, useState } from "react";
import { Sparkles, Square, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { domainLabel } from "../home-types";
import { SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";
import { DASHBOARD_MICRO, DASHBOARD_PANEL } from "./dashboard-ui-styles";

export type PracticeSuggestion = {
  domain: string;
  message: string;
  updatedAt: string;
};

function asDomainKey(domain: string): SessionDomainKey {
  if (domain === "listening" || domain === "speaking" || domain === "reading" || domain === "writing") {
    return domain;
  }
  return "listening";
}

interface DashboardSuggestionsProps {
  suggestions: PracticeSuggestion[];
  nudgeMessage?: string;
  speaking: boolean;
  onSpeak: (text: string) => void;
  onStopSpeaking: () => void;
}

export function DashboardSuggestions({
  suggestions,
  nudgeMessage,
  speaking,
  onSpeak,
  onStopSpeaking,
}: DashboardSuggestionsProps) {
  const sorted = useMemo(
    () => [...suggestions].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [suggestions],
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = sorted.length > 0 ? Math.min(activeIdx, sorted.length - 1) : 0;

  const active = sorted[safeIdx] ?? sorted[0];
  const displayMessage = active?.message ?? nudgeMessage;
  if (!displayMessage) return null;

  const domainKey = active ? asDomainKey(active.domain) : "listening";
  const theme = SESSION_THEMES[domainKey];
  const isPlayingThis = speaking && Boolean(active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className={cn(DASHBOARD_PANEL, "px-3.5 py-3 border-primary/15")}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className={cn(DASHBOARD_MICRO, "flex items-center gap-1.5 min-w-0")}>
          <Sparkles className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">
            Coach suggestion{active ? ` · ${domainLabel(active.domain)}` : ""}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isPlayingThis ? "Stop audio" : "Listen to suggestion"}
          onClick={() => (isPlayingThis ? onStopSpeaking() : onSpeak(displayMessage))}
          className={cn(
            "shrink-0 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground -mr-1",
            isPlayingThis && "text-rose-600 dark:text-rose-400 hover:text-rose-700",
          )}
        >
          {isPlayingThis ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Volume2 className={cn("w-3.5 h-3.5", theme.icon)} />
          )}
        </Button>
      </div>

      <p className="font-medium text-lg leading-snug text-foreground">{displayMessage}</p>

      {sorted.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/10">
          {sorted.map((item, idx) => (
            <button
              key={item.domain}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors",
                idx === safeIdx
                  ? "bg-primary/10 border-primary/25 text-primary"
                  : "bg-transparent border-border/15 text-muted-foreground hover:text-foreground hover:border-border/30",
              )}
            >
              {domainLabel(item.domain)}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
