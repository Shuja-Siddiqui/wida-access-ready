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
            "rounded-xl font-semibold text-white bg-growth-green hover:bg-growth-green/90",
            layout === "row" ? "px-4 h-9 shadow-sm" : "w-full h-12",
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
          "rounded-xl font-semibold text-white bg-growth-green hover:bg-growth-green/90",
          layout === "row" ? "px-4 h-9" : "w-full h-12",
        )}
      >
        <RotateCcw className={cn("mr-1", layout === "row" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        Try again
      </Button>
      <Button
        onClick={onAdvance}
        variant="outline"
        size={layout === "row" ? "sm" : "default"}
        className={cn("rounded-xl font-semibold", layout === "row" ? "px-4 h-9" : "w-full h-12")}
      >
        Skip
      </Button>
    </div>
  );
}
