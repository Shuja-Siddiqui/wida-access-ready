import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListeningAudioPlayer } from "./listening-audio-player";
import type { ListeningImageGridQuestion } from "../types";

const LABELS = ["A", "B", "C"];

interface Props {
  question: ListeningImageGridQuestion;
  onSubmit: (selectedIndex: number) => void;
  showResult?: boolean;
}

export function ListeningImageGrid({ question, onSubmit, showResult = false }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    onSubmit(selected);
  };

  const getBorder = (i: number) => {
    if (!submitted || !showResult) {
      return selected === i
        ? "ring-4 ring-primary border-primary"
        : "border-border hover:border-primary/50";
    }
    if (i === question.correctIndex) return "ring-4 ring-green-500 border-green-500";
    if (i === selected) return "ring-4 ring-destructive border-destructive";
    return "border-border opacity-50";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
      <ListeningAudioPlayer audioScript={question.audioScript} audioUrl={question.audioUrl} />

      <div className="rounded-xl bg-muted/60 border border-border px-4 py-3 text-center">
        <p className="text-base font-bold text-foreground">{question.instruction}</p>
        <p className="text-xs text-muted-foreground font-medium mt-1">Tap the correct picture</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.images.map((img, i) => (
          <button
            key={i}
            type="button"
            disabled={submitted}
            onClick={() => setSelected(i)}
            className={cn(
              "relative rounded-2xl border-2 overflow-hidden transition-all",
              getBorder(i),
            )}
          >
            <img
              src={img.url}
              alt={img.altText ?? img.label}
              className="w-full aspect-square object-cover"
            />

            <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-black">
              {LABELS[i]}
            </div>

            {submitted && showResult && (
              <div className={cn(
                "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center",
                i === question.correctIndex ? "bg-green-500" : i === selected ? "bg-destructive" : "hidden",
              )}>
                {i === question.correctIndex
                  ? <CheckCircle className="w-4 h-4 text-white" />
                  : <XCircle className="w-4 h-4 text-white" />}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs font-bold py-1.5 text-center">
              {img.label}
            </div>
          </button>
        ))}
      </div>

      {submitted && showResult && (
        <p className={cn(
          "text-center text-sm font-bold",
          selected === question.correctIndex ? "text-green-600" : "text-destructive",
        )}>
          {selected === question.correctIndex
            ? "Correct! Great listening!"
            : `Correct answer: ${LABELS[question.correctIndex]} — ${question.images[question.correctIndex].label}`}
        </p>
      )}

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
    </motion.div>
  );
}
