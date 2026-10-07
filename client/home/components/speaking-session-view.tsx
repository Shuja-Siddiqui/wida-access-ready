import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemCoachingCard, aiItemPassed, type ItemFeedbackPayload } from "./item-coaching-card";
import { AnswerStepButtons } from "./answer-step-buttons";
import { SessionResponsiveLayout } from "./session-responsive-layout";
import { SessionTaskCard } from "./session-task-card";
import { SessionWorkScroll } from "./session-work-scroll";
import {
  SESSION_LABEL,
  SESSION_QUESTION,
  sessionScrollArea,
  type SessionDomainKey,
  type SessionTheme,
} from "./session-ui-styles";

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
  speakTaskSession: (domain: SessionDomainKey, data: Record<string, unknown>) => void;
  speakFeedback: (text: string) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
  onContinueProduction: () => void;
  onRetryProduction: () => void;
  qIdx: number;
  questionCount: number;
}

function SpeakingRecorderWorkspace({
  theme,
  recording,
  finalizingSpeaking,
  sttSupported,
  sttTranscript,
  sttInterim,
  sttLevel,
  sttError,
  onStartRecording,
  onStopRecording,
}: {
  theme: SessionTheme;
  recording: boolean;
  finalizingSpeaking: boolean;
  sttSupported: boolean;
  sttTranscript: string;
  sttInterim: string;
  sttLevel: number;
  sttError: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  const active = recording || finalizingSpeaking;
  const hasTranscript = Boolean(sttTranscript || sttInterim);

  return (
    <div className="flex flex-col min-h-0 flex-1 gap-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={finalizingSpeaking}
          className={cn(
            "relative shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-60",
            recording ? "bg-rose-600 hover:bg-rose-700" : theme.primaryBtn,
          )}
          onClick={recording ? onStopRecording : onStartRecording}
        >
          {finalizingSpeaking ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : recording ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {finalizingSpeaking
              ? "Processing speech…"
              : recording
                ? "Recording — tap to stop"
                : "Your turn — record your answer"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {recording
              ? "Speak clearly, then stop when finished."
              : "Tap the mic when you are ready to respond."}
          </p>
        </div>
      </div>

      {recording && (
        <div className="flex items-end gap-0.5 h-5" aria-hidden>
          {Array.from({ length: 16 }, (_, i) => {
            const on = sttLevel > (i + 1) / 16;
            return (
              <span
                key={i}
                className={cn("w-0.5 rounded-full transition-all", on ? "bg-emerald-500" : "bg-border")}
                style={{ height: `${8 + (i % 5) * 4}px` }}
              />
            );
          })}
        </div>
      )}

      <div className={cn("flex flex-col flex-1 min-h-[8rem] gap-2", sessionScrollArea("speaking"))}>
        <p className={SESSION_LABEL}>Your response</p>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <p className="text-[15px] sm:text-base text-foreground leading-[1.8] whitespace-pre-wrap">
            {sttTranscript}
            {sttInterim && <span className="text-muted-foreground"> {sttInterim}</span>}
            {!hasTranscript && (
              <span className="text-muted-foreground italic">
                {finalizingSpeaking
                  ? "Finishing transcription…"
                  : active
                    ? "Speak now — words will appear here."
                    : sttSupported
                      ? "Start recording and your words will show up here."
                      : "Start recording — we will capture your response."}
              </span>
            )}
          </p>
        </div>
      </div>

      {sttError && <p className="text-xs text-destructive">{sttError}</p>}
    </div>
  );
}

function SpeakingReviewFooter({
  productionReview,
  speakFeedback,
  onStopSpeaking,
  qIdx,
  questionCount,
  onContinueProduction,
  onRetryProduction,
}: {
  productionReview: NonNullable<SpeakingSessionViewProps["productionReview"]>;
  speakFeedback: (text: string) => void;
  onStopSpeaking: () => void;
  qIdx: number;
  questionCount: number;
  onContinueProduction: () => void;
  onRetryProduction: () => void;
}) {
  const passed = aiItemPassed(productionReview.feedback);
  return (
    <div className="space-y-3">
      <p className={SESSION_LABEL}>You said</p>
      <p className="text-base text-foreground/90 leading-relaxed italic">
        &ldquo;{productionReview.text}&rdquo;
      </p>
      <ItemCoachingCard
        feedback={productionReview.feedback}
        loading={productionReview.loading}
        speakText={speakFeedback}
        stopSpeaking={onStopSpeaking}
        nextAction={
          productionReview.loading ? undefined : passed ? "next" : "retry"
        }
      />
      <AnswerStepButtons
        loading={productionReview.loading}
        passed={passed}
        isLast={qIdx >= questionCount - 1}
        onAdvance={onContinueProduction}
        onRetry={onRetryProduction}
        domain="speaking"
      />
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
  speakTaskSession,
  speakFeedback,
  onStopSpeaking,
  speaking,
  onContinueProduction,
  onRetryProduction,
  qIdx,
  questionCount,
}: SpeakingSessionViewProps) {
  const inReview = productionReview?.kind === "speaking";
  const hasMedia = Boolean(mediaUrl || visual);

  return (
    <SessionResponsiveLayout
      domain="speaking"
      mediaUrl={mediaUrl}
      visual={visual}
      referenceLabel={hasMedia ? "Picture" : undefined}
      referencePanel={
        <SessionTaskCard
          domain="speaking"
          data={data}
          speakTaskSession={speakTaskSession}
          onStopSpeaking={onStopSpeaking}
          speaking={speaking}
        />
      }
      className="flex-1 min-h-0"
    >
      <SessionWorkScroll
        footer={
          inReview && productionReview ? (
            <SpeakingReviewFooter
              productionReview={productionReview}
              speakFeedback={speakFeedback}
              onStopSpeaking={onStopSpeaking}
              qIdx={qIdx}
              questionCount={questionCount}
              onContinueProduction={onContinueProduction}
              onRetryProduction={onRetryProduction}
            />
          ) : undefined
        }
      >
        {!inReview && (
          <SpeakingRecorderWorkspace
            theme={theme}
            recording={recording}
            finalizingSpeaking={finalizingSpeaking}
            sttSupported={sttSupported}
            sttTranscript={sttTranscript}
            sttInterim={sttInterim}
            sttLevel={sttLevel}
            sttError={sttError}
            onStartRecording={onStartRecording}
            onStopRecording={onStopRecording}
          />
        )}
      </SessionWorkScroll>
    </SessionResponsiveLayout>
  );
}
