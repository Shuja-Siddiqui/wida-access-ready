import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SentenceFrameQuestion } from "../types";

interface Props {
  question: SentenceFrameQuestion;
  onSubmit: (answer: string) => void;
}

export function SentenceFrame({ question, onSubmit }: Props) {
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
      <p className="text-base font-bold text-foreground">{question.prompt}</p>

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="Writing prompt visual"
          className="w-full max-h-52 object-cover rounded-xl border border-border"
        />
      )}

      {question.cues && question.cues.length > 0 && (
        <div className="rounded-xl bg-muted/60 border border-border px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Ideas to use</p>
          <ul className="flex flex-col gap-1">
            {question.cues.map((cue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {cue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-primary/70 mb-1.5">Sentence Frame</p>
        <p className="text-sm font-semibold text-foreground italic">{question.frame}</p>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitted}
          placeholder="Use the frame above to write your sentence…"
          rows={4}
          className={cn(
            "w-full rounded-xl border-2 bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none transition-colors",
            submitted ? "border-border opacity-70" : "border-border focus:border-primary",
          )}
        />
        <span className={cn(
          "absolute bottom-2.5 right-3 text-xs font-medium",
          canSubmit ? "text-muted-foreground" : "text-muted-foreground/50",
        )}>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Submit Writing
        </button>
      )}

      {submitted && (
        <p className="text-center text-sm font-semibold text-green-600">Writing submitted!</p>
      )}
    </motion.div>
  );
}
