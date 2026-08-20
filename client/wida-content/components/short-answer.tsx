import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ShortAnswerQuestion } from "../types";

interface Props {
  question: ShortAnswerQuestion;
  onSubmit: (answer: string) => void;
  showResult?: boolean;
}

export function ShortAnswer({ question, onSubmit, showResult = false }: Props) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const wordCount = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  const minWords = question.minWords ?? 1;
  const canSubmit = wordCount >= minWords;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    onSubmit(value.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="Question visual"
          className="w-full max-h-52 object-cover rounded-xl border border-border"
        />
      )}

      {question.passage && (
        <div className="rounded-xl bg-muted/60 border border-border p-4 max-h-40 overflow-y-auto text-sm text-foreground leading-relaxed">
          {question.passage}
        </div>
      )}

      <p className="text-base font-bold text-foreground">{question.prompt}</p>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitted}
          placeholder="Write your answer here…"
          rows={5}
          className={cn(
            "w-full rounded-xl border-2 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none transition-colors",
            submitted ? "border-border opacity-70" : "border-border focus:border-primary",
          )}
        />
        <span className={cn(
          "absolute bottom-2.5 right-3 text-xs font-medium",
          canSubmit ? "text-muted-foreground" : "text-destructive",
        )}>
          {wordCount} {wordCount === 1 ? "word" : "words"}
          {question.minWords ? ` / ${question.minWords} min` : ""}
        </span>
      </div>

      {submitted && showResult && question.sampleAnswer && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 space-y-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sample Answer</p>
          <p className="text-sm text-foreground leading-relaxed">{question.sampleAnswer}</p>
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          {canSubmit ? "Submit Answer" : `Write at least ${minWords} word${minWords !== 1 ? "s" : ""}`}
        </button>
      )}

      {submitted && (
        <p className="text-center text-sm font-semibold text-green-600">
          Answer submitted!
        </p>
      )}
    </motion.div>
  );
}
