import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * After AI item feedback: correct → Next only; incorrect → Try again + Skip.
 */
export function AnswerStepButtons({
  loading,
  passed,
  isLast = false,
  onAdvance,
  onRetry,
  layout = "stack",
}: {
  loading?: boolean;
  passed: boolean;
  isLast?: boolean;
  onAdvance: () => void;
  onRetry: () => void;
  layout?: "stack" | "row";
}) {
  if (loading) return null;

  const nextLabel = isLast ? "Finish" : "Next";

  if (passed) {
    return (
      <div className={cn(layout === "row" ? "flex justify-end" : "flex flex-col")}>
        <Button
          onClick={onAdvance}
          size={layout === "row" ? "sm" : "default"}
          className={cn(
            "rounded-lg font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600",
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
        size={layout === "row" ? "sm" : "default"}
        className={cn(
          "rounded-lg font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500",
          layout === "row" ? "px-4 h-9" : "w-full h-10",
        )}
      >
        <RotateCcw className={cn("mr-1", layout === "row" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        Try again
      </Button>
      <Button
        onClick={onAdvance}
        variant="outline"
        size={layout === "row" ? "sm" : "default"}
        className={cn("rounded-lg font-medium", layout === "row" ? "px-4 h-9" : "w-full h-10")}
      >
        Skip
      </Button>
    </div>
  );
}
