import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListeningAudioPlayer } from "./listening-audio-player";
import type { ListeningSequenceQuestion } from "../types";

interface Props {
  question: ListeningSequenceQuestion;
  onSubmit: (order: number[]) => void;
  showResult?: boolean;
}

export function ListeningSequence({ question, onSubmit, showResult = false }: Props) {
  const [order, setOrder] = useState<number[]>(
    () => [...question.items.map((_, i) => i)].sort(() => Math.random() - 0.5),
  );
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

  const allCorrect = submitted && showResult && order.every((itemIdx, pos) => question.correctOrder[itemIdx] === pos);

  const isItemCorrect = (itemIdx: number, pos: number) =>
    submitted && showResult && question.correctOrder[itemIdx] === pos;

  const isItemWrong = (itemIdx: number, pos: number) =>
    submitted && showResult && question.correctOrder[itemIdx] !== pos;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <ListeningAudioPlayer audioScript={question.audioScript} audioUrl={question.audioUrl} />

      <p className="text-base font-bold text-foreground">
        {question.instruction ?? "Put the events in the order you heard them."}
      </p>

      <div className="flex flex-col gap-2">
        {order.map((itemIdx, pos) => {
          const correct = isItemCorrect(itemIdx, pos);
          const wrong = isItemWrong(itemIdx, pos);
          const hasImage = question.items[itemIdx].startsWith("http") || question.items[itemIdx].startsWith("/");

          return (
            <motion.div
              key={itemIdx}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-3 py-3 transition-colors",
                correct ? "border-green-500 bg-green-500/10"
                  : wrong ? "border-destructive bg-destructive/10"
                  : "border-border bg-card",
              )}
            >
              <span className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black",
                correct ? "bg-green-500 text-white"
                  : wrong ? "bg-destructive text-white"
                  : "bg-muted text-muted-foreground",
              )}>
                {correct ? <CheckCircle className="w-4 h-4" /> : pos + 1}
              </span>

              {hasImage ? (
                <img
                  src={question.items[itemIdx]}
                  alt={`Step ${pos + 1}`}
                  className="flex-1 h-20 object-cover rounded-lg"
                />
              ) : (
                <p className="flex-1 text-sm font-medium text-foreground">{question.items[itemIdx]}</p>
              )}

              {!submitted && (
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(pos)}
                    disabled={pos === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(pos)}
                    disabled={pos === order.length - 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-20 transition-colors"
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
          allCorrect
            ? "border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "border-border bg-muted/50 text-foreground",
        )}>
          {allCorrect ? "Perfect order! Great listening!" : (
            <>
              <p className="font-bold mb-1.5">Correct order:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                {question.items
                  .map((item, i) => ({ item, correctPos: question.correctOrder[i] }))
                  .sort((a, b) => a.correctPos - b.correctPos)
                  .map(({ item }, i) => <li key={i} className="text-xs">{item}</li>)}
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
