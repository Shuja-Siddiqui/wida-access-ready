import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { WordBankQuestion } from "../types";

interface Props {
  question: WordBankQuestion;
  onSubmit: (answers: string[]) => void;
  showResult?: boolean;
}

export function WordBank({ question, onSubmit, showResult = false }: Props) {
  const totalBlanks = question.sentences.reduce(
    (acc, s) => acc + s.split("___").length - 1,
    0,
  );

  const [filled, setFilled] = useState<(string | null)[]>(Array(totalBlanks).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const usedWords = filled.filter(Boolean) as string[];
  const availableWords = question.wordBank.filter((w) => !usedWords.includes(w));

  const fillNextBlank = (word: string) => {
    const idx = filled.indexOf(null);
    if (idx === -1) return;
    const next = [...filled];
    next[idx] = word;
    setFilled(next);
  };

  const clearBlank = (blankIdx: number) => {
    if (submitted) return;
    const next = [...filled];
    next[blankIdx] = null;
    setFilled(next);
  };

  const handleSubmit = () => {
    if (filled.some((f) => f === null)) return;
    setSubmitted(true);
    onSubmit(filled as string[]);
  };

  let blankIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {question.instruction && (
        <p className="text-sm font-semibold text-muted-foreground">{question.instruction}</p>
      )}

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">Word Bank</p>
        <div className="flex flex-wrap gap-2">
          {question.wordBank.map((word) => {
            const isUsed = !availableWords.includes(word);
            return (
              <button
                key={word}
                type="button"
                disabled={submitted || isUsed}
                onClick={() => !isUsed && fillNextBlank(word)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all",
                  isUsed
                    ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                    : "border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {question.sentences.map((sentence, sIdx) => {
          const parts = sentence.split("___");
          return (
            <div key={sIdx} className="rounded-xl bg-muted/60 border border-border p-4 text-base font-medium text-foreground leading-loose flex flex-wrap items-center gap-1">
              {parts.map((part, pIdx) => {
                const thisBlankIdx = blankIdx;
                if (pIdx < parts.length - 1) blankIdx++;
                const filledWord = filled[thisBlankIdx];
                const isCorrect = submitted && showResult && filledWord === question.correctAnswers[thisBlankIdx];
                const isWrong = submitted && showResult && filledWord !== question.correctAnswers[thisBlankIdx];

                return (
                  <span key={pIdx} className="flex items-center gap-1">
                    {part}
                    {pIdx < parts.length - 1 && (
                      <button
                        type="button"
                        onClick={() => clearBlank(thisBlankIdx)}
                        disabled={submitted || !filledWord}
                        className={cn(
                          "min-w-[80px] px-2 py-0.5 rounded-md border-b-2 text-center text-sm font-bold transition-all",
                          filledWord
                            ? isCorrect
                              ? "border-green-500 bg-green-500/10 text-green-700"
                              : isWrong
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                            : "border-muted-foreground/30 text-muted-foreground/40",
                        )}
                      >
                        {filledWord ?? "___"}
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      {submitted && showResult && (
        <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Correct Answers</p>
          <p className="text-sm text-foreground">{question.correctAnswers.join(", ")}</p>
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={filled.some((f) => f === null)}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Submit Answer
        </button>
      )}
    </motion.div>
  );
}
