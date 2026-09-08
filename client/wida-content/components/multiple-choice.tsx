import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MultipleChoiceQuestion } from "../types";
import { OptionVisual, StemVisual } from "@/components/shape-glyph";

const LABELS = ["A", "B", "C"];

interface Props {
  question: MultipleChoiceQuestion;
  onSubmit: (selectedIndex: number) => void;
  showResult?: boolean;
}

export function MultipleChoice({ question, onSubmit, showResult = false }: Props) {
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
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5";
    }
    if (i === question.correctIndex) return "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
    if (i === selected) return "border-destructive bg-destructive/10 text-destructive";
    return "border-border bg-card opacity-50";
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
        <div className="rounded-xl bg-muted/60 border border-border p-4 text-sm text-foreground leading-relaxed">
          {question.passage}
        </div>
      )}

      <StemVisual visual={question.visual} />
      <p className="text-base font-bold text-foreground">{question.question}</p>

      <div className="flex flex-col gap-2">
        {question.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={submitted}
            onClick={() => setSelected(i)}
            className={cn(
              "flex items-center gap-3 w-full text-left rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all",
              getOptionStyle(i),
            )}
          >
            <span className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black",
              selected === i && !submitted ? "border-primary bg-primary text-primary-foreground" : "border-current",
              submitted && i === question.correctIndex ? "border-green-500 bg-green-500 text-white" : "",
              submitted && i === selected && i !== question.correctIndex ? "border-destructive bg-destructive text-white" : "",
            )}>
              {submitted && showResult && i === question.correctIndex
                ? <CheckCircle className="w-3.5 h-3.5" />
                : submitted && showResult && i === selected && i !== question.correctIndex
                ? <XCircle className="w-3.5 h-3.5" />
                : LABELS[i]}
            </span>
            <OptionVisual label={opt} diagram={question.optionDiagrams?.[i]} />
          </button>
        ))}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected === null}
          className="mt-1 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
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
