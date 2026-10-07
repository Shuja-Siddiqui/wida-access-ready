import { BookOpen, Headphones, MessageCircle, PenLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildSessionTaskSpeechSegments, sessionTaskSpeechPreview } from "@/lib/session-task-speech";
import { ListenAgainButton } from "./listen-again-button";
import { SESSION_LABEL, SESSION_THEMES, type SessionDomainKey } from "./session-ui-styles";

const DOMAIN_META: Record<
  SessionDomainKey,
  {
    label: string;
    subtitle: string;
    Icon: typeof PenLine;
    storyLabel: string;
  }
> = {
  listening: {
    label: "Listening",
    subtitle: "Listen, then answer",
    Icon: Headphones,
    storyLabel: "Passage",
  },
  reading: {
    label: "Reading",
    subtitle: "Read the passage, then answer",
    Icon: BookOpen,
    storyLabel: "Passage",
  },
  speaking: {
    label: "Speaking",
    subtitle: "Listen, then record your answer",
    Icon: MessageCircle,
    storyLabel: "Prompt",
  },
  writing: {
    label: "Writing",
    subtitle: "Listen, then write your response",
    Icon: PenLine,
    storyLabel: "Prompt",
  },
};

export function SessionTaskCard({
  domain,
  data,
  speakTaskSession,
  onStopSpeaking,
  speaking,
  onWordTap,
  onFrameTap,
  onListen,
  listenLabel,
  className,
}: {
  domain: SessionDomainKey;
  data: Record<string, unknown>;
  speakTaskSession: (
    domain: SessionDomainKey,
    data: Record<string, unknown>,
    options?: { question?: string },
  ) => void;
  onStopSpeaking: () => void;
  speaking: boolean;
  onWordTap?: (word: string) => void;
  onFrameTap?: (frame: string) => void;
  onListen?: () => void;
  listenLabel?: string;
  className?: string;
}) {
  const theme = SESSION_THEMES[domain];
  const meta = DOMAIN_META[domain];
  const { Icon } = meta;

  const story =
    (typeof data.passage === "string" ? data.passage.trim() : "")
    || (typeof data.audioScript === "string" ? data.audioScript.trim() : "")
    || (typeof data.audio_script === "string" ? data.audio_script.trim() : "");
  const keyUse = typeof data.keyUse === "string" ? data.keyUse.trim() : "";
  const prompt = String(data.prompt ?? "");
  const wordBank = (data.wordBank ?? data.word_bank) as string[] | undefined;
  const frame =
    (typeof data.scaffold === "string" ? data.scaffold.trim() : "")
    || (typeof data.sentenceFrame === "string" ? data.sentenceFrame.trim() : "")
    || (typeof data.sentence_frame === "string" ? data.sentence_frame.trim() : "");
  const hasSpeech = buildSessionTaskSpeechSegments(domain, data).length > 0;

  return (
    <div className={cn("flex flex-col gap-4 min-w-0", className)}>
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={cn("w-4 h-4 shrink-0", theme.icon)} />
        <div className="min-w-0">
          <p className={cn("text-sm font-medium text-foreground truncate")}>
            {meta.label}
            {keyUse ? <span className="text-muted-foreground font-normal"> · {keyUse}</span> : null}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
        </div>
      </div>

      {story && (
        <div className="space-y-2">
          <p className={SESSION_LABEL}>{meta.storyLabel}</p>
          <p className="text-[15px] sm:text-base leading-[1.8] text-foreground/90 whitespace-pre-line">
            {story}
          </p>
        </div>
      )}

      {prompt && (
        <p className="text-[15px] sm:text-base leading-[1.8] text-foreground/90 whitespace-pre-line">
          {prompt}
        </p>
      )}

      {Array.isArray(wordBank) && wordBank.length > 0 && (
        <div className="space-y-2">
          <p className={cn(SESSION_LABEL, "flex items-center gap-1.5")}>
            <Sparkles className={cn("w-3 h-3", theme.icon)} />
            Vocabulary
          </p>
          <div className="flex flex-wrap gap-2">
            {wordBank.map((word) =>
              onWordTap ? (
                <button
                  key={word}
                  type="button"
                  onClick={() => onWordTap(word)}
                  className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                    theme.chip,
                    theme.chipHover,
                  )}
                >
                  {word}
                </button>
              ) : (
                <span
                  key={word}
                  className="px-3 py-1 rounded-full text-sm bg-muted/50 text-foreground/80"
                >
                  {word}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {frame && (
        onFrameTap ? (
          <button
            type="button"
            onClick={() => onFrameTap(frame)}
            className={cn(
              "w-full text-left rounded-lg px-3 py-2.5 transition-colors",
              theme.panel,
              theme.chipHover,
            )}
          >
            <p className={cn(SESSION_LABEL, "mb-1.5")}>
              {/_{3,}|_____/.test(frame) ? "Sentence frame" : "Starter"}
            </p>
            <p className="text-sm text-foreground/90 whitespace-pre-line">{frame}</p>
          </button>
        ) : (
          <div className={cn("rounded-lg px-3 py-2.5", theme.panel)}>
            <p className={cn(SESSION_LABEL, "mb-1.5")}>Sentence starter</p>
            <p className="text-sm text-foreground/90 whitespace-pre-line italic">
              &ldquo;{frame}&rdquo;
            </p>
          </div>
        )
      )}

      {hasSpeech && (
        <ListenAgainButton
          onListen={onListen ?? (() => speakTaskSession(domain, data))}
          onStop={onStopSpeaking}
          speaking={speaking}
          domain={domain}
          label={listenLabel}
          className="self-start"
          aria-label={
            listenLabel
            ?? `Listen again: ${sessionTaskSpeechPreview(domain, data).slice(0, 80)}`
          }
        />
      )}
    </div>
  );
}
