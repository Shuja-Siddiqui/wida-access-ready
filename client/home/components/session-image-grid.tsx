import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSessionContext } from "../session-context";

const PLACEHOLDER_GRADIENTS = [
  "from-sky-300/60 to-indigo-300/60",
  "from-rose-300/60 to-pink-300/60",
  "from-amber-300/60 to-orange-300/60",
  "from-emerald-300/60 to-teal-300/60",
];

const PLACEHOLDER_EMOJI = ["🌿", "🦁", "🍄", "🐛"];

export function SessionImageGrid() {
  const { currentQ, showFeedback, selectedIdx, onAnswer } = useSessionContext();

  if (!currentQ) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground leading-snug">{currentQ.question}</h3>

      {/* max-w-[340px] keeps each cell ≈ 162px — right-sized for 640px webformatURL images */}
      <div className="grid grid-cols-2 gap-3 max-w-[340px]">
        {currentQ.options.map((opt, i) => {
          const imgSrc     = currentQ.imageUrls?.[i] ?? "";
          const isCorrect  = i === currentQ.correct;
          const isSelected = i === selectedIdx;

          let borderColor = "border-transparent";
          let shadowColor = "";
          let dimmed      = false;

          if (showFeedback) {
            if (isCorrect)       { borderColor = "border-growth-green"; shadowColor = "shadow-growth-green/30"; }
            else if (isSelected) { borderColor = "border-destructive";  shadowColor = "shadow-destructive/20"; dimmed = true; }
            else                 { dimmed = true; }
          } else if (isSelected) {
            borderColor = "border-trust-blue";
            shadowColor = "shadow-trust-blue/30";
          }

          return (
            <motion.button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={showFeedback}
              whileTap={{ scale: showFeedback ? 1 : 0.96 }}
              animate={{ opacity: dimmed ? 0.38 : 1 }}
              transition={{ duration: 0.2 }}
              className={`
                relative flex flex-col rounded-2xl overflow-hidden border-2 transition-colors duration-200
                ${borderColor} ${shadowColor && `shadow-lg ${shadowColor}`}
                ${!showFeedback ? "cursor-pointer hover:border-trust-blue/40" : "cursor-default"}
              `}
            >
              {/* Image area — landscape 4:3 */}
              <div className={`relative w-full aspect-[4/3] bg-gradient-to-br ${PLACEHOLDER_GRADIENTS[i]}`}>
                {!imgSrc && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2">
                    <span className="text-2xl opacity-50">{PLACEHOLDER_EMOJI[i]}</span>
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
                      className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${
                        isCorrect ? "bg-growth-green" : "bg-destructive"
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
                  <div className="absolute inset-0 bg-trust-blue/10" />
                )}
              </div>

              {/* Caption */}
              <div
                className={`px-3 py-2 text-center text-[13px] font-semibold leading-tight transition-colors duration-200 ${
                  showFeedback && isCorrect  ? "bg-growth-green/10 text-growth-green"
                  : showFeedback && isSelected ? "bg-destructive/10 text-destructive"
                  : isSelected               ? "bg-trust-blue/8 text-trust-blue"
                  : "bg-card text-foreground/80"
                }`}
              >
                {opt}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
