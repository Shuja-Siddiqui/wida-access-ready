import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListeningAudioPlayer } from "./listening-audio-player";
import type { ListeningClassifyQuestion } from "../types";

interface Props {
  question: ListeningClassifyQuestion;
  onSubmit: (categories: number[]) => void;
  showResult?: boolean;
}

export function ListeningClassify({ question, onSubmit, showResult = false }: Props) {
  const [assignments, setAssignments] = useState<(number | null)[]>(
    Array(question.items.length).fill(null),
  );
  const [submitted, setSubmitted] = useState(false);

  const assign = (itemIdx: number, cat: number) => {
    if (submitted) return;
    setAssignments(prev => {
      const next = [...prev];
      next[itemIdx] = next[itemIdx] === cat ? null : cat;
      return next;
    });
  };

  const unassigned = question.items.filter((_, i) => assignments[i] === null);
  const cat0Items = question.items.filter((_, i) => assignments[i] === 0);
  const cat1Items = question.items.filter((_, i) => assignments[i] === 1);
  const getItemIdx = (item: string) => question.items.indexOf(item);

  const handleSubmit = () => {
    if (assignments.some(a => a === null)) return;
    setSubmitted(true);
    onSubmit(assignments as number[]);
  };

  const isItemCorrect = (itemIdx: number) =>
    submitted && showResult && assignments[itemIdx] === question.correctCategories[itemIdx];

  const allCorrect = submitted && showResult && assignments.every((a, i) => a === question.correctCategories[i]);

  const BucketLabel = ({ catIdx }: { catIdx: number }) => (
    <div className={cn(
      "rounded-t-xl px-3 py-2 text-center text-xs font-black uppercase tracking-wide",
      catIdx === 0 ? "bg-blue-500 text-white" : "bg-violet-500 text-white",
    )}>
      {question.categories[catIdx]}
    </div>
  );

  const Chip = ({ item, catIdx }: { item: string; catIdx: number | null }) => {
    const idx = getItemIdx(item);
    const correct = isItemCorrect(idx);
    const wrong = submitted && showResult && !correct;

    return (
      <motion.button
        layout
        type="button"
        disabled={submitted}
        onClick={() => {
          if (catIdx !== null) {
            assign(idx, catIdx === 0 ? 1 : 0);
          }
        }}
        className={cn(
          "rounded-xl px-3 py-2 text-sm font-bold border-2 flex items-center gap-1.5 transition-all",
          catIdx === null
            ? "border-border bg-card text-foreground hover:border-primary/40"
            : catIdx === 0
            ? "border-blue-400 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            : "border-violet-400 bg-violet-50 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
          submitted && showResult && (
            correct ? "!border-green-500 !bg-green-50 !text-green-700 dark:!bg-green-900/20" :
            wrong ? "!border-destructive !bg-destructive/10 !text-destructive" : ""
          ),
        )}
      >
        {submitted && showResult && (
          correct ? <CheckCircle className="w-3.5 h-3.5" /> : wrong ? <XCircle className="w-3.5 h-3.5" /> : null
        )}
        {item}
      </motion.button>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <ListeningAudioPlayer audioScript={question.audioScript} audioUrl={question.audioUrl} />

      <p className="text-base font-bold text-foreground">
        {question.instruction ?? `Sort each item into one of the two groups below.`}
      </p>

      {/* Unassigned chips */}
      <AnimatePresence>
        {unassigned.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Tap to sort:</p>
            <div className="flex flex-wrap gap-2">
              {unassigned.map(item => {
                const idx = getItemIdx(item);
                return (
                  <div key={item} className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => assign(idx, 0)}
                      className="rounded-xl px-3 py-2 text-sm font-bold border-2 border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:border-blue-500 transition-all"
                    >
                      → {question.categories[0]}
                    </button>
                    <span className="flex items-center text-xs font-bold text-muted-foreground border-2 border-border rounded-xl px-2">
                      {item}
                    </span>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => assign(idx, 1)}
                      className="rounded-xl px-3 py-2 text-sm font-bold border-2 border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 hover:border-violet-500 transition-all"
                    >
                      → {question.categories[1]}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category buckets */}
      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map(catIdx => {
          const items = catIdx === 0 ? cat0Items : cat1Items;
          return (
            <div key={catIdx} className="flex flex-col rounded-xl overflow-hidden border border-border">
              <BucketLabel catIdx={catIdx} />
              <div className="flex-1 min-h-[5rem] p-2 bg-card flex flex-wrap gap-1.5 content-start">
                <AnimatePresence>
                  {items.map(item => (
                    <Chip key={item} item={item} catIdx={catIdx} />
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground font-medium italic w-full text-center py-3">
                    Drop items here
                  </p>
                )}
              </div>
            </div>
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
          {allCorrect ? "All correct! Great listening!" : (
            <>
              <p className="font-bold mb-1.5">Correct grouping:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {([0, 1] as const).map(catIdx => (
                  <div key={catIdx}>
                    <p className="font-bold mb-1">{question.categories[catIdx]}:</p>
                    <ul className="space-y-0.5">
                      {question.items
                        .filter((_, i) => question.correctCategories[i] === catIdx)
                        .map(item => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={assignments.some(a => a === null)}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Submit Groups
        </button>
      )}
    </motion.div>
  );
}
