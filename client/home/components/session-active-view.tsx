import { useViewportPageLayout } from "@/components/app-layout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SessionFeedbackBar } from "./session-feedback-bar";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import { SessionWorkScroll } from "./session-work-scroll";
import { SessionTaskCard } from "./session-task-card";
import { ReadingQuestionsPanel, READING_QUESTIONS_PER_PAGE } from "./reading-questions-panel";
import { WritingSessionView } from "./writing-session-view";
import { SpeakingSessionView } from "./speaking-session-view";
import { SessionQuestionRenderer } from "./session-question-renderer";
import { SessionQuestionBlock } from "./session-question-block";
import { useSessionContext } from "../session-context";
import { SESSION_THEMES, normalizeSessionDomain } from "./session-ui-styles";

// ── Main component ───────────────────────────────────────────────────────────

export function SessionActiveView() {
  useViewportPageLayout();

  const {
    session, activeDomain, qIdx, questions, currentQ,
    showFeedback, selectedIdx, lastCorrect, answeredCount,
    writingText, setWritingText,
    recording, finalizingSpeaking,
    onAnswer, onAnswerNonMC, onStartRecording, onStopRecording, onSubmitWriting,
    sttSupported, sttTranscript, sttInterim, sttLevel, sttError,
    productionReview, onContinueProduction, onRetryProduction,
    speakPassage, speakFeedback, speakTaskSession, speakQuestion, onStopSpeaking, speaking, ttsLoading,
  } = useSessionContext();

  const content     = session.content;
  const type        = content.type;
  const data        = content.data;
  if (!data) return null;
  const theme       = SESSION_THEMES[normalizeSessionDomain(type ?? activeDomain)];
  const mediaUrl      = data.illustrationUrl ?? session.anchorImage?.url ?? null;
  const hasTaskContent = Boolean(
    data.passage || data.audioScript || data.prompt || data.scaffold || data.sentenceFrame || data.sentence_frame,
  );
  const isWriting      = type === "writing";
  const isSpeaking     = type === "speaking";
  const domainKey      = normalizeSessionDomain(type ?? activeDomain);
  const layoutClass    = "w-full flex-1 min-h-0 max-h-full flex flex-col overflow-hidden";

  const renderQuestion = (q: NonNullable<typeof currentQ>, domain: typeof domainKey) => (
    <SessionQuestionRenderer
      domain={domain}
      question={q}
      theme={theme}
      showFeedback={showFeedback}
      lastCorrect={lastCorrect}
      selectedIdx={selectedIdx}
      resetKey={qIdx}
      onAnswer={onAnswer}
      onAnswerNonMC={onAnswerNonMC}
    />
  );

  return (
    <>
      <div className="flex flex-1 min-h-0 w-full flex-col">
        <div
          className={cn(
            "flex flex-1 min-h-0 w-full flex-col",
            isWriting ? "py-1 sm:py-2" : domainKey === "reading" || domainKey === "listening" ? "py-2 sm:py-3" : "py-3 sm:py-4",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={
                domainKey === "reading" && questions.length > 1
                  ? `reading-page-${Math.floor(qIdx / READING_QUESTIONS_PER_PAGE)}`
                  : `q-${qIdx}`
              }
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={layoutClass}
            >
              {isWriting ? (
                <WritingSessionView
                  data={{
                    ...data,
                    keyUse: (data as { keyUse?: string }).keyUse ?? (session as { keyUse?: string }).keyUse,
                  }}
                  theme={theme}
                  writingText={writingText}
                  setWritingText={setWritingText}
                  onSubmitWriting={onSubmitWriting}
                  productionReview={
                    productionReview?.kind === "writing"
                      ? {
                          kind: "writing" as const,
                          text: productionReview.text,
                          feedback: productionReview.feedback,
                          loading: productionReview.loading,
                          tryCount: productionReview.tryCount,
                        }
                      : null
                  }
                  speakTaskSession={speakTaskSession}
                  speakFeedback={speakFeedback}
                  onStopSpeaking={onStopSpeaking}
                  speaking={speaking}
                  onContinueProduction={onContinueProduction}
                  onRetryProduction={onRetryProduction}
                  qIdx={qIdx}
                  questionCount={questions.length || 1}
                  mediaUrl={mediaUrl}
                  visual={data.visual}
                />
              ) : isSpeaking ? (
                <SpeakingSessionView
                  data={data}
                  theme={theme}
                  mediaUrl={mediaUrl}
                  visual={data.visual}
                  productionReview={
                    productionReview?.kind === "speaking"
                      ? {
                          kind: "speaking" as const,
                          text: productionReview.text,
                          feedback: productionReview.feedback,
                          loading: productionReview.loading,
                        }
                      : null
                  }
                  recording={recording}
                  finalizingSpeaking={finalizingSpeaking}
                  sttSupported={sttSupported}
                  sttTranscript={sttTranscript}
                  sttInterim={sttInterim}
                  sttLevel={sttLevel}
                  sttError={sttError}
                  onStartRecording={onStartRecording}
                  onStopRecording={onStopRecording}
                  speakTaskSession={speakTaskSession}
                  speakFeedback={speakFeedback}
                  onStopSpeaking={onStopSpeaking}
                  speaking={speaking}
                  onContinueProduction={onContinueProduction}
                  onRetryProduction={onRetryProduction}
                  qIdx={qIdx}
                  questionCount={questions.length || 1}
                />
              ) : (
              <SessionResponsiveLayout
                domain={domainKey}
                mediaUrl={mediaUrl}
                visual={data.visual}
                referenceLabel={type === "reading" ? "Picture" : "Reference"}
                referencePanel={
                  hasTaskContent ? (
                    <SessionTaskCard
                      domain={domainKey}
                      data={data}
                      speakTaskSession={speakTaskSession}
                      onStopSpeaking={onStopSpeaking}
                      speaking={speaking}
                      listenLabel={type === "reading" ? "Hear instructions" : undefined}
                      onListen={() => {
                        onStopSpeaking();
                        if (type === "reading") {
                          speakTaskSession("reading", data as Record<string, unknown>);
                          return;
                        }
                        const questionText = currentQ?.question?.trim() ?? "";
                        if (qIdx === 0) {
                          speakTaskSession(
                            domainKey,
                            data as Record<string, unknown>,
                            questionText ? { question: questionText } : undefined,
                          );
                        } else if (questionText) {
                          speakQuestion(questionText);
                        } else {
                          speakTaskSession(domainKey, data as Record<string, unknown>);
                        }
                      }}
                    />
                  ) : undefined
                }
              >
              <SessionWorkScroll footer={<SessionFeedbackBar />}>
              {domainKey === "reading" && questions.length > 0 && (
                <ReadingQuestionsPanel
                  questions={questions}
                  activeIdx={qIdx}
                  answeredCount={answeredCount}
                  showFeedback={showFeedback}
                  selectedIdx={selectedIdx}
                  onAnswer={onAnswer}
                  renderInteractiveQuestion={(q) => renderQuestion(q, "reading")}
                />
              )}

              {type === "listening" && currentQ && (
                <SessionQuestionBlock index={qIdx}>
                  {renderQuestion(currentQ, "listening")}
                </SessionQuestionBlock>
              )}

              </SessionWorkScroll>
              </SessionResponsiveLayout>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
