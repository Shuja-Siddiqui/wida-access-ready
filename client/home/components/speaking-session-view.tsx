import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemCoachingCard, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons } from "./answer-step-buttons";
import { ListenAgainButton } from "./listen-again-button";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import { SESSION_CARD, SESSION_LABEL, SESSION_QUESTION, type SessionTheme } from "./session-ui-styles";
import { prepareTextForSpeech } from "@/lib/prepare-text-for-speech";

interface SpeakingSessionViewProps {
  data: Record<string, unknown>;
  theme: SessionTheme;
  mediaUrl?: string | null;
  visual?: string | null;
  productionReview: {
    kind: "speaking";
    text: string;
    feedback: ItemFeedbackPayload | null;
    loading: boolean;
  } | null;
  recording: boolean;
  finalizingSpeaking: boolean;
  sttSupported: boolean;
  sttTranscript: string;
  sttInterim: string;
  sttLevel: number;
  sttError: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  speakPassage: (text: string) => void;
  speakFeedback: (text: string) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
  onContinueProduction: () => void;
  onRetryProduction: () => void;
  qIdx: number;
  questionCount: number;
}

function promptSpeechText(data: Record<string, unknown>): string {
  return prepareTextForSpeech(
    [data.prompt, data.scaffold].filter((part) => typeof part === "string" && part).join(". "),
  );
}

function SpeakingPromptCard({
  data,
  theme,
  speakPassage,
  onStopSpeaking,
  speaking,
}: {
  data: Record<string, unknown>;
  theme: SessionTheme;
  speakPassage: (text: string) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
}) {
  const spoken = promptSpeechText(data);

  return (
    <div className={cn("p-5 sm:p-6 space-y-4", SESSION_CARD, theme.panel)}>
      <p className={SESSION_LABEL}>Speaking prompt</p>
      <h3 className={cn(SESSION_QUESTION, "mt-2")}>{String(data.prompt ?? "")}</h3>
      {typeof data.scaffold === "string" && data.scaffold && (
        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
          Suggested start:{" "}
          <span className="text-foreground/85 italic">&ldquo;{data.scaffold}&rdquo;</span>
        </p>
      )}
      {spoken && (
        <ListenAgainButton
          onListen={() => speakPassage(spoken)}
          onStop={onStopSpeaking}
          speaking={speaking}
          domain="speaking"
          fullWidth
        />
      )}
    </div>
  );
}

export function SpeakingSessionView({
  data,
  theme,
  mediaUrl,
  visual,
  productionReview,
  recording,
  finalizingSpeaking,
  sttSupported,
  sttTranscript,
  sttInterim,
  sttLevel,
  sttError,
  onStartRecording,
  onStopRecording,
  speakPassage,
  speakFeedback,
  onStopSpeaking,
  speaking,
  onContinueProduction,
  onRetryProduction,
  qIdx,
  questionCount,
}: SpeakingSessionViewProps) {
  const inReview = productionReview?.kind === "speaking";

  return (
    <SessionResponsiveLayout
      domain="speaking"
      mediaUrl={mediaUrl}
      visual={visual}
      referenceLabel="Look at the picture"
      referencePanel={
        !inReview ? (
          <SpeakingPromptCard
            data={data}
            theme={theme}
            speakPassage={speakPassage}
            onStopSpeaking={onStopSpeaking}
            speaking={speaking}
          />
        ) : undefined
      }
    >
      {inReview ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You said:{" "}
            <span className="text-foreground font-medium">&ldquo;{productionReview.text}&rdquo;</span>
          </p>
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
      ) : (
        <div className={cn("p-5 sm:p-6 space-y-4", SESSION_CARD)}>
          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={finalizingSpeaking}
              className={cn(
                "relative shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-white transition-colors disabled:opacity-60",
                recording ? "bg-rose-600 hover:bg-rose-700" : theme.primaryBtn,
              )}
              onClick={recording ? onStopRecording : onStartRecording}
            >
              {finalizingSpeaking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : recording ? (
                <Square className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">
                {finalizingSpeaking
                  ? "Processing speech…"
                  : recording
                    ? "Recording — tap to stop"
                    : "Record your response"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {recording
                  ? "Speak clearly, then stop when finished."
                  : "Tap the button when you are ready."}
              </p>
            </div>
          </div>

          {(recording || finalizingSpeaking) && (
            <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 space-y-2">
              {recording && (
                <div className="flex items-end gap-0.5 h-5" aria-hidden>
                  {Array.from({ length: 12 }, (_, i) => {
                    const on = sttLevel > (i + 1) / 12;
                    return (
                      <span
                        key={i}
                        className={cn("w-0.5 rounded-full transition-all", on ? "bg-emerald-500" : "bg-border")}
                        style={{ height: `${6 + (i % 4) * 3}px` }}
                      />
                    );
                  })}
                </div>
              )}
              <p className={SESSION_LABEL}>Transcript</p>
              <p className="text-sm text-foreground min-h-10 leading-relaxed">
                {sttTranscript}
                {sttInterim && <span className="text-muted-foreground"> {sttInterim}</span>}
                {!sttTranscript && !sttInterim && (
                  <span className="text-muted-foreground italic">
                    {finalizingSpeaking
                      ? "Finishing transcription…"
                      : sttSupported
                        ? "Speak now — words will appear here."
                        : "Your browser can't show live words, but we are still recording."}
                  </span>
                )}
              </p>
            </div>
          )}
          {sttError && <p className="text-xs text-destructive">{sttError}</p>}
        </div>
      )}
    </SessionResponsiveLayout>
  );
}
