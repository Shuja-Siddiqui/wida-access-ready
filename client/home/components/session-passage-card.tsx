import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SESSION_CARD, SESSION_LABEL, SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";

/** Printable story / passage — shown beside questions, not as image caption. */
export function SessionPassageCard({
  passage,
  domain = "reading",
  label = "Story",
  className,
}: {
  passage: string;
  domain?: SessionDomainKey;
  label?: string;
  className?: string;
}) {
  const theme = SESSION_THEMES[domain];

  return (
    <div
      className={cn(
        SESSION_CARD,
        "p-4 sm:p-5 space-y-3 shrink-0",
        "border-l-2",
        theme.borderAccent,
        theme.panel,
        className,
      )}
    >
      <div className="flex gap-3 items-start min-w-0">
        <BookOpen className={cn("w-4 h-4 mt-0.5 shrink-0", theme.icon)} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className={SESSION_LABEL}>{label}</p>
          <p className="text-[15px] sm:text-base text-foreground leading-[1.75] whitespace-pre-line break-words">
            {passage}
          </p>
        </div>
      </div>
    </div>
  );
}
