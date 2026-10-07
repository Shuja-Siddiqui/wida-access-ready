import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ItemCoachingCard, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons, WRITING_ATTEMPTS_BEFORE_SKIP } from "./answer-step-buttons";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import { SessionTaskCard } from "./session-task-card";
import { SessionWorkScroll } from "./session-work-scroll";
import { SESSION_LABEL, sessionScrollArea } from "./session-ui-styles";
import type { SessionDomainKey } from "./session-ui-styles";

interface WritingSessionViewProps {
  data: Record<string, unknown>;
  theme: import("./session-ui-styles").SessionTheme;
  writingText: string;
  setWritingText: (value: string) => void;
  onSubmitWriting: (text: string) => void;
  productionReview: {
    kind: "writing";
    text: string;
    feedback: ItemFeedbackPayload | null;
    loading: boolean;
    tryCount?: number;
  } | null;
  speakTaskSession: (domain: SessionDomainKey, data: Record<string, unknown>) => void;
  speakFeedback: (text: string) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
  onContinueProduction: () => void;
  onRetryProduction: () => void;
  qIdx: number;
  questionCount: number;
  mediaUrl?: string | null;
  visual?: string | null;
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function WritingSessionView({
  data,
  writingText,
  setWritingText,
  onSubmitWriting,
  productionReview,
  speakTaskSession,
  speakFeedback,
  onStopSpeaking,
  speaking,
  onContinueProduction,
  onRetryProduction,
  qIdx,
  questionCount,
  mediaUrl,
  visual,
}: WritingSessionViewProps) {
  const words = wordCount(writingText);
  const writingTryCount = productionReview?.tryCount ?? 0;
  const allowSkip =
    aiItemPassed(productionReview?.feedback)
    || writingTryCount >= WRITING_ATTEMPTS_BEFORE_SKIP;
  const inReview = productionReview?.kind === "writing";

  return (
    <SessionResponsiveLayout
      domain="writing"
      mediaUrl={mediaUrl}
      visual={visual}
      referenceLabel="Reference"
      referencePanel={
        <SessionTaskCard
          domain="writing"
          data={data}
          speakTaskSession={speakTaskSession}
          onStopSpeaking={onStopSpeaking}
          speaking={speaking}
          onWordTap={(word) =>
            setWritingText(writingText ? `${writingText.trimEnd()} ${word}` : word)
          }
          onFrameTap={(frame) => setWritingText(writingText || frame)}
        />
      }
      className="flex-1 min-h-0"
    >
      <SessionWorkScroll
        footer={
          inReview ? (
            <div className="space-y-3">
              <ItemCoachingCard
                feedback={productionReview.feedback}
                loading={productionReview.loading}
                speakText={speakFeedback}
                stopSpeaking={onStopSpeaking}
                allowSkip={allowSkip}
                nextAction={
                  productionReview.loading
                    ? undefined
                    : aiItemPassed(productionReview.feedback)
                      ? "next"
                      : "retry"
                }
              />
              <AnswerStepButtons
                loading={productionReview.loading}
                passed={aiItemPassed(productionReview.feedback)}
                isLast={qIdx >= questionCount - 1}
                onAdvance={onContinueProduction}
                onRetry={onRetryProduction}
                allowSkip={allowSkip}
                domain="writing"
              />
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="btn-brand h-10 px-6 rounded-lg font-semibold border-0"
                onClick={() => onSubmitWriting(writingText)}
                disabled={writingText.trim().length < 1}
              >
                Submit response
              </Button>
            </div>
          )
        }
      >
        <div className="flex flex-col min-h-[12rem] lg:flex-1 lg:min-h-0 gap-2">
          <div className="flex items-center justify-between">
            <p className={SESSION_LABEL}>Your response</p>
            <span className="text-xs tabular-nums text-muted-foreground">
              {words} {words === 1 ? "word" : "words"}
            </span>
          </div>
          <Textarea
            value={writingText}
            onChange={(e) => setWritingText(e.target.value)}
            placeholder="Compose your response here…"
            disabled={inReview}
            className={cn(
              "flex-1 min-h-[10rem] lg:min-h-0 border-0 rounded-lg resize-none",
              "bg-muted/20 text-[15px] sm:text-base leading-[1.8] p-4",
              "focus-visible:ring-1 focus-visible:ring-border focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/50",
              sessionScrollArea("writing"),
            )}
          />
        </div>
      </SessionWorkScroll>
    </SessionResponsiveLayout>
  );
}
