import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SequenceOrderQuestion } from "../types";

interface Props {
  question: SequenceOrderQuestion;
  onSubmit: (order: number[]) => void;
  showResult?: boolean;
}

export function SequenceOrder({ question, onSubmit, showResult = false }: Props) {
  const [order, setOrder] = useState<number[]>(question.items.map((_, i) => i));
  const [submitted, setSubmitted] = useState(false);

  const moveUp = (pos: number) => {
    if (pos === 0 || submitted) return;
    const next = [...order];
    [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
    setOrder(next);
  };

  const moveDown = (pos: number) => {
    if (pos === order.length - 1 || submitted) return;
    const next = [...order];
    [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]];
    setOrder(next);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(order);
  };

  const isCorrect = submitted && showResult &&
    order.every((itemIdx, pos) => question.correctOrder[itemIdx] === pos);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <p className="text-base font-bold text-foreground">
        {question.instruction ?? "Put the steps in the correct order."}
      </p>

      <div className="flex flex-col gap-2">
        {order.map((itemIdx, pos) => {
          const isItemCorrect = submitted && showResult && question.correctOrder[itemIdx] === pos;
          const isItemWrong = submitted && showResult && question.correctOrder[itemIdx] !== pos;

          return (
            <motion.div
              key={itemIdx}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors",
                isItemCorrect ? "border-green-500 bg-green-500/10" :
                isItemWrong ? "border-destructive bg-destructive/10" :
                "border-border bg-card",
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                isItemCorrect ? "bg-green-500 text-white" :
                isItemWrong ? "bg-destructive text-white" :
                "bg-muted text-muted-foreground",
              )}>
                {isItemCorrect ? <CheckCircle className="w-4 h-4" /> : pos + 1}
              </span>

              <p className="flex-1 text-sm font-medium text-foreground">
                {question.items[itemIdx]}
              </p>

              {!submitted && (
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(pos)}
                    disabled={pos === 0}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(pos)}
                    disabled={pos === order.length - 1}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {submitted && showResult && (
        <div className={cn(
          "rounded-xl border px-4 py-3 text-sm font-medium",
          isCorrect
            ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "border-border bg-muted/50 text-foreground",
        )}>
          {isCorrect ? "Perfect order! Great job." : (
            <>
              <p className="font-bold mb-1">Correct order:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                {question.items
                  .map((item, i) => ({ item, correct: question.correctOrder[i] }))
                  .sort((a, b) => a.correct - b.correct)
                  .map(({ item }, i) => <li key={i}>{item}</li>)}
              </ol>
            </>
          )}
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
        >
          Submit Order
        </button>
      )}
    </motion.div>
  );
}
