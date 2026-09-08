import { Lightbulb, ListChecks, Sparkles } from "lucide-react";

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

export function AttemptFeedbackCard({ feedback }: { feedback: AttemptFeedbackPayload }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden mb-8 shadow-sm text-left">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40 bg-trust-blue/5">
        <Sparkles className="w-5 h-5 text-trust-blue" />
        <span className="text-xs font-semibold uppercase tracking-widest text-foreground">
          Coach notes
        </span>
      </div>
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm font-medium text-foreground leading-relaxed">{feedback.summary}</p>

        {feedback.mistakes.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-destructive mb-2">
              Misses
            </p>
            <ul className="space-y-3">
              {feedback.mistakes.map((m, i) => (
                <li key={`${m.question}-${i}`} className="text-sm leading-snug space-y-1">
                  <p className="font-semibold text-foreground">{m.question}</p>
                  {m.whatHappened && (
                    <p className="text-muted-foreground">{m.whatHappened}</p>
                  )}
                  {m.howToImprove && (
                    <p className="text-foreground/80">{m.howToImprove}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {feedback.nextSteps.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-trust-blue mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Next time
            </p>
            <ul className="space-y-1.5">
              {feedback.nextSteps.map((item) => (
                <li key={item} className="text-sm text-foreground/80 leading-snug flex gap-2">
                  <ListChecks className="w-4 h-4 shrink-0 mt-0.5 text-trust-blue" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
