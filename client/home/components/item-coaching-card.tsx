import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  coachingSegmentLabel,
  inferToneFromPart,
  splitCoachingSegments,
  type CoachingTone,
} from "@/lib/coaching-speech";
import { prepareCoachingForSpeech } from "@/lib/prepare-text-for-speech";

export type ItemFeedbackPayload = {
  headline: string;
  whyWrong: string;
  correctAnswer: string;
  objectClue?: string;
  modelResponse: string;
  howToSayIt: string;
  keepInMind: string[];
  tryAgainTip: string;
  spokenText?: string;
  judgment?: "agree" | "partial" | "rejected";
  meetsTask: boolean;
  /** ACCESS writing rubric 0–7 (writing sessions only). */
  accessWritingScore?: number;
  accessWritingLabel?: string;
};

function stripNavCues(text: string): string {
  return text
    .replace(/\bthat answer works\.?\s*/gi, "")
    .replace(/\btap next\.?\s*/gi, "")
    .replace(/\btap try again(?:,? or skip to move on)?\.?\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function alreadySaid(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase().replace(/\s+/g, " ");
  const n = needle.toLowerCase().replace(/\s+/g, " ").trim();
  if (!n) return true;
  if (h.includes(n)) return true;
  const head = n.slice(0, Math.min(32, n.length));
  return head.length >= 20 && h.includes(head);
}

export function aiItemPassed(
  feedback: ItemFeedbackPayload | null | undefined,
  fallback = false,
): boolean {
  if (!feedback) return fallback;
  return Boolean(feedback.meetsTask || feedback.judgment === "agree");
}

export function speakingReadyToSave(feedback: ItemFeedbackPayload | null | undefined): boolean {
  return aiItemPassed(feedback);
}

function navCue(nextAction?: "next" | "retry" | "save", allowSkip = true): string {
  if (nextAction === "next" || nextAction === "save") return "Tap Next.";
  if (nextAction === "retry") {
    return allowSkip ? "Tap Try again, or Skip to move on." : "Tap Try again.";
  }
  return "";
}

/** Text for TTS — keeps *stress* and uses segmented prosody via speakSequence. */
export function coachingSpeech(
  feedback: ItemFeedbackPayload | null,
  extras?: { nextAction?: "next" | "retry" | "save"; loading?: boolean; allowSkip?: boolean },
): string {
  if (extras?.loading) return "";
  const allowSkip = extras?.allowSkip ?? true;
  if (!feedback) return navCue(extras?.nextAction, allowSkip);

  const parts: string[] = [];
  const body = stripNavCues(prepareCoachingForSpeech(feedback.spokenText ?? ""));
  if (body) parts.push(body);

  const cue = navCue(extras?.nextAction, allowSkip);
  if (cue && !alreadySaid(parts.join(" "), cue)) parts.push(cue);

  return parts.join(" ");
}

function CoachingStressText({ text }: { text: string }) {
  const bits = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {bits.map((bit, i) => {
        const stressed = /^\*([^*]+)\*$/.exec(bit);
        if (stressed) {
          return (
            <strong key={i} className="font-semibold text-amber-800 dark:text-amber-300">
              {stressed[1]}
            </strong>
          );
        }
        return <span key={i}>{bit}</span>;
      })}
    </>
  );
}

function segmentToneClass(tone: CoachingTone): string {
  switch (tone) {
    case "mistake":
      return "border-l-[3px] border-amber-500/80 pl-3 bg-amber-500/5 rounded-r-md py-1";
    case "teach":
      return "border-l-[3px] border-violet-500/50 pl-3 py-1";
    case "action":
      return "text-muted-foreground pl-0.5 pt-0.5";
    default:
      return "";
  }
}

export function ItemCoachingCard({
  feedback,
  loading,
  speakText,
  stopSpeaking: _stopSpeaking,
  nextAction,
  allowSkip = true,
}: {
  feedback: ItemFeedbackPayload | null;
  loading?: boolean;
  speakText?: (text: string) => void;
  stopSpeaking?: () => void;
  nextAction?: "next" | "retry" | "save";
  allowSkip?: boolean;
}) {
  const rawSpoken = (feedback?.spokenText ?? "").trim();
  const displayParts = splitCoachingSegments(stripNavCues(rawSpoken));
  const spokenAloud = coachingSpeech(feedback, { nextAction, loading, allowSkip });

  useEffect(() => {
    if (loading || !spokenAloud) return;
    speakText?.(spokenAloud);
  }, [spokenAloud, loading, speakText]);

  if (loading && displayParts.length === 0 && !rawSpoken) {
    return (
      <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Preparing feedback…
      </div>
    );
  }
  if (displayParts.length === 0 && !nextAction) return null;

  const rubricScore = feedback?.accessWritingScore;
  const rubricLabel = feedback?.accessWritingLabel?.trim();
  const multiPart = displayParts.length > 1;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-left space-y-2.5">
      {typeof rubricScore === "number" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/8 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-violet-700 dark:text-violet-300">
            {rubricScore}/7
          </span>
          {rubricLabel && (
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {rubricLabel}
            </span>
          )}
        </div>
      )}
      {displayParts.length > 0 && (
        <div className={cn("space-y-2.5", multiPart && "space-y-3")}>
          {displayParts.map((part, i) => {
            const tone = inferToneFromPart(part, i, displayParts.length);
            const label = multiPart ? coachingSegmentLabel(tone) : null;
            return (
              <div key={i} className={segmentToneClass(tone)}>
                {label && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    {label}
                  </p>
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  <CoachingStressText text={part} />
                </p>
              </div>
            );
          })}
        </div>
      )}
      {(nextAction === "next" || nextAction === "save") && (
        <p className="text-xs text-muted-foreground">Continue when ready.</p>
      )}
      {nextAction === "retry" && (
        <p className="text-xs text-muted-foreground">
          {allowSkip ? "Try again or skip to continue." : "Revise your answer and try again."}
        </p>
      )}
    </div>
  );
}
