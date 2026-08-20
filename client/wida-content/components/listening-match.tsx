import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListeningAudioPlayer } from "./listening-audio-player";
import type { ListeningMatchQuestion } from "../types";

const PAIR_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300",
  "bg-violet-100 border-violet-400 text-violet-800 dark:bg-violet-900/30 dark:border-violet-500 dark:text-violet-300",
  "bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300",
  "bg-teal-100 border-teal-400 text-teal-800 dark:bg-teal-900/30 dark:border-teal-500 dark:text-teal-300",
  "bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-900/30 dark:border-rose-500 dark:text-rose-300",
];

interface Props {
  question: ListeningMatchQuestion;
  onSubmit: (pairs: number[]) => void;
  showResult?: boolean;
}

export function ListeningMatch({ question, onSubmit, showResult = false }: Props) {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [pairs, setPairs] = useState<(number | null)[]>(Array(question.leftItems.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const pairedRight = pairs.filter(p => p !== null) as number[];

  const handleLeftClick = (i: number) => {
    if (submitted) return;
    setSelectedLeft(selectedLeft === i ? null : i);
  };

  const handleRightClick = (ri: number) => {
    if (submitted || selectedLeft === null) return;
    const next = [...pairs];
    const existing = next.findIndex(p => p === ri);
    if (existing !== -1) next[existing] = null;
    next[selectedLeft] = ri;
    setPairs(next);
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    if (pairs.some(p => p === null)) return;
    setSubmitted(true);
    onSubmit(pairs as number[]);
  };

  const leftColor = (i: number) => pairs[i] !== null ? PAIR_COLORS[i % PAIR_COLORS.length] : null;
  const rightColor = (ri: number) => {
    const li = pairs.findIndex(p => p === ri);
    return li !== -1 ? PAIR_COLORS[li % PAIR_COLORS.length] : null;
  };

  const isLeftCorrect = (i: number) => submitted && showResult && pairs[i] === question.correctPairs[i];
  const allCorrect = submitted && showResult && pairs.every((p, i) => p === question.correctPairs[i]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <ListeningAudioPlayer audioScript={question.audioScript} audioUrl={question.audioUrl} />

      <p className="text-base font-bold text-foreground">
        {question.instruction ?? "Match each item on the left with the correct one on the right."}
      </p>

      {!submitted && selectedLeft !== null && (
        <p className="text-xs font-semibold text-primary text-center animate-pulse">
          Now tap the matching item on the right →
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground text-center">Column A</p>
          {question.leftItems.map((item, i) => {
            const color = leftColor(i);
            const correct = isLeftCorrect(i);
            const wrong = submitted && showResult && !correct;
            const isImage = item.startsWith("http") || item.startsWith("/");

            return (
              <button
                key={i}
                type="button"
                disabled={submitted}
                onClick={() => handleLeftClick(i)}
                className={cn(
                  "w-full rounded-xl border-2 px-2 py-2.5 text-sm font-semibold text-center transition-all min-h-[3rem] flex items-center justify-center gap-1.5",
                  submitted && showResult
                    ? correct ? "border-green-500 bg-green-500/10 text-green-700" : "border-destructive bg-destructive/10 text-destructive"
                    : color ? cn(color, "border-2")
                    : selectedLeft === i ? "border-primary bg-primary/10 text-primary scale-[1.02]"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {submitted && showResult && (correct
                  ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />)}
                {isImage
                  ? <img src={item} alt={`Left ${i}`} className="h-14 w-full object-cover rounded-lg" />
                  : item}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground text-center">Column B</p>
          {question.rightItems.map((item, ri) => {
            const color = rightColor(ri);
            const isPaired = pairedRight.includes(ri);
            const isImage = item.startsWith("http") || item.startsWith("/");

            return (
              <button
                key={ri}
                type="button"
                disabled={submitted}
                onClick={() => handleRightClick(ri)}
                className={cn(
                  "w-full rounded-xl border-2 px-2 py-2.5 text-sm font-semibold text-center transition-all min-h-[3rem] flex items-center justify-center",
                  submitted ? "border-border bg-card opacity-80"
                    : color ? cn(color, "border-2")
                    : selectedLeft !== null && !isPaired ? "border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10"
                    : "border-border bg-card",
                )}
              >
                {isImage
                  ? <img src={item} alt={`Right ${ri}`} className="h-14 w-full object-cover rounded-lg" />
                  : item}
              </button>
            );
          })}
        </div>
      </div>

      {submitted && showResult && (
        <div className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          allCorrect ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700" : "border-border bg-muted/50 text-foreground",
        )}>
          {allCorrect ? "All matches correct! Great listening!" : (
            <>
              <p className="font-bold mb-1.5">Correct matches:</p>
              <ul className="space-y-0.5">
                {question.leftItems.map((left, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">{left}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{question.rightItems[question.correctPairs[i]]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pairs.some(p => p === null)}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Submit Matches
        </button>
      )}
    </motion.div>
  );
}
