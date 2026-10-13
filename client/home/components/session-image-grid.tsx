import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSessionContext } from "../session-context";
import { SESSION_QUESTION } from "./session-ui-styles";
import { cn } from "@/lib/utils";

const PLACEHOLDER_GRADIENTS = [
  "from-slate-200/80 to-slate-300/60 dark:from-slate-700/50 dark:to-slate-800/40",
  "from-slate-200/80 to-slate-300/60 dark:from-slate-700/50 dark:to-slate-800/40",
  "from-slate-200/80 to-slate-300/60 dark:from-slate-700/50 dark:to-slate-800/40",
  "from-slate-200/80 to-slate-300/60 dark:from-slate-700/50 dark:to-slate-800/40",
];

export function SessionImageGrid() {
  const { currentQ, showFeedback, selectedIdx, onAnswer } = useSessionContext();

  if (!currentQ) return null;

  return (
    <div className="space-y-4">
      <h3 className={SESSION_QUESTION}>{currentQ.question}</h3>

      <div className="grid grid-cols-2 gap-3 w-full max-w-md sm:max-w-lg mx-auto lg:mx-0 lg:max-w-none">
        {(currentQ.options ?? []).map((opt, i) => {
          const imgSrc     = currentQ.imageUrls?.[i] ?? "";
          const isCorrect  = i === currentQ.correct;
          const isSelected = i === selectedIdx;

          let borderColor = "border-transparent";
          let shadowColor = "";
          let dimmed      = false;

          if (showFeedback) {
            if (isCorrect)       { borderColor = "border-emerald-500/50"; shadowColor = "shadow-emerald-500/15"; }
            else if (isSelected) { borderColor = "border-rose-500/45";  shadowColor = "shadow-rose-500/10"; dimmed = true; }
            else                 { dimmed = true; }
          } else if (isSelected) {
            borderColor = "border-sky-500/45";
            shadowColor = "shadow-sky-500/15";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onAnswer(i)}
              disabled={showFeedback}
              className={cn(
                "relative flex flex-col rounded-lg overflow-hidden border transition-all duration-200",
                borderColor,
                shadowColor && `shadow-md ${shadowColor}`,
                dimmed && "opacity-40",
                !showFeedback ? "cursor-pointer hover:border-sky-500/40" : "cursor-default",
              )}
            >
              {/* Image area — landscape 4:3 */}
              <div className={`relative w-full aspect-[4/3] bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[i]}`}>
                {!imgSrc && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">{["A", "B", "C"][i]}</span>
                  </div>
                )}
                {imgSrc && (
                  <img
                    src={imgSrc}
                    alt={opt}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                )}

                {/* Feedback badge */}
                <AnimatePresence>
                  {showFeedback && (isCorrect || isSelected) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className={`absolute bottom-2 right-2 w-6 h-6 rounded-md flex items-center justify-center shadow-sm ${
                        isCorrect ? "bg-emerald-600" : "bg-rose-600"
                      }`}
                    >
                      {isCorrect
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <XCircle      className="w-4 h-4 text-white" />
                      }
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected glow overlay (pre-feedback) */}
                {isSelected && !showFeedback && (
                  <div className="absolute inset-0 bg-sky-500/8" />
                )}
              </div>

              {/* Caption */}
              <div
                className={cn(
                  "px-3 py-2 text-center text-[13px] font-medium leading-tight transition-colors duration-200 border-t border-border/40",
                  showFeedback && isCorrect && "bg-emerald-500/[0.06] text-emerald-800 dark:text-emerald-200",
                  showFeedback && isSelected && !isCorrect && "bg-rose-500/[0.05] text-rose-800 dark:text-rose-200",
                  isSelected && !showFeedback && "bg-sky-500/[0.05] text-foreground",
                  !isSelected && !showFeedback && "bg-card text-muted-foreground",
                )}
              >
                {opt}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
