import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext } from "../session-context";

export function SessionFeedbackBar() {
  const { showFeedback, lastCorrect, currentQ, qIdx, questions, onNext } =
    useSessionContext();

  const isLastQuestion = qIdx >= questions.length - 1;
  const explanation    = currentQ?.explanation;

  return (
    <AnimatePresence>
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className={`rounded-2xl border overflow-hidden ${
            lastCorrect
              ? "border-growth-green/30 bg-growth-green/[0.06]"
              : "border-destructive/25 bg-destructive/[0.05]"
          }`}
        >
          {/* Coloured top accent line */}
          <div className={`h-1 w-full ${lastCorrect ? "bg-growth-green" : "bg-destructive"}`} />

          <div className="px-4 py-3.5 flex items-center justify-between gap-4">
            {/* Left: icon + text */}
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  lastCorrect ? "bg-growth-green/15" : "bg-destructive/10"
                }`}
              >
                {lastCorrect
                  ? <CheckCircle2 className="w-4.5 h-4.5 text-growth-green" style={{ width: 18, height: 18 }} />
                  : <XCircle      className="w-4.5 h-4.5 text-destructive"  style={{ width: 18, height: 18 }} />
                }
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-sm ${lastCorrect ? "text-growth-green" : "text-destructive"}`}>
                  {lastCorrect ? "Correct!" : "Not quite"}
                </p>
                {!lastCorrect && explanation && (
                  <p className="text-foreground/70 text-xs mt-0.5 leading-snug">{explanation}</p>
                )}
              </div>
            </div>

            {/* Right: Next / Finish button */}
            <Button
              onClick={onNext}
              size="sm"
              className={`flex-shrink-0 rounded-xl font-semibold text-white px-4 h-9 shadow-sm ${
                lastCorrect
                  ? "bg-growth-green hover:bg-growth-green/90"
                  : "bg-destructive hover:bg-destructive/90"
              }`}
            >
              {isLastQuestion ? "Finish" : "Next"}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
