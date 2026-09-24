import { PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { buildWritingSpeechSegments, writingSpeechPreview } from "@/lib/writing-speech";
import { ItemCoachingCard, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons, WRITING_ATTEMPTS_BEFORE_SKIP } from "./answer-step-buttons";
import { ListenAgainButton } from "./listen-again-button";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import { sessionScrollArea, type SessionTheme } from "./session-ui-styles";

interface WritingSessionViewProps {
  data: Record<string, unknown>;
  theme: SessionTheme;
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
  speakWritingSession: (data: Record<string, unknown>) => void;
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

function WritingTaskCard({
  data,
  theme,
  writingText,
  setWritingText,
  speakWritingSession,
  onStopSpeaking,
  speaking,
}: {
  data: Record<string, unknown>;
  theme: SessionTheme;
  writingText: string;
  setWritingText: (value: string) => void;
  speakWritingSession: (data: Record<string, unknown>) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
}) {
  const passage = typeof data.passage === "string" ? data.passage.trim() : "";
  const keyUse = typeof data.keyUse === "string" ? data.keyUse.trim() : "";
  const prompt = String(data.prompt ?? "");
  const hasSpeech = buildWritingSpeechSegments(data).length > 0;
  const wordBank = (data.wordBank ?? data.word_bank) as string[] | undefined;
  const sentenceFrame = (data.sentenceFrame ?? data.sentence_frame) as string | undefined;

  return (
    <div
      className={cn(
        "relative flex flex-col shrink-0 rounded-2xl border border-violet-500/20",
        "bg-card/55 backdrop-blur-xl shadow-[0_8px_40px_-16px_rgba(139,92,246,0.45)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent pointer-events-none" />

      <div className="shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", theme.iconWrap)}>
            <PenLine className={cn("w-3.5 h-3.5", theme.icon)} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400/90">
              Writing{keyUse ? ` · ${keyUse}` : ""}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {keyUse ? "Key language use — why this prompt looks the way it does" : "Read carefully, then compose your response"}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "px-4 sm:px-5 space-y-3.5",
          hasSpeech ? "pb-3" : "pb-4 sm:pb-5",
        )}
      >
          {passage && (
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400/90 shrink-0">
                Listen & read
              </p>
              <p className="text-[15px] sm:text-base leading-[1.75] text-foreground/95 whitespace-pre-line break-words">
                {passage}
              </p>
            </div>
          )}

          {prompt && (
            <p className="text-[15px] sm:text-base leading-[1.75] text-foreground/95 whitespace-pre-line break-words">
              {prompt}
            </p>
          )}

          {Array.isArray(wordBank) && wordBank.length > 0 && (
            <div className="pt-1 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-violet-400" />
                Vocabulary
              </p>
              <div className="flex flex-wrap gap-2">
                {wordBank.map((word, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setWritingText(writingText ? `${writingText.trimEnd()} ${word}` : word)
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      "border border-violet-500/25 bg-violet-500/6",
                      "hover:border-violet-400/50 hover:bg-violet-500/12 hover:shadow-[0_0_20px_-6px_rgba(139,92,246,0.55)]",
                    )}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sentenceFrame && (
            <button
              type="button"
              onClick={() => setWritingText(writingText || sentenceFrame)}
              className={cn(
                "w-full text-left rounded-xl border border-dashed border-violet-500/30",
                "bg-violet-500/4 px-4 py-3 transition-colors hover:bg-violet-500/8",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400/80 mb-1.5">
                {/_{3,}|_____/.test(sentenceFrame) ? "Sentence frame" : "Starter"}
              </p>
              <p className="text-sm text-foreground/90 whitespace-pre-line break-words">{sentenceFrame}</p>
            </button>
          )}
      </div>

      {hasSpeech && (
        <div className="shrink-0 px-5 sm:px-6 pb-5 sm:pb-6 pt-2 border-t border-violet-500/10 bg-card/40">
          <ListenAgainButton
            onListen={() => speakWritingSession(data)}
            onStop={onStopSpeaking}
            speaking={speaking}
            domain="writing"
            fullWidth
            aria-label={`Listen again: ${writingSpeechPreview(data).slice(0, 80)}`}
          />
        </div>
      )}
    </div>
  );
}

export function WritingSessionView({
  data,
  theme,
  writingText,
  setWritingText,
  onSubmitWriting,
  productionReview,
  speakWritingSession,
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

  return (
    <div className="relative flex flex-1 min-h-0 w-full flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -top-6 bottom-0 rounded-4xl bg-[radial-gradient(ellipse_at_top_left,rgba(139,92,246,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(217,70,239,0.08),transparent_50%)]"
      />

      <SessionResponsiveLayout
        domain="writing"
        mediaUrl={mediaUrl}
        visual={visual}
        referenceLabel="Reference"
        referencePanel={
          <WritingTaskCard
            data={data}
            theme={theme}
            writingText={writingText}
            setWritingText={setWritingText}
            speakWritingSession={speakWritingSession}
            onStopSpeaking={onStopSpeaking}
            speaking={speaking}
          />
        }
        className="relative flex-1 min-h-0"
      >
        <div className="flex flex-col min-h-0 gap-4 lg:h-full lg:max-h-full">
          <div
            className={cn(
              "flex flex-col min-h-[12rem] lg:flex-1 lg:min-h-0 overflow-hidden rounded-2xl border border-violet-500/15",
              "bg-background/70 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
              "ring-1 ring-white/4",
            )}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/20 shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Your response
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {words} {words === 1 ? "word" : "words"}
              </span>
            </div>

            <Textarea
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder="Compose your argument here…"
              className={cn(
                "flex-1 min-h-0 h-full border-0 rounded-none resize-none overflow-y-auto",
                "bg-transparent text-[15px] sm:text-base leading-[1.8] p-5 sm:p-6",
                "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50",
                sessionScrollArea("writing"),
              )}
            />
          </div>

          <div className="shrink-0 flex justify-end">
            <Button
              variant="ghost"
              className="btn-brand h-11 px-8 rounded-xl font-semibold border-0"
              onClick={() => onSubmitWriting(writingText)}
              disabled={writingText.trim().length < 1 || productionReview?.loading}
            >
              Submit response
            </Button>
          </div>

          {productionReview?.kind === "writing" && (
            <div className="shrink-0 space-y-3 pb-2">
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
          )}
        </div>
      </SessionResponsiveLayout>
    </div>
  );
}
