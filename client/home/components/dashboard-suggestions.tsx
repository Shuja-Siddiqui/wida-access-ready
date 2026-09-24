import { useMemo, useState } from "react";
import { Sparkles, Square, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { domainLabel } from "../home-types";
import { SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
      className="bg-card rounded-2xl shadow-sm border border-primary/30 p-6 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent)" }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-start gap-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Coach suggestion{active ? ` · ${domainLabel(active.domain)}` : ""}
              </div>
              <p className="font-medium text-lg leading-snug text-foreground">{displayMessage}</p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={isPlayingThis ? "Stop audio" : "Listen to suggestion"}
              onClick={() => (isPlayingThis ? onStopSpeaking() : onSpeak(displayMessage))}
              className={cn(
                "shrink-0 h-10 w-10 rounded-xl border-primary/25 bg-primary/5 hover:bg-primary/10",
                isPlayingThis && "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200",
              )}
            >
              {isPlayingThis ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Volume2 className={cn("w-4 h-4", theme.icon)} />
              )}
            </Button>
          </div>

          {sorted.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {sorted.map((item, idx) => (
                <button
                  key={item.domain}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors",
                    idx === safeIdx
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {domainLabel(item.domain)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
