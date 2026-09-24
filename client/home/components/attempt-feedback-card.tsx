import { Lightbulb, ListChecks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type AttemptFeedbackPayload = {
  summary: string;
  mistakes: Array<{
    question: string;
    whatHappened: string;
    howToImprove: string;
  }>;
  strengths: string[];
  nextSteps: string[];
};

export function AttemptFeedbackCard({
  feedback,
  className,
  compact = false,
}: {
  feedback: AttemptFeedbackPayload;
  className?: string;
  compact?: boolean;
}) {
  const mistakes = compact ? feedback.mistakes.slice(0, 2) : feedback.mistakes;
  const strengths = compact ? feedback.strengths.slice(0, 2) : feedback.strengths;
  const nextSteps = compact ? feedback.nextSteps.slice(0, 2) : feedback.nextSteps;

  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card overflow-hidden mb-8 shadow-sm text-left", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-trust-blue/5">
        <Sparkles className="w-4 h-4 text-trust-blue" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground">
          Coach notes
        </span>
      </div>
      <div className={cn("px-4 space-y-3", compact ? "py-3" : "py-4 space-y-4")}>
        <p className={cn("font-medium text-foreground leading-snug", compact ? "text-sm line-clamp-3" : "text-sm leading-relaxed")}>
          {feedback.summary}
        </p>

        {mistakes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-destructive mb-1.5">
              Misses
            </p>
            <ul className="space-y-2">
              {mistakes.map((m, i) => (
                <li key={`${m.question}-${i}`} className="text-sm leading-snug space-y-0.5">
                  <p className="font-semibold text-foreground line-clamp-1">{m.question}</p>
                  {m.howToImprove && (
                    <p className="text-muted-foreground text-xs line-clamp-2">{m.howToImprove}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {strengths.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-growth-green mb-1.5">
              What went well
            </p>
            <ul className="space-y-1">
              {strengths.map((item) => (
                <li key={item} className="text-xs text-foreground/80 leading-snug flex gap-2">
                  <ListChecks className="w-3.5 h-3.5 shrink-0 mt-0.5 text-growth-green" />
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {nextSteps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-trust-blue mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Next time
            </p>
            <ul className="space-y-1">
              {nextSteps.map((item) => (
                <li key={item} className="text-xs text-foreground/80 leading-snug flex gap-2">
                  <ListChecks className="w-3.5 h-3.5 shrink-0 mt-0.5 text-trust-blue" />
                  <span className="line-clamp-2">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
