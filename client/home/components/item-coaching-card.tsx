import { useEffect } from "react";
import { prepareTextForSpeech } from "@/lib/prepare-text-for-speech";

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
};

function visibleSpeech(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1");
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

function stripNavCues(text: string): string {
  return text
    .replace(/\bthat answer works\.?\s*/gi, "")
    .replace(/\btap next\.?\s*/gi, "")
    .replace(/\btap try again(?:,? or skip to move on)?\.?\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function navCue(nextAction?: "next" | "retry" | "save"): string {
  if (nextAction === "next" || nextAction === "save") return "Tap Next.";
  if (nextAction === "retry") return "Tap Try again, or Skip to move on.";
  return "";
}

export function coachingSpeech(
  feedback: ItemFeedbackPayload | null,
  extras?: { nextAction?: "next" | "retry" | "save"; loading?: boolean },
): string {
  if (extras?.loading) return "";
  if (!feedback) return navCue(extras?.nextAction);

  const parts: string[] = [];
  const body = stripNavCues(prepareTextForSpeech(feedback.spokenText ?? ""));
  if (body) parts.push(body);

  const cue = navCue(extras?.nextAction);
  if (cue && !alreadySaid(parts.join(" "), cue)) parts.push(cue);

  return parts.join(" ");
}

export function ItemCoachingCard({
  feedback,
  loading,
  speakText,
  stopSpeaking: _stopSpeaking,
  nextAction,
}: {
  feedback: ItemFeedbackPayload | null;
  loading?: boolean;
  speakText?: (text: string) => void;
  stopSpeaking?: () => void;
  /** Tell the student whether to go Next or Try again / Skip. */
  nextAction?: "next" | "retry" | "save";
}) {
  const bodyText = visibleSpeech((feedback?.spokenText ?? "").trim());
  const spokenAloud = coachingSpeech(feedback, { nextAction, loading });

  useEffect(() => {
    if (loading || !spokenAloud) return;
    speakText?.(spokenAloud);
    // speakText/stopSpeaking omitted so a new function identity does not replay audio
  }, [spokenAloud, loading]);

  if (loading && !bodyText) {
    return (
      <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Preparing feedback…
      </div>
    );
  }
  if (!bodyText && !nextAction) return null;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-left space-y-2.5">
      {bodyText && (
        <p className="text-sm text-foreground leading-relaxed">{bodyText}</p>
      )}
      {nextAction === "retry" && feedback?.modelResponse?.trim() && (
        <div className="rounded-md border border-border/60 bg-background px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">
            Example
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {visibleSpeech(feedback.modelResponse.trim())}
          </p>
        </div>
      )}
      {(nextAction === "next" || nextAction === "save") && (
        <p className="text-xs text-muted-foreground">
          Continue when ready.
        </p>
      )}
      {nextAction === "retry" && (
        <p className="text-xs text-muted-foreground">
          Try again or skip to continue.
        </p>
      )}
    </div>
  );
}
