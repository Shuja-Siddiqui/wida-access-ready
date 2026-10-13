import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ListenAgainButton } from "./listen-again-button";
import { SESSION_LABEL, SESSION_SECTION_DIVIDER } from "./session-ui-styles";

/** Minimal question section — label + content, separated by a soft divider. */
export function SessionQuestionBlock({
  index,
  children,
  className,
  dimmed,
  listenToQuestion,
  questionSpeaking,
  onStopQuestionSpeech,
}: {
  index?: number;
  children: ReactNode;
  className?: string;
  dimmed?: boolean;
  /** Listening: replay the spoken question stem (passage uses Listen again in task card). */
  listenToQuestion?: () => void;
  questionSpeaking?: boolean;
  onStopQuestionSpeech?: () => void;
}) {
  return (
    <article
      className={cn(
        SESSION_SECTION_DIVIDER,
        "space-y-4 transition-opacity",
        dimmed && "opacity-50",
        className,
      )}
    >
      {index != null && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={SESSION_LABEL}>Question {index + 1}</p>
          {listenToQuestion && (
            <ListenAgainButton
              onListen={listenToQuestion}
              onStop={onStopQuestionSpeech}
              speaking={questionSpeaking}
              domain="listening"
              label="Listen to question"
              className="shrink-0"
            />
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </article>
  );
}
