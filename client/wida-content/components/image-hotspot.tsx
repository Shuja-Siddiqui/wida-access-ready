import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageHotspotQuestion } from "../types";

const LABELS = ["A", "B", "C"];

interface Props {
  question: ImageHotspotQuestion;
  onSubmit: (selectedIndex: number) => void;
  showResult?: boolean;
}

export function ImageHotspot({ question, onSubmit, showResult = false }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onSubmit(selected);
  };

  const getOptionStyle = (i: number) => {
    if (!submitted || !showResult) {
      return selected === i
        ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
        : "border-border bg-card hover:border-primary/50 hover:bg-primary/5";
    }
    if (i === question.correctIndex) return "border-green-500 bg-green-500 text-white";
    if (i === selected) return "border-destructive bg-destructive text-white";
    return "border-border bg-card opacity-40";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <p className="text-base font-bold text-foreground">{question.question}</p>

      <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-sm">
        <img
          src={question.imageUrl}
          alt="Look at this picture"
          className="w-full max-h-64 object-cover"
        />
        {question.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs font-medium px-3 py-1.5">
            {question.caption}
          </div>
        )}
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Choose the correct answer:
      </p>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={submitted}
            onClick={() => setSelected(i)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-4 text-sm font-semibold transition-all",
              getOptionStyle(i),
            )}
          >
            <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[10px] font-black">
              {submitted && showResult && i === question.correctIndex
                ? <CheckCircle className="w-3.5 h-3.5" />
                : submitted && showResult && i === selected && i !== question.correctIndex
                ? <XCircle className="w-3.5 h-3.5" />
                : LABELS[i]}
            </span>
            {opt}
          </button>
        ))}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Submit Answer
        </button>
      )}

      {submitted && showResult && (
        <p className={cn(
          "text-center text-sm font-bold",
          selected === question.correctIndex ? "text-green-600" : "text-destructive",
        )}>
          {selected === question.correctIndex ? "Correct! Great job." : `Correct answer: ${LABELS[question.correctIndex]}`}
        </p>
      )}
    </motion.div>
  );
}
