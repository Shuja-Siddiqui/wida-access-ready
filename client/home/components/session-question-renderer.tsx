import { resolveQuestionUi, type SessionDomain } from "@shared/session-content-schema";
import { StemVisual } from "@/components/shape-glyph";
import type { SessionQuestion } from "../session-context";
import { SessionImageGrid } from "./session-image-grid";
import { SessionMcOptions } from "./session-mc-options";
import { SessionObjectDetect } from "./session-object-detect";
import {
  SessionAgreeDisagreeQuestion,
  SessionClassifyQuestion,
  SessionMatchQuestion,
  SessionSequenceQuestion,
} from "./session-interactive-questions";
import { SessionUnsupportedQuestion } from "./session-unsupported-question";
import { SESSION_QUESTION, type SessionTheme } from "./session-ui-styles";

export interface SessionQuestionRendererProps {
  domain: SessionDomain | "listening_l12";
  question: SessionQuestion;
  theme: SessionTheme;
  showFeedback: boolean;
  lastCorrect: boolean;
  selectedIdx: number;
  resetKey: number;
  onAnswer: (idx: number) => void;
  onAnswerNonMC: (submittedAnswer: unknown, isCorrect: boolean) => void;
}

export function SessionQuestionRenderer({
  domain,
  question: q,
  theme,
  showFeedback,
  lastCorrect,
  selectedIdx,
  resetKey,
  onAnswer,
  onAnswerNonMC,
}: SessionQuestionRendererProps) {
  const ui = resolveQuestionUi(domain, q as unknown as Record<string, unknown>);

  if (ui === "image_grid") {
    return <SessionImageGrid />;
  }

  if (ui === "object_detect" && q.imageSrc) {
    return (
      <SessionObjectDetect
        showLabels={false}
        currentQ={{
          question: q.question,
          imageSrc: q.imageSrc,
          labels: q.options ?? [],
          correctLabel: (q.options ?? [])[typeof q.correct === "number" ? q.correct : 0] ?? "",
        }}
        showFeedback={showFeedback}
        selectedLabel={selectedIdx >= 0 ? (q.options ?? [])[selectedIdx] ?? "" : ""}
        onAnswer={(label) => {
          const idx = (q.options ?? []).indexOf(label);
          if (idx !== -1) onAnswer(idx);
        }}
      />
    );
  }

  if (ui === "sequence" && q.items && q.correct_order) {
    return (
      <SessionSequenceQuestion
        question={q.question}
        items={q.items}
        correctOrder={q.correct_order}
        theme={theme}
        showFeedback={showFeedback}
        lastCorrect={lastCorrect}
        onAnswerNonMC={onAnswerNonMC}
        resetKey={resetKey}
      />
    );
  }

  if (ui === "match") {
    const left = q.left ?? q.left_items ?? [];
    const right = q.right ?? q.right_items ?? [];
    if (left.length && right.length && q.correct_pairs) {
      return (
        <SessionMatchQuestion
          question={q.question}
          left={left}
          right={right}
          correctPairs={q.correct_pairs}
          theme={theme}
          showFeedback={showFeedback}
          lastCorrect={lastCorrect}
          onAnswerNonMC={onAnswerNonMC}
          resetKey={resetKey}
        />
      );
    }
  }

  if (ui === "classify" && q.categories && q.items) {
    const correct = Array.isArray(q.correct_categories)
      ? q.correct_categories
      : Array.isArray(q.correct)
        ? (q.correct as number[])
        : [];
    if (correct.length) {
      return (
        <SessionClassifyQuestion
          question={q.question}
          categories={q.categories}
          items={q.items}
          correct={correct}
          theme={theme}
          showFeedback={showFeedback}
          lastCorrect={lastCorrect}
          onAnswerNonMC={onAnswerNonMC}
          resetKey={resetKey}
        />
      );
    }
  }

  if (ui === "agree_disagree") {
    return (
      <SessionAgreeDisagreeQuestion
        question={q.question}
        answer={q.answer}
        theme={theme}
        showFeedback={showFeedback}
        lastCorrect={lastCorrect}
        onAnswerNonMC={onAnswerNonMC}
        resetKey={resetKey}
      />
    );
  }

  if (ui === "multiple_choice" && q.options?.length) {
    return (
      <>
        <StemVisual visual={q.visual} />
        <h3 className={SESSION_QUESTION}>{q.question}</h3>
        <SessionMcOptions
          options={q.options}
          diagrams={q.optionDiagrams}
          correct={typeof q.correct === "number" ? q.correct : 0}
          selectedIdx={selectedIdx}
          showFeedback={showFeedback}
          onSelect={onAnswer}
          theme={theme}
        />
      </>
    );
  }

  return <SessionUnsupportedQuestion question={q.question} type={q.type} />;
}
