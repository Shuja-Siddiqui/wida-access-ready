import { PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { prepareTextForSpeech } from "@/lib/prepare-text-for-speech";
import { ItemCoachingCard, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons } from "./answer-step-buttons";
import { ListenAgainButton } from "./listen-again-button";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import type { SessionTheme } from "./session-ui-styles";

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
  } | null;
  speakPassage: (text: string) => void;
  speakFeedback: (text: string) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
  ttsLoading: boolean;
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

function writingPromptSpeech(data: Record<string, unknown>): string {
  return prepareTextForSpeech(
    [data.prompt, data.scaffold, data.sentenceFrame, data.sentence_frame]
      .filter((part) => typeof part === "string" && part)
      .join(". "),
  );
}

function WritingTaskCard({
  data,
  theme,
  writingText,
  setWritingText,
  speakPassage,
  onStopSpeaking,
  speaking,
  ttsLoading,
}: {
  data: Record<string, unknown>;
  theme: SessionTheme;
  writingText: string;
  setWritingText: (value: string) => void;
  speakPassage: (text: string) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
  ttsLoading: boolean;
}) {
  const prompt = String(data.prompt ?? "");
  const spoken = writingPromptSpeech(data);
  const wordBank = (data.wordBank ?? data.word_bank) as string[] | undefined;
  const sentenceFrame = (data.sentenceFrame ?? data.sentence_frame) as string | undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-violet-500/20",
        "bg-card/55 backdrop-blur-xl shadow-[0_8px_40px_-16px_rgba(139,92,246,0.45)]",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", theme.iconWrap)}>
            <PenLine className={cn("w-4 h-4", theme.icon)} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400/90">
              Writing task
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Read carefully, then compose your response</p>
          </div>
        </div>

        <p className="text-[15px] sm:text-base leading-[1.75] text-foreground/95 whitespace-pre-line">
          {prompt}
        </p>

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
            <p className="text-sm text-foreground/90 whitespace-pre-line">{sentenceFrame}</p>
          </button>
        )}

        {spoken && (
          <ListenAgainButton
            onListen={() => speakPassage(spoken)}
            onStop={onStopSpeaking}
            speaking={speaking}
            loading={ttsLoading}
            domain="writing"
            fullWidth
          />
        )}
      </div>
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
  speakPassage,
  speakFeedback,
  onStopSpeaking,
  speaking,
  ttsLoading,
  onContinueProduction,
  onRetryProduction,
  qIdx,
  questionCount,
  mediaUrl,
  visual,
}: WritingSessionViewProps) {
  const words = wordCount(writingText);

  return (
    <div className="relative w-full">
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
            speakPassage={speakPassage}
            onStopSpeaking={onStopSpeaking}
            speaking={speaking}
            ttsLoading={ttsLoading}
          />
        }
        className="relative"
      >
        <div className="flex flex-col lg:min-h-[min(72vh,40rem)]">
          <div
            className={cn(
              "flex-1 flex flex-col rounded-2xl border border-violet-500/15 overflow-hidden",
              "bg-background/70 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
              "ring-1 ring-white/4",
            )}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/20">
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
                "flex-1 min-h-[280px] lg:min-h-[min(50vh,28rem)] border-0 rounded-none resize-none",
                "bg-transparent text-[15px] sm:text-base leading-[1.8] p-5 sm:p-6",
                "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50",
              )}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              className={cn(
                "h-11 px-8 rounded-xl font-semibold text-white border-0",
                "bg-gradient-to-r from-violet-600 to-fuchsia-600",
                "hover:from-violet-500 hover:to-fuchsia-500",
                "shadow-lg shadow-violet-600/25",
              )}
              onClick={() => onSubmitWriting(writingText)}
              disabled={writingText.trim().length < 1 || productionReview?.loading}
            >
              Submit response
            </Button>
          </div>

          {productionReview?.kind === "writing" && (
            <div className="mt-6 space-y-3">
              <ItemCoachingCard
                feedback={productionReview.feedback}
                loading={productionReview.loading}
                speakText={speakFeedback}
                stopSpeaking={onStopSpeaking}
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
              />
            </div>
          )}
        </div>
      </SessionResponsiveLayout>
    </div>
  );
}
