import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext } from "../session-context";
import { useUser } from "@/contexts/user-context";
import { useApi } from "@/hooks/use-api";
import { ItemCoachingCard, coachingSpeech, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons } from "./answer-step-buttons";

export function SessionFeedbackBar() {
  const {
    showFeedback, lastCorrect, currentQ, qIdx, questions, onNext, onRetryQuestion,
    session, studentLevel, activeDomain, selectedIdx, speakFeedback, onStopSpeaking,
  } = useSessionContext();
  const { studentId } = useUser();
  const { request } = useApi();
  const [coach, setCoach] = useState<ItemFeedbackPayload | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachSettled, setCoachSettled] = useState(false);

  const isLastQuestion = qIdx >= questions.length - 1;
  const data = session.content?.data;
  const passed = aiItemPassed(coach, lastCorrect);
  const waitingCoach = showFeedback && !coachSettled;
  const nextAction = waitingCoach ? undefined : passed ? "next" : "retry";

  useEffect(() => {
    if (!showFeedback || !studentId || !currentQ) {
      setCoach(null);
      setCoachSettled(false);
      return;
    }
    let cancelled = false;
    setCoachLoading(true);
    setCoachSettled(false);
    const correctIdx = typeof currentQ.correct === "number" ? currentQ.correct : 0;
    request<ItemFeedbackPayload>(`/api/students/${studentId}/item-feedback`, {
      method: "POST",
      body: JSON.stringify({
        domain: (session.content.type || activeDomain).replace("_academic", ""),
        level: studentLevel,
        format: "selected_response",
        question: currentQ.question,
        studentAnswer: String(currentQ.options?.[selectedIdx] ?? (lastCorrect ? "correct choice" : "wrong choice")),
        correctAnswer: currentQ.options?.[correctIdx],
        correct: lastCorrect,
        passage: data?.audioScript ?? data?.passage,
        options: currentQ.options,
        imageDescription: data?.imageDescription || undefined,
        imageTags: data?.imageTags ?? data?.tags,
      }),
    })
      .then((fb) => {
        if (!cancelled) setCoach(fb);
      })
      .catch(() => {
        if (!cancelled) setCoach(null);
      })
      .finally(() => {
        if (!cancelled) {
          setCoachLoading(false);
          setCoachSettled(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showFeedback, lastCorrect, currentQ, studentId, studentLevel, activeDomain, session, data, request, selectedIdx]);

  return (
    <AnimatePresence>
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className={`rounded-2xl border overflow-hidden ${
            coachLoading
              ? "border-border/40 bg-card"
              : passed
                ? "border-growth-green/30 bg-growth-green/[0.06]"
                : "border-destructive/25 bg-destructive/[0.05]"
          }`}
        >
          <div className={`h-1 w-full ${coachLoading ? "bg-border" : passed ? "bg-growth-green" : "bg-destructive"}`} />

          <div className="px-4 py-3.5 space-y-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  coachLoading ? "bg-muted" : passed ? "bg-growth-green/15" : "bg-destructive/10"
                }`}
              >
                {coachLoading
                  ? null
                  : passed
                    ? <CheckCircle2 className="w-4.5 h-4.5 text-growth-green" style={{ width: 18, height: 18 }} />
                    : <XCircle      className="w-4.5 h-4.5 text-destructive"  style={{ width: 18, height: 18 }} />
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-bold text-sm ${coachLoading ? "text-muted-foreground" : passed ? "text-growth-green" : "text-destructive"}`}>
                  {coachLoading ? "Checking your answer…" : passed ? "Correct!" : "Not quite"}
                </p>
                <div className="mt-2">
                  <ItemCoachingCard
                    feedback={coach}
                    loading={coachLoading}
                    speakText={speakFeedback}
                    stopSpeaking={onStopSpeaking}
                    nextAction={nextAction}
                  />
                  {!coachLoading && !coachingSpeech(coach) && currentQ?.explanation && (
                    <p className="text-foreground/70 text-xs mt-0.5 leading-snug">
                      {passed ? `Yes. ${currentQ.explanation}` : currentQ.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <AnswerStepButtons
              loading={coachLoading}
              passed={passed}
              isLast={isLastQuestion}
              onAdvance={onNext}
              onRetry={onRetryQuestion}
              layout="row"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
