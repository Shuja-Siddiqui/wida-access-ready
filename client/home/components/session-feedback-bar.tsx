import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionContext } from "../session-context";
import { useUser } from "@/contexts/user-context";
import { useApi } from "@/hooks/use-api";
import { ItemCoachingCard, coachingSpeech, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons } from "./answer-step-buttons";
import type { SessionQuestion } from "../session-context";
import { READING_QUESTIONS_PER_PAGE } from "./reading-questions-panel";
import { normalizeSessionDomain } from "./session-ui-styles";
import { cn } from "@/lib/utils";

function formatSubmittedAnswer(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function resolveCorrectIndex(q: SessionQuestion | undefined): number | undefined {
  if (!q || !Array.isArray(q.options)) return undefined;
  const raw = q.correct;
  const idx = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return undefined;
  return idx;
}

function resolveCorrectAnswer(q: SessionQuestion | undefined): string | undefined {
  if (!q) return undefined;
  const idx = resolveCorrectIndex(q);
  if (idx != null) return q.options![idx];
  if (q.type === "agree_disagree" && q.answer) return q.answer;
  return undefined;
}

export function SessionFeedbackBar() {
  const {
    showFeedback, lastCorrect, currentQ, qIdx, questions, onNext, onRetryQuestion,
    session, studentLevel, activeDomain, selectedIdx, lastSubmittedAnswer,
    speakFeedback, onStopSpeaking,
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
  const domainKey = normalizeSessionDomain(session.content.type || activeDomain);
  const nextOnSameReadingPage =
    domainKey === "reading"
    && !isLastQuestion
    && Math.floor(qIdx / READING_QUESTIONS_PER_PAGE) === Math.floor((qIdx + 1) / READING_QUESTIONS_PER_PAGE);
  const advanceLabel = isLastQuestion
    ? "Finish"
    : nextOnSameReadingPage
      ? `Answer question ${qIdx + 2}`
      : "Next";

  useEffect(() => {
    if (!showFeedback || !studentId || !currentQ) {
      setCoach(null);
      setCoachSettled(false);
      return;
    }
    let cancelled = false;
    setCoachLoading(true);
    setCoachSettled(false);
    const submitted = formatSubmittedAnswer(lastSubmittedAnswer);
    const fallbackMc =
      selectedIdx >= 0 && currentQ.options?.[selectedIdx] != null
        ? String(currentQ.options[selectedIdx])
        : lastCorrect
          ? "correct"
          : "incorrect";
    request<ItemFeedbackPayload>(`/api/students/${studentId}/item-feedback`, {
      method: "POST",
      body: JSON.stringify({
        sessionId: session.sessionId,
        domain: (session.content.type || activeDomain).replace("_academic", ""),
        level: studentLevel,
        format: "selected_response",
        question: currentQ.question,
        studentAnswer: submitted || fallbackMc,
        correctAnswer: resolveCorrectAnswer(currentQ),
        correct: lastCorrect,
        passage: data?.audioScript ?? data?.passage,
        options: currentQ.options,
        framework: data?.framework ?? undefined,
        keyUse: session.keyUse ?? data?.keyUse ?? undefined,
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
  }, [showFeedback, lastCorrect, currentQ, studentId, studentLevel, activeDomain, session, data, request, selectedIdx, lastSubmittedAnswer]);

  return (
    <AnimatePresence>
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 min-w-0">
            <div className="mt-0.5 shrink-0 hidden sm:block">
              {coachLoading ? (
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 sm:hidden">
                {coachLoading ? (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
                ) : passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <p
                  className={cn(
                    "text-sm font-medium",
                    coachLoading && "text-muted-foreground",
                    !coachLoading && passed && "text-emerald-800 dark:text-emerald-200",
                    !coachLoading && !passed && "text-rose-800 dark:text-rose-200",
                  )}
                >
                  {coachLoading ? "Checking…" : passed ? "Correct" : "Not quite"}
                </p>
              </div>
              <p
                className={cn(
                  "text-sm font-medium hidden sm:block",
                  coachLoading && "text-muted-foreground",
                  !coachLoading && passed && "text-emerald-800 dark:text-emerald-200",
                  !coachLoading && !passed && "text-rose-800 dark:text-rose-200",
                )}
              >
                {coachLoading ? "Checking…" : passed ? "Correct" : "Not quite"}
              </p>
              <ItemCoachingCard
                feedback={coach}
                loading={coachLoading}
                speakText={speakFeedback}
                stopSpeaking={onStopSpeaking}
                nextAction={nextAction}
              />
              {!coachLoading && !coachingSpeech(coach) && currentQ?.explanation && (
                <p className="text-muted-foreground text-xs leading-snug">
                  {passed ? currentQ.explanation : currentQ.explanation}
                </p>
              )}
            </div>
            <div className="shrink-0 sm:ml-auto w-full sm:w-auto">
              <AnswerStepButtons
                loading={coachLoading}
                passed={passed}
                isLast={isLastQuestion}
                advanceLabel={advanceLabel}
                onAdvance={onNext}
                onRetry={onRetryQuestion}
                layout="row"
                domain={domainKey}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
