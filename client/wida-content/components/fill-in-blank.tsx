import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FillInBlankQuestion } from "../types";

interface Props {
  question: FillInBlankQuestion;
  onSubmit: (answer: string) => void;
  showResult?: boolean;
}

export function FillInBlank({ question, onSubmit, showResult = false }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) return;
    setSubmitted(true);
    onSubmit(value.trim());
  };

  const isCorrect =
    submitted &&
    value.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

  const parts = question.sentence.split("___");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {question.instruction && (
        <p className="text-sm font-semibold text-muted-foreground">{question.instruction}</p>
      )}

      <div className="rounded-xl bg-muted/60 border border-border p-5">
        <p className="text-base font-medium text-foreground leading-relaxed flex flex-wrap items-end gap-1">
          {parts[0]}
          <span className="inline-flex flex-col items-center mx-1">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitted}
              placeholder="type here…"
              className={cn(
                "border-b-2 bg-transparent outline-none text-center text-base font-bold transition-colors min-w-[120px] px-2 pb-0.5",
                submitted
                  ? isCorrect
                    ? "border-green-500 text-green-600"
                    : "border-destructive text-destructive"
                  : "border-primary text-foreground placeholder:text-muted-foreground/50 focus:border-primary",
              )}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </span>
          {parts[1] ?? ""}
        </p>
      </div>

      {submitted && showResult && (
        <div className={cn(
          "rounded-xl border px-4 py-3 text-sm font-medium",
          isCorrect
            ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "border-destructive/40 bg-destructive/5 text-destructive",
        )}>
          {isCorrect
            ? "Correct! Great job."
            : `The correct answer is: "${question.correctAnswer}"`}
        </div>
      )}

      {question.hint && !submitted && (
        <div>
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          {showHint && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2"
            >
              {question.hint}
            </motion.p>
          )}
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Submit Answer
        </button>
      )}
    </motion.div>
  );
}
