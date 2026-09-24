import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";

/** Writing: require this many submits before Skip is offered on a failed item. */
export const WRITING_ATTEMPTS_BEFORE_SKIP = 2;

/**
 * After AI item feedback: correct → Next only; incorrect → Try again (+ Skip when allowed).
 */
export function AnswerStepButtons({
  loading,
  passed,
  isLast = false,
  onAdvance,
  onRetry,
  layout = "stack",
  allowSkip = true,
  domain,
}: {
  loading?: boolean;
  passed: boolean;
  isLast?: boolean;
  onAdvance: () => void;
  onRetry: () => void;
  layout?: "stack" | "row";
  /** When false, student must try again — no skip (writing early attempts). */
  allowSkip?: boolean;
  domain?: SessionDomainKey;
}) {
  if (loading) return null;

  const nextLabel = isLast ? "Finish" : "Next";
  const primaryBtn = domain ? SESSION_THEMES[domain].primaryBtn : "btn-brand";

  if (passed) {
    return (
      <div className={cn(layout === "row" ? "flex justify-end" : "flex flex-col")}>
        <Button
          onClick={onAdvance}
          variant="ghost"
          size={layout === "row" ? "sm" : "default"}
          className={cn(
            "rounded-xl font-semibold border-0",
            primaryBtn,
            layout === "row" ? "px-4 h-9" : "w-full h-10",
          )}
        >
          {nextLabel}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(layout === "row" ? "flex gap-2 justify-end" : "flex flex-col gap-2")}>
      <Button
        onClick={onRetry}
        variant="ghost"
        size={layout === "row" ? "sm" : "default"}
        className={cn(
          "rounded-xl font-semibold border-0",
          primaryBtn,
          allowSkip ? (layout === "row" ? "px-4 h-9" : "w-full h-10") : "w-full h-10",
        )}
      >
        <RotateCcw className={cn("mr-1", layout === "row" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        Try again
      </Button>
      {allowSkip && (
        <Button
          onClick={onAdvance}
          variant="outline"
          size={layout === "row" ? "sm" : "default"}
          className={cn("rounded-lg font-medium", layout === "row" ? "px-4 h-9" : "w-full h-10")}
        >
          Skip
        </Button>
      )}
    </div>
  );
}
