import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListeningAudioPlayer } from "./listening-audio-player";
import type { ListeningTrueFalseQuestion } from "../types";

interface Props {
  question: ListeningTrueFalseQuestion;
  onSubmit: (answer: "true" | "false" | "agree" | "disagree") => void;
  showResult?: boolean;
}

export function ListeningTrueFalse({ question, onSubmit, showResult = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isAD = question.mode === "agree_disagree";
  const opts = isAD
    ? [{ value: "agree", label: "Agree", Icon: ThumbsUp }, { value: "disagree", label: "Disagree", Icon: ThumbsDown }]
    : [{ value: "true", label: "True", Icon: CheckCircle }, { value: "false", label: "False", Icon: XCircle }];

  const correct = question.answer;

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    onSubmit(selected as "true" | "false" | "agree" | "disagree");
  };

  const getStyle = (value: string) => {
    if (!submitted || !showResult) {
      return selected === value
        ? "border-primary bg-primary/10 text-primary scale-[1.02]"
        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-foreground";
    }
    if (value === correct) return "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
    if (value === selected) return "border-destructive bg-destructive/10 text-destructive";
    return "border-border bg-card opacity-40";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
      <ListeningAudioPlayer audioScript={question.audioScript} audioUrl={question.audioUrl} />

      <div className="rounded-xl bg-muted/60 border border-border px-5 py-4 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
          {isAD ? "Do you agree or disagree?" : "Is this true or false?"}
        </p>
        <p className="text-base font-bold text-foreground leading-snug">"{question.statement}"</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {opts.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            disabled={submitted}
            onClick={() => setSelected(value)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 py-6 font-bold text-sm transition-all",
              getStyle(value),
            )}
          >
            <Icon className="w-8 h-8" />
            {label}
            {submitted && showResult && value === correct && (
              <span className="text-xs font-black">Correct!</span>
            )}
          </button>
        ))}
      </div>

      {submitted && showResult && (
        <p className={cn(
          "text-center text-sm font-bold",
          selected === correct ? "text-green-600" : "text-destructive",
        )}>
          {selected === correct
            ? "You got it!"
            : `The correct answer is "${correct === "true" || correct === "agree" ? opts[0].label : opts[1].label}"`}
        </p>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          Submit Answer
        </button>
      )}
    </motion.div>
  );
}
