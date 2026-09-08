import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListeningMCQuestion } from "../types";
import { OptionVisual, StemVisual } from "@/components/shape-glyph";

const LABELS = ["A", "B", "C"];

interface Props {
  question: ListeningMCQuestion;
  onSubmit: (selectedIndex: number) => void;
  showResult?: boolean;
}

export function ListeningMC({ question, onSubmit, showResult = false }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (question.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(question.audioUrl);
        audioRef.current.onended = () => { setPlaying(false); setPlayed(true); };
      }
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
        setPlayed(true);
      }
    } else {
      setPlayed(true);
    }
  };

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
      <div className="rounded-2xl border-2 border-[hsl(338,100%,65%)]/30 bg-[hsl(338,100%,65%)]/5 p-5 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <Volume2 className="w-6 h-6 text-primary" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Listening</p>

        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all",
            playing
              ? "bg-primary text-primary-foreground"
              : "bg-card border-2 border-primary text-primary hover:bg-primary/10",
          )}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? "Pause" : played ? "Play Again" : "Play Audio"}
        </button>

        <button
          type="button"
          onClick={() => setShowScript((v) => !v)}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          {showScript ? "Hide transcript" : "Show transcript"}
        </button>

        {showScript && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="w-full rounded-xl bg-background border border-border p-3 text-sm text-foreground leading-relaxed"
          >
            {question.audioScript}
          </motion.div>
        )}
      </div>

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
