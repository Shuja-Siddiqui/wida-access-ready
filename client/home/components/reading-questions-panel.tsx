import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StemVisual } from "@/components/shape-glyph";
import { SessionMcOptions } from "./session-mc-options";
import { SessionClassifyStatements } from "./session-interactive-questions";
import {
  SESSION_QUESTION,
  SESSION_SECTION_DIVIDER,
  SESSION_THEMES,
  SESSION_LABEL,
  type SessionTheme,
} from "./session-ui-styles";
import { resolveQuestionUi } from "@shared/session-content-schema";
import type { SessionQuestion } from "../session-context";

export const READING_QUESTIONS_PER_PAGE = 2;

export function readingQuestionUi(q: SessionQuestion) {
  return resolveQuestionUi("reading", q as unknown as Record<string, unknown>);
}

export function isMcReadingQuestion(q: SessionQuestion): boolean {
  return readingQuestionUi(q) === "multiple_choice";
}

export function isClassifyQuestion(q: SessionQuestion): boolean {
  return readingQuestionUi(q) === "classify";
}

export function isSequenceQuestion(q: SessionQuestion): boolean {
  return readingQuestionUi(q) === "sequence";
}

export function isMatchQuestion(q: SessionQuestion): boolean {
  return readingQuestionUi(q) === "match";
}

export interface ReadingQuestionSlotState {
  isActive: boolean;
  isDone: boolean;
  isLocked: boolean;
  showThisFeedback: boolean;
}

function QuestionBlock({
  index,
  isActive,
  isLocked,
  children,
}: {
  index: number;
  isActive: boolean;
  isDone: boolean;
  isLocked: boolean;
  children: ReactNode;
}) {
  return (
    <article
      className={cn(
        SESSION_SECTION_DIVIDER,
        "space-y-4 transition-opacity",
        isLocked && !isActive && "opacity-50",
      )}
    >
      <p className={cn(SESSION_LABEL, isActive && "text-foreground/80")}>
        Question {index + 1}
      </p>
      <div className="space-y-4">{children}</div>
    </article>
  );
}

function NonMcReadOnlyBody({ q, theme }: { q: SessionQuestion; theme: SessionTheme }) {
  if (isClassifyQuestion(q)) {
    return (
      <SessionClassifyStatements
        categories={q.categories!}
        items={q.items!}
        theme={theme}
        showFeedback={false}
        readOnly
      />
    );
  }

  if (isSequenceQuestion(q)) {
    return (
      <div className="flex flex-wrap gap-2">
        {q.items!.map((item, i) => (
          <span key={i} className="px-3 py-1 rounded-full text-sm bg-muted/50">
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (isMatchQuestion(q)) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <ul className="space-y-2">
          {q.left!.map((item, li) => (
            <li key={li} className="text-sm text-foreground/85">{item}</li>
          ))}
        </ul>
        <ul className="space-y-2">
          {q.right!.map((item, ri) => (
            <li key={ri} className="text-sm text-foreground/85">{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
}

function NonMcReadOnlyCard({
  q,
  index,
  slot,
  theme,
  waitingForAdvance,
}: {
  q: SessionQuestion;
  index: number;
  slot: ReadingQuestionSlotState;
  theme: SessionTheme;
  waitingForAdvance: boolean;
}) {
  return (
    <QuestionBlock index={index} isActive={slot.isActive} isDone={slot.isDone} isLocked={slot.isLocked}>
      <StemVisual visual={q.visual} />
      <h3 className={SESSION_QUESTION}>{q.question}</h3>
      <NonMcReadOnlyBody q={q} theme={theme} />
      {waitingForAdvance && (
        <p className="text-xs text-muted-foreground">
          Continue below to answer this question.
        </p>
      )}
    </QuestionBlock>
  );
}

export function ReadingQuestionsPanel({
  questions,
  activeIdx,
  answeredCount,
  showFeedback,
  selectedIdx,
  onAnswer,
  renderInteractiveQuestion,
}: {
  questions: SessionQuestion[];
  activeIdx: number;
  answeredCount: number;
  showFeedback: boolean;
  selectedIdx: number;
  onAnswer: (optionIdx: number) => void;
  renderInteractiveQuestion?: (q: SessionQuestion) => ReactNode;
}) {
  const theme = SESSION_THEMES.reading;
  const [viewPage, setViewPage] = useState(0);

  useEffect(() => {
    setViewPage(Math.floor(activeIdx / READING_QUESTIONS_PER_PAGE));
  }, [activeIdx]);

  if (questions.length === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(questions.length / READING_QUESTIONS_PER_PAGE));
  const start = viewPage * READING_QUESTIONS_PER_PAGE;
  const visible = questions.slice(start, start + READING_QUESTIONS_PER_PAGE);

  return (
    <div className="space-y-2">
      {visible.map((q, slotIdx) => {
        const globalIdx = start + slotIdx;
        const isActive = globalIdx === activeIdx;
        const isDone = globalIdx < answeredCount;
        const isLocked = globalIdx > activeIdx;
        const showThisFeedback = isActive && showFeedback;
        const slot: ReadingQuestionSlotState = { isActive, isDone, isLocked, showThisFeedback };
        const waitingForAdvance = isLocked && globalIdx === activeIdx + 1 && answeredCount > activeIdx && showFeedback;

        if (isMcReadingQuestion(q)) {
          return (
            <QuestionBlock key={q.id ?? globalIdx} index={globalIdx} isActive={isActive} isDone={isDone} isLocked={isLocked}>
              <StemVisual visual={q.visual} />
              <h3 className={SESSION_QUESTION}>{q.question}</h3>
              {Array.isArray(q.options) && (
                <SessionMcOptions
                  options={q.options}
                  diagrams={q.optionDiagrams}
                  correct={typeof q.correct === "number" ? q.correct : 0}
                  selectedIdx={isActive ? selectedIdx : -1}
                  showFeedback={showThisFeedback || isDone}
                  onSelect={onAnswer}
                  theme={theme}
                  disabled={!isActive || isDone}
                />
              )}
              {isDone && !showThisFeedback && q.explanation && (
                <p className="text-xs text-muted-foreground leading-snug">{q.explanation}</p>
              )}
            </QuestionBlock>
          );
        }

        if (isActive && renderInteractiveQuestion) {
          const body = renderInteractiveQuestion(q);
          if (body) {
            return (
              <QuestionBlock key={q.id ?? globalIdx} index={globalIdx} isActive isDone={false} isLocked={false}>
                {body}
              </QuestionBlock>
            );
          }
        }

        return (
          <NonMcReadOnlyCard
            key={q.id ?? globalIdx}
            q={q}
            index={globalIdx}
            slot={slot}
            theme={theme}
            waitingForAdvance={waitingForAdvance}
          />
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" disabled={viewPage <= 0} onClick={() => setViewPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {start + 1}–{Math.min(start + READING_QUESTIONS_PER_PAGE, questions.length)} of {questions.length}
          </span>
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" disabled={viewPage >= totalPages - 1} onClick={() => setViewPage((p) => Math.min(totalPages - 1, p + 1))}>
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
